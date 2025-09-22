import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OpenRouterRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  max_tokens?: number
  temperature?: number
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage: {
    total_tokens: number
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the request body
    const { action, content, context, model = 'openai/gpt-3.5-turbo' } = await req.json()
    
    // Debug logging
    console.log('🤖 AI request received:', { action, model, contentLength: content?.length, contextLength: context?.length })

    // Get OpenRouter API key from secrets
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openRouterApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare the prompt based on action
    let systemPrompt = ''
    let userMessage = ''

    switch (action) {
      case 'summarize':
        systemPrompt = `You are Zenith, an intelligent study companion. Create a comprehensive yet concise summary that helps students understand and retain key information.

Format your summary with:
- **Main Topic**: Clear identification of the subject
- **Key Concepts**: 3-5 most important points
- **Important Details**: Supporting information for each concept
- **Study Tips**: Practical advice for remembering this material
- **Related Topics**: Suggestions for further study

Make it scannable with bullet points and clear headings. Focus on what's most important for learning and retention.`
        userMessage = `Please create a study-friendly summary of this content:\n\n${content}`
        break
      
      case 'definitions':
        systemPrompt = `You are Zenith, an intelligent study companion. Provide comprehensive definitions that help students truly understand terms and concepts.

For each term, include:
- **Definition**: Clear, accurate definition
- **Context**: How it relates to the broader subject
- **Example**: Real-world or academic example
- **Memory Tip**: Mnemonic or way to remember it
- **Related Terms**: Other concepts students should know

Format each definition clearly with headings and bullet points for easy scanning.`
        userMessage = `Please provide comprehensive definitions for these terms:\n\n${content}`
        break
      
      case 'study-help':
        systemPrompt = `You are Zenith, an intelligent study companion. Provide comprehensive study assistance that helps students understand and master their material.

Your approach:
1. **Direct Answer**: Address the specific question clearly
2. **Context Integration**: Reference the provided content directly
3. **Step-by-Step Explanation**: Break down complex concepts
4. **Examples & Analogies**: Use relatable examples to clarify
5. **Study Strategies**: Suggest how to remember and apply this knowledge
6. **Follow-up Questions**: Encourage deeper thinking
7. **Related Concepts**: Connect to broader learning goals

Format responses with clear headings, bullet points, and actionable advice.`
        userMessage = `Context:\n${context}\n\nQuestion: ${content}`
        break
      
      case 'chat':
        systemPrompt = `You are Zenith, an intelligent study companion designed to help students learn more effectively. Your role is to:

1. **Context-Aware Assistance**: When provided with selected text or document context, focus your response specifically on that content
2. **Educational Focus**: Provide clear, educational explanations that help the user understand concepts better
3. **Study-Friendly Format**: Structure responses with clear headings, bullet points, and examples when helpful
4. **Encourage Learning**: Ask follow-up questions or suggest related topics to deepen understanding
5. **Be Concise but Complete**: Provide thorough answers without unnecessary fluff
6. **Academic Tone**: Use an encouraging, professional tone suitable for students

Guidelines:
- If context is provided, always reference it directly in your response
- Use examples and analogies to clarify complex concepts
- Suggest practical study strategies when relevant
- Ask clarifying questions if the user's question is unclear
- Keep responses focused and actionable`
        
        if (context) {
          userMessage = `Context:\n${context}\n\nUser Question: ${content}`
        } else {
          userMessage = content
        }

        // If the user message already includes the selected text, use that directly
        if (content.includes('Regarding this text:') || content.includes('Question:')) {
          userMessage = content
        }
        break
      
      case 'flashcard':
        systemPrompt = `You are Zenith, an intelligent study companion. Your task is to REFINE and CLEAN UP existing flashcard content, NOT to completely rewrite it.

The user has already selected specific text for the front and back of their flashcard. Your job is to:

**MINIMAL CHANGES ONLY:**
1. **Fix grammar and spelling** if needed
2. **Remove redundant words** or awkward phrasing
3. **Improve clarity** without changing meaning
4. **Format properly** with:
   - Proper line breaks for readability
   - Numbered lists (1. 2. 3.) where appropriate
   - Bullet points (• or -) for lists
   - Clean punctuation and capitalization
   - Remove extra spaces or weird formatting
5. **Keep the original intent** and content

**FORMATTING EXAMPLES:**
- If text has multiple points → Format as numbered list or bullet points
- If text is a definition → Clean up punctuation and structure
- If text has steps → Format as numbered sequence
- If text is messy → Add proper line breaks and spacing

**DO NOT:**
- Completely rewrite the content
- Change the core meaning or concepts
- Add new information not in the original text
- Make major structural changes

**IMPORTANT:** Make only small, conservative improvements with better formatting. The user chose this text for a reason.

Format your response as JSON:
{
  "front": "Cleaned up front text with proper formatting",
  "back": "Cleaned up back text with proper formatting"
}`

        userMessage = `Please clean up and refine this flashcard content (make minimal changes only):\n\n${content}`
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Supported actions: summarize, definitions, study-help, chat, flashcard' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    // Prepare the OpenRouter request
    const openRouterRequest: OpenRouterRequest = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 2000, // Increased for more comprehensive responses
      temperature: 0.6 // Slightly lower for more focused, educational responses
    }


    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://zenith-study-app.vercel.app', // Your app URL
        'X-Title': 'Zenith Study App'
      },
      body: JSON.stringify(openRouterRequest)
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error('OpenRouter API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openRouterData: OpenRouterResponse = await openRouterResponse.json()
    const aiResponse = openRouterData.choices[0]?.message?.content || 'No response generated'

    // Debug logging for flashcard responses
    if (action === 'flashcard') {
      console.log('🤖 Flashcard AI response:', aiResponse)
    }

    // Log usage for monitoring
    console.log(`AI request completed. Tokens used: ${openRouterData.usage?.total_tokens || 0}`)

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        usage: openRouterData.usage
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
