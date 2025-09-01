import { requireSupabaseClient } from './supabase';
import type { Deck } from '../types';

export interface CreateDeckData {
  name: string;
  description?: string;
  folder_id?: string;
}

export interface UpdateDeckData {
  name?: string;
  description?: string;
  folder_id?: string;
}

export interface DeckWithChildren extends Deck {
  children: DeckWithChildren[];
  flashcard_count: number;
}

/**
 * Create a new deck
 */
export async function createDeck(data: CreateDeckData): Promise<{ data: Deck | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: deck, error } = await supabase
      .from('decks')
      .insert({
        name: data.name,
        description: data.description,
        folder_id: data.folder_id,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: deck, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to create deck' };
  }
}

/**
 * Get all decks for the current user with nested structure
 */
export async function getDecks(): Promise<{ data: DeckWithChildren[] | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    // Get all decks for the user
    const { data: decks, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    // Get flashcard count for each deck
    const { data: flashcardCounts, error: countError } = await supabase
      .from('flashcards')
      .select('deck_id')
      .eq('user_id', user.id)
      .not('deck_id', 'is', null);

    if (countError) {
      console.warn('Warning: Could not load flashcard counts:', countError.message);
      // Continue without flashcard counts rather than failing completely
    }

    // Build nested structure
    const deckMap = new Map<string, DeckWithChildren>();
    const rootDecks: DeckWithChildren[] = [];

    // Initialize all decks
    decks.forEach(deck => {
      deckMap.set(deck.id, {
        ...deck,
        children: [],
        flashcard_count: 0
      });
    });

    // Count flashcards per deck
    if (flashcardCounts) {
      flashcardCounts.forEach(flashcard => {
        if (flashcard.deck_id && deckMap.has(flashcard.deck_id)) {
          deckMap.get(flashcard.deck_id)!.flashcard_count++;
        }
      });
    }

    // Build folder relationships
    decks.forEach(deck => {
      if (deck.folder_id) {
        // Note: This function is now deprecated since we're using the folder system
        // Decks are now organized by folders, not by parent-child relationships
        rootDecks.push(deckMap.get(deck.id)!);
      } else {
        rootDecks.push(deckMap.get(deck.id)!);
      }
    });

    // Sort children alphabetically
    const sortDecks = (decks: DeckWithChildren[]) => {
      decks.sort((a, b) => a.name.localeCompare(b.name));
      decks.forEach(deck => {
        if (deck.children.length > 0) {
          sortDecks(deck.children);
        }
      });
    };

    sortDecks(rootDecks);

    return { data: rootDecks, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to load decks' };
  }
}

/**
 * Get a single deck by ID
 */
export async function getDeck(id: string): Promise<{ data: Deck | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: deck, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: deck, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to load deck' };
  }
}

/**
 * Update an existing deck
 */
export async function updateDeck(id: string, data: UpdateDeckData): Promise<{ data: Deck | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data: deck, error } = await supabase
      .from('decks')
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

    return { data: deck, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to update deck' };
  }
}

/**
 * Delete a deck (and move its contents to parent or root)
 */
export async function deleteDeck(id: string, moveToParent: boolean = true): Promise<{ error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'User not authenticated' };
    }

    // Get deck details
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (deckError) {
      return { error: deckError.message };
    }

    if (moveToParent) {
      // Move flashcards to root (no folder)
      const { error: updateFlashcardsError } = await supabase
        .from('flashcards')
        .update({ deck_id: null })
        .eq('deck_id', id);

      if (updateFlashcardsError) {
        return { error: updateFlashcardsError.message };
      }
    }

    // Delete the deck
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Failed to delete deck' };
  }
}

/**
 * Move a deck to a new parent
 */
export async function moveDeck(id: string, newFolderId: string | null): Promise<{ error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { error } = await supabase
      .from('decks')
      .update({
        folder_id: newFolderId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Failed to move deck' };
  }
}

/**
 * Get deck statistics
 */
export async function getDeckStats(deckId: string): Promise<{ 
  total_cards: number; 
  due_cards: number; 
  new_cards: number; 
  error: string | null 
}> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { total_cards: 0, due_cards: 0, new_cards: 0, error: 'User not authenticated' };
    }

    // Get total cards in deck
    const { data: totalCards, error: totalError } = await supabase
      .from('flashcards')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('deck_id', deckId);

    if (totalError) {
      return { total_cards: 0, due_cards: 0, new_cards: 0, error: totalError.message };
    }

    // Get due cards
    const now = new Date().toISOString();
    const { data: dueCards, error: dueError } = await supabase
      .from('flashcards')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('deck_id', deckId)
      .lte('next_review', now);

    if (dueError) {
      return { total_cards: 0, due_cards: 0, new_cards: 0, error: dueError.message };
    }

    // Get new cards (never reviewed)
    const { data: newCards, error: newError } = await supabase
      .from('flashcards')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('deck_id', deckId)
      .eq('repetitions', 0);

    if (newError) {
      return { total_cards: 0, due_cards: 0, new_cards: 0, error: newError.message };
    }

    return {
      total_cards: totalCards?.length || 0,
      due_cards: dueCards?.length || 0,
      new_cards: newCards?.length || 0,
      error: null
    };
  } catch (err) {
    return { total_cards: 0, due_cards: 0, new_cards: 0, error: 'Failed to get deck stats' };
  }
}
