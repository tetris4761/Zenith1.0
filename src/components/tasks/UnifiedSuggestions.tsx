import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  Plus,
  Sparkles,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { 
  getNextBestTask,
  getSuggestionIcon,
  getSuggestionColor,
  formatSuggestionReason
} from '../../lib/smart-suggestions';
import { 
  getDueReviews, 
  getOverdueReviews, 
  getTodayReviews,
  getReviewPriorityColor,
  getReviewPriorityIcon
} from '../../lib/srs-awareness';
import { createTask } from '../../lib/tasks';
import type { SmartSuggestion } from '../../lib/smart-suggestions';
import type { DueReview } from '../../lib/srs-awareness';

interface UnifiedSuggestionsProps {
  onTaskCreated?: () => void;
}

export default function UnifiedSuggestions({ onTaskCreated }: UnifiedSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [srsReviews, setSrsReviews] = useState<DueReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingTasks, setCreatingTasks] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const [smartResult, srsResult] = await Promise.all([
        getNextBestTask(),
        getDueReviews()
      ]);
      
      if (smartResult.error) {
        setError(smartResult.error);
        return;
      }

      setSuggestions(smartResult.data || []);
      setSrsReviews(srsResult.data || []);
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

  const createStudySession = async (deck: DueReview) => {
    try {
      setCreatingTasks(prev => new Set(prev).add(deck.deck_id));

      const { error } = await createTask({
        title: `Review ${deck.deck_name}`,
        description: `${deck.due_count} cards due for review`,
        task_type: 'study_session',
        priority: deck.priority === 'high' ? 'high' : 'medium',
        estimated_duration: Math.max(15, deck.due_count * 2),
        linked_type: 'deck',
        linked_id: deck.deck_id,
        tags: ['srs', 'review', 'flashcards']
      });

      if (error) {
        setError(error);
        return;
      }

      onTaskCreated?.();
    } catch (err) {
      setError('Failed to create study session');
    } finally {
      setCreatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(deck.deck_id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-medium text-neutral-900">Suggested Today</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-medium text-red-900">Suggested Today</h3>
        </div>
        <p className="text-xs text-red-600 mb-3">{error}</p>
        <button
          onClick={loadSuggestions}
          className="text-xs text-red-600 hover:text-red-700 flex items-center space-x-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const totalSuggestions = suggestions.length + srsReviews.length;

  if (totalSuggestions === 0) {
    return (
      <div className="bg-white rounded-lg border border-green-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-medium text-green-900">Suggested Today</h3>
        </div>
        <div className="text-center py-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xs text-green-600 font-medium">All set!</p>
          <p className="text-xs text-green-500">No urgent tasks right now</p>
        </div>
      </div>
    );
  }

  const bestSuggestion = suggestions[0];
  const otherSuggestions = suggestions.slice(1);
  const allOtherSuggestions = [...otherSuggestions, ...srsReviews];

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-medium text-neutral-900">Suggested Today</h3>
        </div>
        <button
          onClick={loadSuggestions}
          className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
          title="Refresh suggestions"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Best Suggestion - Always Visible */}
      {bestSuggestion && (
        <div className={`p-3 rounded-lg border mb-3 transition-all duration-200 hover:shadow-sm ${
          getSuggestionColor(bestSuggestion.type)
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm">{getSuggestionIcon(bestSuggestion.type)}</span>
                <h4 className="text-sm font-medium text-neutral-900">{bestSuggestion.title}</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                  <Target className="w-3 h-3 inline mr-1" />
                  Best
                </span>
              </div>
              
              <p className="text-xs text-neutral-600 mb-2">{bestSuggestion.description}</p>
              
              <div className="flex items-center space-x-3 text-xs text-neutral-500">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{bestSuggestion.estimated_duration}m</span>
                </span>
                <span className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="capitalize">{bestSuggestion.priority}</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => createTaskFromSuggestion(bestSuggestion)}
              disabled={creatingTasks.has(bestSuggestion.id)}
              className={`ml-3 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 ${
                bestSuggestion.priority === 'high'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : bestSuggestion.priority === 'medium'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {creatingTasks.has(bestSuggestion.id) ? (
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
      )}

      {/* Other Suggestions - Collapsible */}
      {allOtherSuggestions.length > 0 && (
        <div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-between text-xs text-neutral-500 hover:text-neutral-700 py-2"
          >
            <span>See all suggestions ({allOtherSuggestions.length})</span>
            {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showAll && (
            <div className="space-y-2 mt-2">
              {/* Other Smart Suggestions */}
              {otherSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-2 rounded border text-xs ${
                    getSuggestionColor(suggestion.type)
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1 mb-1">
                        <span>{getSuggestionIcon(suggestion.type)}</span>
                        <span className="font-medium">{suggestion.title}</span>
                      </div>
                      <p className="text-neutral-600">{suggestion.description}</p>
                    </div>
                    <button
                      onClick={() => createTaskFromSuggestion(suggestion)}
                      disabled={creatingTasks.has(suggestion.id)}
                      className="ml-2 px-2 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {creatingTasks.has(suggestion.id) ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* SRS Reviews */}
              {srsReviews.map((review) => (
                <div
                  key={review.deck_id}
                  className="p-2 rounded border text-xs bg-blue-50 border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1 mb-1">
                        <BookOpen className="w-3 h-3 text-blue-600" />
                        <span className="font-medium">Review {review.deck_name}</span>
                        <span className={`px-1 py-0.5 rounded text-xs border ${getReviewPriorityColor(review.priority)}`}>
                          {getReviewPriorityIcon(review.priority)} {review.priority}
                        </span>
                      </div>
                      <p className="text-blue-600">{review.due_count} cards due</p>
                    </div>
                    <button
                      onClick={() => createStudySession(review)}
                      disabled={creatingTasks.has(review.deck_id)}
                      className="ml-2 px-2 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {creatingTasks.has(review.deck_id) ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
