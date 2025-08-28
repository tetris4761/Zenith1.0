import { getSupabaseClient } from './supabase';

export interface Document {
  id: string;
  title: string;
  content: string;
  folder_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_accessed: string;
}

export interface CreateDocumentData {
  title: string;
  content: string;
  folder_id?: string;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
  folder_id?: string;
}

/**
 * Create a new document
 */
export async function createDocument(data: CreateDocumentData): Promise<{ data: Document | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase client not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        title: data.title,
        content: data.content,
        folder_id: data.folder_id || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: document, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to create document' };
  }
}

/**
 * Get all documents for the current user
 */
export async function getDocuments(): Promise<{ data: Document[] | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase client not configured' };
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: documents, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to fetch documents' };
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: string): Promise<{ data: Document | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase client not configured' };
    }

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: document, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to fetch document' };
  }
}

/**
 * Update an existing document
 */
export async function updateDocument(id: string, data: UpdateDocumentData): Promise<{ data: Document | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase client not configured' };
    }

    const { data: document, error } = await supabase
      .from('documents')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: document, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to update document' };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: 'Supabase client not configured' };
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return { error: 'Failed to delete document' };
  }
}

/**
 * Search documents by title or content
 */
export async function searchDocuments(query: string): Promise<{ data: Document[] | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase client not configured' };
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: documents, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to search documents' };
  }
}
