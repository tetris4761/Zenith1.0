import { requireSupabaseClient } from './supabase';

export interface CreateFlashcardFolderData {
  name: string;
  parent_id?: string;
}

export interface UpdateFlashcardFolderData {
  name?: string;
  parent_id?: string;
}

export interface FlashcardFolderWithChildren {
  id: string;
  name: string;
  parent_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  children: FlashcardFolderWithChildren[];
  decks: FlashcardDeck[];
  deck_count: number;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  folder_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  flashcard_count: number;
}

/**
 * Create a new flashcard folder
 */
export async function createFlashcardFolder(data: CreateFlashcardFolderData): Promise<{ data: FlashcardFolderWithChildren | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: folder, error } = await supabase
      .from('flashcard_folders')
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

    return { data: folder as FlashcardFolderWithChildren, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to create folder' };
  }
}

/**
 * Get all flashcard folders for the current user with nested structure
 */
export async function getFlashcardFolders(): Promise<{ data: FlashcardFolderWithChildren[] | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    // Get all folders for the user
    const { data: folders, error } = await supabase
      .from('flashcard_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    // Get all decks for the user
    const { data: decks, error: decksError } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', user.id);

    if (decksError) {
      return { data: null, error: decksError.message };
    }

    // Get flashcard count for each deck
    const { data: flashcardCounts, error: countError } = await supabase
      .from('flashcards')
      .select('deck_id')
      .eq('user_id', user.id)
      .not('deck_id', 'is', null);

    if (countError) {
      console.warn('Warning: Could not load flashcard counts:', countError.message);
    }

    // Build nested structure
    const folderMap = new Map<string, FlashcardFolderWithChildren>();
    const rootFolders: FlashcardFolderWithChildren[] = [];

    // Initialize all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        decks: [],
        deck_count: 0
      });
    });

    // Create a virtual "Documents" folder for root decks (decks without parent_id)
    const rootDecks = decks.filter(deck => !deck.parent_id);
    if (rootDecks.length > 0) {
      const documentsFolder: FlashcardFolderWithChildren = {
        id: 'documents-virtual',
        name: 'Documents',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        children: [],
        decks: [],
        deck_count: 0
      };

      rootDecks.forEach(deck => {
        const deckWithCount: FlashcardDeck = {
          ...deck,
          flashcard_count: flashcardCounts?.filter(fc => fc.deck_id === deck.id).length || 0
        };
        documentsFolder.decks.push(deckWithCount);
        documentsFolder.deck_count++;
      });

      rootFolders.unshift(documentsFolder); // Add at the beginning
    }

    // Add decks to folders and count flashcards (for folder-based decks)
    decks.forEach(deck => {
      if (deck.parent_id) return; // Skip root decks, already handled above
      
      const deckWithCount: FlashcardDeck = {
        ...deck,
        flashcard_count: flashcardCounts?.filter(fc => fc.deck_id === deck.id).length || 0
      };

      // For now, we don't have folder_id in decks table, so this logic is disabled
      // if (deck.folder_id && folderMap.has(deck.folder_id)) {
      //   folderMap.get(deck.folder_id)!.decks.push(deckWithCount);
      //   folderMap.get(deck.folder_id)!.deck_count++;
      // }
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
    const sortFolders = (folders: FlashcardFolderWithChildren[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach(folder => {
        if (folder.children.length > 0) {
          sortFolders(folder.children);
        }
        folder.decks.sort((a, b) => a.name.localeCompare(b.name));
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
export async function getFlashcardFolder(id: string): Promise<{ data: FlashcardFolderWithChildren | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: folder, error } = await supabase
      .from('flashcard_folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: folder as FlashcardFolderWithChildren, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to load folder' };
  }
}

/**
 * Update an existing folder
 */
export async function updateFlashcardFolder(id: string, data: UpdateFlashcardFolderData): Promise<{ data: FlashcardFolderWithChildren | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data: folder, error } = await supabase
      .from('flashcard_folders')
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

    return { data: folder as FlashcardFolderWithChildren, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to update folder' };
  }
}

/**
 * Delete a folder (and move its contents to parent or root)
 */
export async function deleteFlashcardFolder(id: string, moveToParent: boolean = true): Promise<{ error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'User not authenticated' };
    }

    // Get folder details
    const { data: folder, error: folderError } = await supabase
      .from('flashcard_folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (folderError) {
      return { error: folderError.message };
    }

    if (moveToParent) {
      // Move decks to parent folder or root
      const newParentId = folder.parent_id || null;
      
      const { error: updateDecksError } = await supabase
        .from('decks')
        .update({ folder_id: newParentId })
        .eq('folder_id', id);

      if (updateDecksError) {
        return { error: updateDecksError.message };
      }

      // Move subfolders to parent folder or root
      const { error: updateFoldersError } = await supabase
        .from('flashcard_folders')
        .update({ parent_id: newParentId })
        .eq('parent_id', id);

      if (updateFoldersError) {
        return { error: updateFoldersError.message };
      }
    }

    // Delete the folder
    const { error } = await supabase
      .from('flashcard_folders')
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
export async function moveFlashcardFolder(id: string, newParentId: string | null): Promise<{ error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { error } = await supabase
      .from('flashcard_folders')
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

/**
 * Search folders by name
 */
export async function searchFlashcardFolders(query: string): Promise<{ data: FlashcardFolderWithChildren[] | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: folders, error } = await supabase
      .from('flashcard_folders')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    // Convert to FlashcardFolderWithChildren format
    const foldersWithChildren: FlashcardFolderWithChildren[] = folders.map(folder => ({
      ...folder,
      children: [],
      decks: [],
      deck_count: 0
    }));

    return { data: foldersWithChildren, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to search folders' };
  }
}
