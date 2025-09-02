import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  Plus, 
  RefreshCw,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { 
  getDueReviews, 
  getOverdueReviews, 
  getTodayReviews,
  getReviewPriorityColor,
  getReviewPriorityIcon,
  formatDueTime
} from '../../lib/srs-awareness';
import { createTask } from '../../lib/tasks';
import type { DueReview } from '../../lib/srs-awareness';

interface SRSSuggestionsProps {
  onTaskCreated?: () => void;
}

export default function SRSSuggestions({ onTaskCreated }: SRSSuggestionsProps) {
  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [overdueReviews, setOverdueReviews] = useState<DueReview[]>([]);
  const [todayReviews, setTodayReviews] = useState<DueReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingTasks, setCreatingTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSRSData();
  }, []);

  const loadSRSData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dueResult, overdueResult, todayResult] = await Promise.all([
        getDueReviews(),
        getOverdueReviews(),
        getTodayReviews()
      ]);

      if (dueResult.error) {
        setError(dueResult.error);
        return;
      }

      setDueReviews(dueResult.data || []);
      setOverdueReviews(overdueResult.data || []);
      setTodayReviews(todayResult.data || []);
    } catch (err) {
      setError('Failed to load SRS data');
    } finally {
      setLoading(false);
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
        estimated_duration: Math.max(15, deck.due_count * 2), // 2 minutes per card
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

  const totalDue = dueReviews.reduce((sum, deck) => sum + deck.due_count, 0);
  const totalOverdue = overdueReviews.reduce((sum, deck) => sum + deck.due_count, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-neutral-900">SRS Reviews</h3>
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
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="font-medium text-red-900">SRS Error</h3>
        </div>
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={loadSRSData}
          className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (totalDue === 0 && totalOverdue === 0) {
    return (
      <div className="bg-white rounded-lg border border-green-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <BookOpen className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-green-900">SRS Reviews</h3>
        </div>
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-green-600 font-medium">All caught up!</p>
          <p className="text-xs text-green-500 mt-1">No cards due for review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-neutral-900">SRS Reviews</h3>
        </div>
        <button
          onClick={loadSRSData}
          className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Overdue Reviews */}
      {totalOverdue > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-medium text-red-900">Overdue</h4>
            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
              {totalOverdue} cards
            </span>
          </div>
          <div className="space-y-2">
            {overdueReviews.map((deck) => (
              <div
                key={deck.deck_id}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-red-900">{deck.deck_name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getReviewPriorityColor('high')}`}>
                      {getReviewPriorityIcon('high')} High
                    </span>
                  </div>
                  <p className="text-xs text-red-600">
                    {deck.due_count} of {deck.total_cards} cards overdue
                  </p>
                </div>
                <button
                  onClick={() => createStudySession(deck)}
                  disabled={creatingTasks.has(deck.deck_id)}
                  className="btn-primary text-xs px-3 py-1 hover:scale-105 transition-transform duration-200 disabled:opacity-50"
                >
                  {creatingTasks.has(deck.deck_id) ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" />
                      Review
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Reviews */}
      {totalDue > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900">Due Today</h4>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {totalDue} cards
            </span>
          </div>
          <div className="space-y-2">
            {dueReviews.slice(0, 3).map((deck) => (
              <div
                key={deck.deck_id}
                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-blue-900">{deck.deck_name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getReviewPriorityColor(deck.priority)}`}>
                      {getReviewPriorityIcon(deck.priority)} {deck.priority}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">
                    {deck.due_count} of {deck.total_cards} cards due
                  </p>
                </div>
                <button
                  onClick={() => createStudySession(deck)}
                  disabled={creatingTasks.has(deck.deck_id)}
                  className="btn-primary text-xs px-3 py-1 hover:scale-105 transition-transform duration-200 disabled:opacity-50"
                >
                  {creatingTasks.has(deck.deck_id) ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" />
                      Review
                    </>
                  )}
                </button>
              </div>
            ))}
            {dueReviews.length > 3 && (
              <div className="text-center pt-2">
                <button className="text-xs text-blue-600 hover:text-blue-700">
                  +{dueReviews.length - 3} more decks
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-3 border-t border-neutral-200">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Smart suggestions based on your SRS schedule</span>
          <button
            onClick={loadSRSData}
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
