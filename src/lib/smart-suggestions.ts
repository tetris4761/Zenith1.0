import { getSupabaseClient } from './supabase';
import { getDueReviews } from './srs-awareness';
import type { Task, CreateTaskForm } from '../types';

export interface SmartSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'srs_review' | 'overdue_task' | 'high_priority' | 'time_based' | 'context_aware';
  priority: 'high' | 'medium' | 'low';
  estimated_duration: number;
  reason: string;
  action: () => Promise<void>;
  metadata?: {
    deck_id?: string;
    document_id?: string;
    folder_id?: string;
    due_date?: string;
    tags?: string[];
  };
}

export async function getNextBestTask(): Promise<{ data: SmartSuggestion[] | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const suggestions: SmartSuggestion[] = [];

    // 1. Check for overdue SRS reviews (highest priority)
    const { data: dueReviews } = await getDueReviews();
    if (dueReviews && dueReviews.length > 0) {
      const overdueReviews = dueReviews.filter(review => {
        // Check if any cards are significantly overdue
        return review.priority === 'high';
      });

      overdueReviews.forEach(review => {
        suggestions.push({
          id: `srs-overdue-${review.deck_id}`,
          title: `Review ${review.deck_name}`,
          description: `${review.due_count} cards are overdue for review`,
          type: 'srs_review',
          priority: 'high',
          estimated_duration: Math.max(15, review.due_count * 2),
          reason: 'Overdue SRS reviews are critical for retention',
          action: async () => {
            // This will be handled by the component
          },
          metadata: {
            deck_id: review.deck_id,
            tags: ['srs', 'overdue', 'high-priority']
          }
        });
      });
    }

    // 2. Check for overdue tasks
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(3);

    if (overdueTasks && overdueTasks.length > 0) {
      overdueTasks.forEach(task => {
        suggestions.push({
          id: `overdue-task-${task.id}`,
          title: task.title,
          description: `Overdue since ${new Date(task.due_date).toLocaleDateString()}`,
          type: 'overdue_task',
          priority: 'high',
          estimated_duration: task.estimated_duration || 30,
          reason: 'This task is overdue and needs immediate attention',
          action: async () => {
            // This will be handled by the component
          },
          metadata: {
            due_date: task.due_date,
            tags: ['overdue', 'urgent']
          }
        });
      });
    }

    // 3. Check for high priority tasks due today
    const { data: highPriorityTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .in('priority', ['high', 'urgent'])
      .gte('due_date', new Date().toISOString())
      .lt('due_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      .order('priority', { ascending: false })
      .limit(2);

    if (highPriorityTasks && highPriorityTasks.length > 0) {
      highPriorityTasks.forEach(task => {
        suggestions.push({
          id: `high-priority-${task.id}`,
          title: task.title,
          description: `High priority task due today`,
          type: 'high_priority',
          priority: task.priority === 'urgent' ? 'high' : 'medium',
          estimated_duration: task.estimated_duration || 30,
          reason: 'High priority tasks should be tackled early in the day',
          action: async () => {
            // This will be handled by the component
          },
          metadata: {
            due_date: task.due_date,
            tags: ['high-priority', 'due-today']
          }
        });
      });
    }

    // 4. Check for SRS reviews due today (medium priority)
    if (dueReviews && dueReviews.length > 0) {
      const todayReviews = dueReviews.filter(review => review.priority !== 'high');
      
      todayReviews.slice(0, 2).forEach(review => {
        suggestions.push({
          id: `srs-today-${review.deck_id}`,
          title: `Review ${review.deck_name}`,
          description: `${review.due_count} cards due for review today`,
          type: 'srs_review',
          priority: 'medium',
          estimated_duration: Math.max(15, review.due_count * 2),
          reason: 'Regular SRS reviews maintain long-term retention',
          action: async () => {
            // This will be handled by the component
          },
          metadata: {
            deck_id: review.deck_id,
            tags: ['srs', 'due-today']
          }
        });
      });
    }

    // 5. Time-based suggestions (what makes sense for current time)
    const currentHour = new Date().getHours();
    let timeBasedReason = '';
    let timeBasedPriority: 'high' | 'medium' | 'low' = 'medium';

    if (currentHour >= 6 && currentHour < 12) {
      timeBasedReason = 'Morning is ideal for focused study sessions';
      timeBasedPriority = 'high';
    } else if (currentHour >= 12 && currentHour < 17) {
      timeBasedReason = 'Afternoon is good for review and practice';
      timeBasedPriority = 'medium';
    } else if (currentHour >= 17 && currentHour < 22) {
      timeBasedReason = 'Evening is perfect for light review and planning';
      timeBasedPriority = 'low';
    } else {
      timeBasedReason = 'Late night - consider lighter tasks or planning';
      timeBasedPriority = 'low';
    }

    // Add a general study session suggestion if no specific tasks
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'general-study',
        title: 'General Study Session',
        description: 'Start a focused study session',
        type: 'time_based',
        priority: timeBasedPriority,
        estimated_duration: 25,
        reason: timeBasedReason,
        action: async () => {
          // This will be handled by the component
        },
        metadata: {
          tags: ['general', 'study-session']
        }
      });
    }

    // Sort suggestions by priority and return top 3
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 3);

    return { data: sortedSuggestions, error: null };
  } catch (err) {
    console.error('Exception getting next best task:', err);
    return { data: null, error: 'Failed to get smart suggestions' };
  }
}

export function getSuggestionIcon(type: string): string {
  switch (type) {
    case 'srs_review':
      return '🧠';
    case 'overdue_task':
      return '⚠️';
    case 'high_priority':
      return '🔥';
    case 'time_based':
      return '⏰';
    case 'context_aware':
      return '🎯';
    default:
      return '💡';
  }
}

export function getSuggestionColor(type: string): string {
  switch (type) {
    case 'srs_review':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'overdue_task':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high_priority':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'time_based':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'context_aware':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function formatSuggestionReason(reason: string): string {
  // Capitalize first letter and add period if missing
  return reason.charAt(0).toUpperCase() + reason.slice(1) + (reason.endsWith('.') ? '' : '.');
}
