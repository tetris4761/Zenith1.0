import { requireSupabaseClient } from './supabase';
import type { Document } from '../types';

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
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        title: data.title,
        content: data.content,
        folder_id: data.folder_id,
        user_id: user.id,
        last_accessed: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: document, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to create document' };
  }
}

/**
 * Get all documents for the current user
 */
export async function getDocuments(): Promise<{ data: Document[] | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: documents, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to load documents' };
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument(id: string): Promise<{ data: Document | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: document, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to load document' };
  }
}

/**
 * Update an existing document
 */
export async function updateDocument(id: string, data: UpdateDocumentData): Promise<{ data: Document | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
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
  } catch (err) {
    return { data: null, error: 'Failed to update document' };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Failed to delete document' };
  }
}

/**
 * Duplicate an existing document
 */
export async function duplicateDocument(originalDocument: Document): Promise<{ data: Document | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    // Create duplicate title
    const duplicateTitle = `Copy of ${originalDocument.title}`;
    
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        title: duplicateTitle,
        content: originalDocument.content,
        folder_id: originalDocument.folder_id,
        user_id: user.id,
        last_accessed: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: document, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to duplicate document' };
  }
}

/**
 * Move a document to a different folder
 */
export async function moveDocument(documentId: string, folderId: string | null): Promise<{ data: Document | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data: document, error } = await supabase
      .from('documents')
      .update({
        folder_id: folderId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: document, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to move document' };
  }
}

/**
 * Search documents by title or content
 */
export async function searchDocuments(query: string): Promise<{ data: Document[] | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: documents, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to search documents' };
  }
}
