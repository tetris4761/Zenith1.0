import { getSupabaseClient } from './supabase';
import type { Task, TaskSession, CreateTaskForm, CreateContextualTaskForm } from '../types';

// Task CRUD Operations
export async function createTask(taskData: CreateTaskForm) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: taskData.title,
        description: taskData.description,
        task_type: taskData.task_type,
        priority: taskData.priority,
        due_date: taskData.due_date,
        estimated_duration: taskData.estimated_duration,
        linked_type: taskData.linked_type || 'none',
        linked_id: taskData.linked_id,
        tags: taskData.tags || [],
        notes: taskData.notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Exception creating task:', err);
    return { data: null, error: 'Failed to create task' };
  }
}

// NEW: Create contextual task using the database function
export async function createContextualTask(taskData: CreateContextualTaskForm) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Generate title if not provided
    let title = taskData.title;
    if (!title) {
      switch (taskData.contextual_type) {
        case 'document':
          const doc = taskData.linked_id ? await supabase
            .from('documents')
            .select('title')
            .eq('id', taskData.linked_id)
            .single() : null;
          title = `Study ${doc?.data?.title || 'Document'}`;
          break;
        case 'deck':
          const deck = taskData.linked_id ? await supabase
            .from('decks')
            .select('name')
            .eq('id', taskData.linked_id)
            .single() : null;
          title = `Review ${deck?.data?.name || 'Deck'} (${taskData.target_card_count || 20} cards)`;
          break;
        case 'combo':
          title = 'Study Document → Review Deck';
          break;
        default:
          title = 'New Task';
      }
    }

    // Try to call the database function first
    let data, error;
    try {
      console.log('Calling create_contextual_task RPC with data:', {
        p_title: title,
        p_description: taskData.description || null,
        p_contextual_type: taskData.contextual_type,
        p_priority: taskData.priority || 'medium',
        p_due_date: taskData.due_date || null,
        p_estimated_duration: taskData.estimated_duration || null,
        p_linked_type: taskData.linked_type || 'none',
        p_linked_id: taskData.linked_id || null,
        p_target_card_count: taskData.target_card_count || null,
        p_flow_steps: taskData.flow_steps || null,
        p_suggested_score: taskData.suggested_score || null,
        p_task_source: taskData.task_source || 'manual',
        p_contextual_meta: taskData.contextual_meta || null,
        p_tags: taskData.tags || [],
        p_notes: taskData.notes || null
      });
      
      const result = await supabase.rpc('create_contextual_task', {
        p_title: title,
        p_description: taskData.description || null,
        p_contextual_type: taskData.contextual_type,
        p_priority: taskData.priority || 'medium',
        p_due_date: taskData.due_date || null,
        p_estimated_duration: taskData.estimated_duration || null,
        p_linked_type: taskData.linked_type || 'none',
        p_linked_id: taskData.linked_id || null,
        p_target_card_count: taskData.target_card_count || null,
        p_flow_steps: taskData.flow_steps || null,
        p_suggested_score: taskData.suggested_score || null,
        p_task_source: taskData.task_source || 'manual',
        p_contextual_meta: taskData.contextual_meta || null,
        p_tags: taskData.tags || [],
        p_notes: taskData.notes || null
      });
      console.log('RPC result:', result);
      data = result.data;
      error = result.error;
    } catch (rpcError) {
      console.warn('RPC function not available, falling back to regular task creation:', rpcError);
      // Fallback to regular task creation
      console.log('Fallback task data:', {
        user_id: user.id,
        title: title,
        description: taskData.description,
        task_type: taskData.contextual_type === 'document' || taskData.contextual_type === 'deck' || taskData.contextual_type === 'combo' ? 'study_session' : 'quick_task',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date,
        estimated_duration: taskData.estimated_duration,
        linked_type: taskData.linked_type || 'none',
        linked_id: taskData.linked_id,
        tags: taskData.tags || [],
        notes: taskData.notes,
        // Add new contextual fields
        contextual_type: taskData.contextual_type,
        target_card_count: taskData.target_card_count,
        flow_steps: taskData.flow_steps,
        suggested_score: taskData.suggested_score,
        task_source: taskData.task_source || 'manual',
        contextual_meta: taskData.contextual_meta
      });
      
      const fallbackResult = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: title,
          description: taskData.description,
          task_type: taskData.contextual_type === 'document' || taskData.contextual_type === 'deck' || taskData.contextual_type === 'combo' ? 'study_session' : 'quick_task',
          priority: taskData.priority || 'medium',
          due_date: taskData.due_date,
          estimated_duration: taskData.estimated_duration,
          linked_type: taskData.linked_type || 'none',
          linked_id: taskData.linked_id,
          tags: taskData.tags || [],
          notes: taskData.notes,
          // Add new contextual fields
          contextual_type: taskData.contextual_type,
          target_card_count: taskData.target_card_count,
          flow_steps: taskData.flow_steps,
          suggested_score: taskData.suggested_score,
          task_source: taskData.task_source || 'manual',
          contextual_meta: taskData.contextual_meta
        })
        .select()
        .single();
      
      console.log('Fallback result:', fallbackResult);
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Error creating contextual task:', error);
      return { data: null, error: error.message };
    }

    // If we used the RPC function, fetch the created task with full details
    if (data && typeof data === 'string') {
      // First get the task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', data)
        .single();

      if (taskError) {
        console.error('Error fetching created task:', taskError);
        return { data: null, error: taskError.message };
      }

      // Then get related document/deck info if linked
      if (task.linked_type === 'document' && task.linked_id) {
        const { data: doc } = await supabase
          .from('documents')
          .select('title, content')
          .eq('id', task.linked_id)
          .single();
        if (doc) {
          task.document_title = doc.title;
          task.document_content = doc.content;
        }
      }

      if (task.linked_type === 'deck' && task.linked_id) {
        const { data: deck } = await supabase
          .from('decks')
          .select('name, description')
          .eq('id', task.linked_id)
          .single();
        if (deck) {
          task.deck_name = deck.name;
          task.deck_description = deck.description;
        }
      }

      return { data: task, error: null };
    } else {
      // If we used the fallback method, data is already the task object
      // But we still need to fetch related document/deck info
      const task = data;
      
      if (task.linked_type === 'document' && task.linked_id) {
        const { data: doc } = await supabase
          .from('documents')
          .select('title, content')
          .eq('id', task.linked_id)
          .single();
        if (doc) {
          task.document_title = doc.title;
          task.document_content = doc.content;
        }
      }

      if (task.linked_type === 'deck' && task.linked_id) {
        const { data: deck } = await supabase
          .from('decks')
          .select('name, description')
          .eq('id', task.linked_id)
          .single();
        if (deck) {
          task.deck_name = deck.name;
          task.deck_description = deck.description;
        }
      }

      return { data: task, error: null };
    }
  } catch (err) {
    console.error('Exception creating contextual task:', err);
    return { data: null, error: 'Failed to create contextual task' };
  }
}

