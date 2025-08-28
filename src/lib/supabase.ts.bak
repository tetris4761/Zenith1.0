import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helpers
export const db = {
  // Documents
  getDocuments: async (userId: string) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return { data, error };
  },

  createDocument: async (document: Omit<Database['public']['Tables']['documents']['Insert'], 'id' | 'created_at' | 'updated_at' | 'last_accessed'>) => {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();
    return { data, error };
  },

  updateDocument: async (id: string, updates: Partial<Database['public']['Tables']['documents']['Update']>) => {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  deleteDocument: async (id: string) => {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Flashcards
  getFlashcards: async (userId: string) => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .order('next_review', { ascending: true });
    return { data, error };
  },

  getDueCards: async (userId: string) => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review', new Date().toISOString())
      .order('next_review', { ascending: true });
    return { data, error };
  },

  createFlashcard: async (flashcard: Omit<Database['public']['Tables']['flashcards']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('flashcards')
      .insert(flashcard)
      .select()
      .single();
    return { data, error };
  },

  updateFlashcard: async (id: string, updates: Partial<Database['public']['Tables']['flashcards']['Update']>) => {
    const { data, error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Tasks
  getTasks: async (userId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        columns (
          id,
          name,
          board_id
        )
      `)
      .eq('user_id', userId)
      .order('order', { ascending: true });
    return { data, error };
  },

  createTask: async (task: Omit<Database['public']['Tables']['tasks']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    return { data, error };
  },

  updateTask: async (id: string, updates: Partial<Database['public']['Tables']['tasks']['Update']>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Pomodoro
  createPomodoroSession: async (session: Omit<Database['public']['Tables']['pomodoro_sessions']['Insert'], 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert(session)
      .select()
      .single();
    return { data, error };
  },

  getPomodoroSessions: async (userId: string) => {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },
};

export default supabase;
