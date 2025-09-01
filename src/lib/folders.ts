import { requireSupabaseClient } from './supabase';
import type { Folder } from '../types';

export interface CreateFolderData {
  name: string;
  parent_id?: string;
}

export interface UpdateFolderData {
  name?: string;
  parent_id?: string;
}

export interface FolderWithChildren extends Folder {
  children: FolderWithChildren[];
  document_count: number;
}

/**
 * Create a new folder
 */
export async function createFolder(data: CreateFolderData): Promise<{ data: Folder | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        name: data.name,
        parent_id: data.parent_id,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: folder, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to create folder' };
  }
}

/**
 * Get all folders for the current user with nested structure
 */
export async function getFolders(): Promise<{ data: FolderWithChildren[] | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    // Get all folders for the user
    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    // Get document count for each folder
    const { data: documentCounts, error: countError } = await supabase
      .from('documents')
      .select('folder_id')
      .eq('user_id', user.id)
      .not('folder_id', 'is', null);

    if (countError) {
      return { data: null, error: countError.message };
    }

    // Build nested structure
    const folderMap = new Map<string, FolderWithChildren>();
    const rootFolders: FolderWithChildren[] = [];

    // Initialize all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        document_count: 0
      });
    });

    // Count documents per folder
    documentCounts.forEach(doc => {
      if (doc.folder_id && folderMap.has(doc.folder_id)) {
        folderMap.get(doc.folder_id)!.document_count++;
      }
    });

    // Build parent-child relationships
    folders.forEach(folder => {
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folderMap.get(folder.id)!);
        }
      } else {
        rootFolders.push(folderMap.get(folder.id)!);
      }
    });

    // Sort children alphabetically
    const sortFolders = (folders: FolderWithChildren[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach(folder => {
        if (folder.children.length > 0) {
          sortFolders(folder.children);
        }
      });
    };

    sortFolders(rootFolders);

    return { data: rootFolders, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to load folders' };
  }
}

/**
 * Get a single folder by ID
 */
export async function getFolder(id: string): Promise<{ data: Folder | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: folder, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: folder, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to load folder' };
  }
}

/**
 * Update an existing folder
 */
export async function updateFolder(id: string, data: UpdateFolderData): Promise<{ data: Folder | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data: folder, error } = await supabase
      .from('folders')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: folder, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to update folder' };
  }
}

/**
 * Delete a folder (and move its contents to parent or root)
 */
export async function deleteFolder(id: string, moveToParent: boolean = true): Promise<{ error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'User not authenticated' };
    }

    // Get folder details
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (folderError) {
      return { error: folderError.message };
    }

    if (moveToParent) {
      // Move documents to parent folder or root
      const newParentId = folder.parent_id || null;
      
      const { error: updateDocsError } = await supabase
        .from('documents')
        .update({ folder_id: newParentId })
        .eq('folder_id', id);

      if (updateDocsError) {
        return { error: updateDocsError.message };
      }

      // Move subfolders to parent folder or root
      const { error: updateFoldersError } = await supabase
        .from('folders')
        .update({ parent_id: newParentId })
        .eq('parent_id', id);

      if (updateFoldersError) {
        return { error: updateFoldersError.message };
      }
    }

    // Delete the folder
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Failed to delete folder' };
  }
}

/**
 * Move a folder to a new parent
 */
export async function moveFolder(id: string, newParentId: string | null): Promise<{ error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { error } = await supabase
      .from('folders')
      .update({
        parent_id: newParentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Failed to move folder' };
  }
}
