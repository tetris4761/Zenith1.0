import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  Plus,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { 
  getNextBestTask,
  getSuggestionIcon,
  getSuggestionColor,
  formatSuggestionReason
} from '../../lib/smart-suggestions';
import { createTask } from '../../lib/tasks';
import type { SmartSuggestion } from '../../lib/smart-suggestions';

interface SmartSuggestionsProps {
  onTaskCreated?: () => void;
}

export default function SmartSuggestions({ onTaskCreated }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingTasks, setCreatingTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await getNextBestTask();
      
      if (error) {
        setError(error);
        return;
      }

      setSuggestions(data || []);
    } catch (err) {
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const createTaskFromSuggestion = async (suggestion: SmartSuggestion) => {
    try {
      setCreatingTasks(prev => new Set(prev).add(suggestion.id));

      const taskData = {
        title: suggestion.title,
        description: suggestion.description,
        task_type: suggestion.type === 'srs_review' ? 'study_session' as const : 'quick_task' as const,
        priority: suggestion.priority,
        estimated_duration: suggestion.estimated_duration,
        linked_type: suggestion.metadata?.deck_id ? 'deck' as const : 'none' as const,
        linked_id: suggestion.metadata?.deck_id,
        tags: suggestion.metadata?.tags || [],
        notes: `Smart suggestion: ${suggestion.reason}`
      };

      const { error } = await createTask(taskData);
      
      if (error) {
        setError(error);
        return;
      }

      onTaskCreated?.();
      
      // Remove the suggestion from the list after creating the task
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setCreatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="font-medium text-neutral-900">Smart Suggestions</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-5 h-5 text-red-600" />
          <h3 className="font-medium text-red-900">Smart Suggestions</h3>
        </div>
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={loadSuggestions}
          className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-green-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-green-900">Smart Suggestions</h3>
        </div>
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-green-600 font-medium">All set!</p>
          <p className="text-xs text-green-500 mt-1">No urgent tasks right now</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="font-medium text-neutral-900">Smart Suggestions</h3>
        </div>
        <button
          onClick={loadSuggestions}
          className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
          title="Refresh suggestions"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
              getSuggestionColor(suggestion.type)
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                  <h4 className="text-sm font-medium text-neutral-900">{suggestion.title}</h4>
                  {index === 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full border border-yellow-200">
                      <Target className="w-3 h-3 inline mr-1" />
                      Best
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-neutral-600 mb-2">{suggestion.description}</p>
                
                <div className="flex items-center space-x-3 text-xs text-neutral-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{suggestion.estimated_duration}m</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="capitalize">{suggestion.priority}</span>
                  </span>
                </div>
                
                <p className="text-xs text-neutral-500 mt-2 italic">
                  {formatSuggestionReason(suggestion.reason)}
                </p>
              </div>

              <button
                onClick={() => createTaskFromSuggestion(suggestion)}
                disabled={creatingTasks.has(suggestion.id)}
                className={`ml-3 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 ${
                  suggestion.priority === 'high'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : suggestion.priority === 'medium'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {creatingTasks.has(suggestion.id) ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1 inline" />
                    Add
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-neutral-200">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>AI-powered recommendations</span>
          </span>
          <button
            onClick={loadSuggestions}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