export async function getTasks(filters?: {
  status?: string;
  task_type?: string;
  linked_type?: string;
  linked_id?: string;
}) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.task_type) {
      query = query.eq('task_type', filters.task_type);
    }
    if (filters?.linked_type) {
      query = query.eq('linked_type', filters.linked_type);
    }
    if (filters?.linked_id) {
      query = query.eq('linked_id', filters.linked_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Exception fetching tasks:', err);
    return { data: null, error: 'Failed to fetch tasks' };
  }
}

export async function getTodaysTasks() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .rpc('get_todays_tasks');

    if (error) {
      console.error('Error fetching today\'s tasks:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Exception fetching today\'s tasks:', err);
    return { data: null, error: 'Failed to fetch today\'s tasks' };
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Exception updating task:', err);
    return { data: null, error: 'Failed to update task' };
  }
}

export async function deleteTask(taskId: string) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting task:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('Exception deleting task:', err);
    return { data: null, error: 'Failed to delete task' };
  }
}

export async function completeTask(taskId: string) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .rpc('complete_task', { task_id: taskId });

    if (error) {
      console.error('Error completing task:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('Exception completing task:', err);
    return { data: null, error: 'Failed to complete task' };
  }
}

// Task Session Operations
export async function startTaskSession(taskId: string) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // First, update task status to in_progress
    await updateTask(taskId, { status: 'in_progress' });

    // Then create a new session
    const { data, error } = await supabase
      .from('task_sessions')
      .insert({
        task_id: taskId,
        user_id: user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting task session:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Exception starting task session:', err);
    return { data: null, error: 'Failed to start task session' };
  }
}

export async function endTaskSession(sessionId: string, duration: number, notes?: string) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('task_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration,
        status: 'completed',
        notes
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error ending task session:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Exception ending task session:', err);
    return { data: null, error: 'Failed to end task session' };
  }
}

export async function getTaskSessions(taskId?: string) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    let query = supabase
      .from('task_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching task sessions:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Exception fetching task sessions:', err);
    return { data: null, error: 'Failed to fetch task sessions' };
  }
}

// Utility Functions
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getTaskTypeIcon(taskType: string): string {
  switch (taskType) {
    case 'study_session':
      return '🎯';
    case 'quick_task':
      return '⚡';
    case 'recurring_plan':
      return '🔄';
    default:
      return '📝';
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function groupTasksByTimeOfDay(tasks: Task[]) {
  const now = new Date();
  const morning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const afternoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const evening = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);

  return {
    morning: tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= morning && dueDate < afternoon;
    }),
    afternoon: tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= afternoon && dueDate < evening;
    }),
    evening: tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= evening;
    }),
    noTime: tasks.filter(task => !task.due_date)
  };
}