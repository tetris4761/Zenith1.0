import { getSupabaseClient } from './supabase';
import type { Task, TaskSession, CreateTaskForm } from '../types';

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