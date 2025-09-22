import { requireSupabaseClient } from './supabase';

export interface AIResponse {
  response: string;
  usage?: {
    total_tokens: number;
  };
}

export interface AISummarizeRequest {
  content: string;
  model?: string;
}

export interface AIDefinitionsRequest {
  terms: string[];
  model?: string;
}

export interface AIStudyHelpRequest {
  content: string;
  question: string;
  model?: string;
}

export interface AIChatRequest {
  message: string;
  context?: string;
  model?: string;
}

export interface AIFlashcardRequest {
  text: string;
  model?: string;
}

/**
 * Summarize content using AI
 */
export async function summarizeContent(request: AISummarizeRequest): Promise<AIResponse> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        action: 'summarize',
        content: request.content,
        model: request.model || 'openai/gpt-3.5-turbo'
      }
    });

    if (error) {
      throw new Error(`AI service error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
}

/**
 * Get definitions for terms using AI
 */
export async function getDefinitions(request: AIDefinitionsRequest): Promise<AIResponse> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        action: 'definitions',
        content: request.terms.join('\n'),
        model: request.model || 'openai/gpt-3.5-turbo'
      }
    });

    if (error) {
      throw new Error(`AI service error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting definitions:', error);
    throw error;
  }
}

/**
 * Get study help using AI
 */
export async function getStudyHelp(request: AIStudyHelpRequest): Promise<AIResponse> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        action: 'study-help',
        content: request.question,
        context: request.content,
        model: request.model || 'openai/gpt-3.5-turbo'
      }
    });

    if (error) {
      throw new Error(`AI service error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting study help:', error);
    throw error;
  }
}

/**
 * Chat with AI
 */
export async function chatWithAI(request: AIChatRequest): Promise<AIResponse> {
  try {
    const supabase = requireSupabaseClient();

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        action: 'chat',
        content: request.message,
        context: request.context,
        model: request.model || 'openai/gpt-3.5-turbo'
      }
    });

    if (error) {
      throw new Error(`AI service error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error chatting with AI:', error);
    throw error;
  }
}

/**
 * Generate flashcard content using AI
 */
export async function generateFlashcard(request: AIFlashcardRequest): Promise<{ front: string; back: string }> {
  try {
    console.log('🤖 AI generateFlashcard called with:', request);
    const supabase = requireSupabaseClient();

    // Use the flashcard action specifically designed for this
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        action: 'flashcard',
        content: request.text,
        model: request.model || 'openai/gpt-4o-mini'
      }
    });

    console.log('🤖 AI response data:', data);
    console.log('🤖 AI response error:', error);
    
    if (error) {
      console.error('🤖 Supabase function error:', error);
    }

    if (error) {
      throw new Error(`AI service error: ${error.message}`);
    }

    // Parse the AI response to extract front and back
    const response = data.response;
    console.log('🤖 Raw AI response:', response);
    
    // Try to parse JSON response first
    try {
      const parsed = JSON.parse(response);
      console.log('🤖 Parsed JSON:', parsed);
      if (parsed.front && parsed.back) {
        return { front: parsed.front, back: parsed.back };
      }
    } catch (e) {
      console.log('🤖 JSON parsing failed, trying text format');
    }

    // Fallback: split by common separators
    const lines = response.split('\n').filter(line => line.trim());
    console.log('🤖 Split lines:', lines);
    if (lines.length >= 2) {
      return {
        front: lines[0].replace(/^[Ff]ront[:\s]*/, '').trim(),
        back: lines[1].replace(/^[Bb]ack[:\s]*/, '').trim()
      };
    }

    // Last resort: use the text as back and generate a simple front
    console.log('🤖 Using fallback response');
    return {
      front: `What is this about?`,
      back: response
    };
  } catch (error) {
    console.error('❌ Error generating flashcard:', error);
    throw error;
  }
}

/**
 * Available AI models
 */
export const AI_MODELS = {
  'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
  'gpt-4': 'openai/gpt-4',
  'claude-3-haiku': 'anthropic/claude-3-haiku',
  'claude-3-sonnet': 'anthropic/claude-3-sonnet',
  'llama-3.1-8b': 'meta-llama/llama-3.1-8b-instruct',
  'llama-3.1-70b': 'meta-llama/llama-3.1-70b-instruct'
} as const;

export type AIModel = keyof typeof AI_MODELS;
