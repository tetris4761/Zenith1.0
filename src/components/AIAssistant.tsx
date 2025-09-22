import React, { useState } from 'react';
import { Bot, Send, Loader2, X } from 'lucide-react';
import { chatWithAI, summarizeContent, getDefinitions, AI_MODELS, type AIModel } from '../lib/ai';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
}

export default function AIAssistant({ isOpen, onClose, context }: AIAssistantProps) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-3.5-turbo');
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setResponse('');

    try {
      const result = await chatWithAI({
        message: message.trim(),
        context,
        model: AI_MODELS[selectedModel]
      });
      
      setResponse(result.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: 'summarize' | 'definitions') => {
    if (!context) return;

    setLoading(true);
    setError(null);
    setResponse('');

    try {
      let result;
      if (action === 'summarize') {
        result = await summarizeContent({
          content: context,
          model: AI_MODELS[selectedModel]
        });
      } else {
        // Extract potential terms from context (simple approach)
        const words = context.split(/\s+/).filter(word => 
          word.length > 5 && 
          /^[a-zA-Z]+$/.test(word) && 
          word[0] === word[0].toUpperCase()
        ).slice(0, 5);
        
        result = await getDefinitions({
          terms: words,
          model: AI_MODELS[selectedModel]
        });
      }
      
      setResponse(result.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              AI Study Assistant
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Model Selection */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            AI Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as AIModel)}
            className="input w-full"
          >
            {Object.entries(AI_MODELS).map(([key, value]) => (
              <option key={key} value={key}>
                {key.replace(/-/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Actions */}
        {context && (
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Quick Actions
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleQuickAction('summarize')}
                disabled={loading}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors disabled:opacity-50"
              >
                📝 Summarize
              </button>
              <button
                onClick={() => handleQuickAction('definitions')}
                disabled={loading}
                className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg transition-colors disabled:opacity-50"
              >
                📚 Definitions
              </button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Response */}
          {response && (
            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3">
              <div className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
                AI is thinking...
              </span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
              placeholder="Ask me anything about your study material..."
              className="flex-1 input"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
