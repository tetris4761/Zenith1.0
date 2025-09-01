import { requireSupabaseClient } from './supabase';
import type { Flashcard, Review } from '../types';

export interface CreateFlashcardData {
  front: string;
  back: string;
  deck_id?: string;
  ease_factor?: number;
  interval?: number;
  repetitions?: number;
  next_review?: string;
}

export interface UpdateFlashcardData {
  front?: string;
  back?: string;
  deck_id?: string;
  ease_factor?: number;
  interval?: number;
  repetitions?: number;
  next_review?: string;
}

export interface StudyResult {
  flashcard: Flashcard;
  quality: 1 | 2 | 3 | 4 | 5; // Again, Hard, Good, Easy, Perfect
}

/**
 * Create a new flashcard
 */
export async function createFlashcard(data: CreateFlashcardData): Promise<{ data: Flashcard | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: flashcard, error } = await supabase
      .from('flashcards')
      .insert({
        front: data.front,
        back: data.back,
        deck_id: data.deck_id,
        ease_factor: data.ease_factor || 2.5,
        interval: data.interval || 1,
        repetitions: data.repetitions || 0,
        next_review: data.next_review || new Date().toISOString(),
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: flashcard, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to create flashcard' };
  }
}

/**
 * Get all flashcards for the current user
 */
export async function getFlashcards(deckId?: string): Promise<{ data: Flashcard[] | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    let query = supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id);
    
    if (deckId) {
      query = query.eq('deck_id', deckId);
    }
    
    const { data: flashcards, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: flashcards, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to load flashcards' };
  }
}

/**
 * Get flashcards due for review
 */
export async function getDueFlashcards(): Promise<{ data: Flashcard[] | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const now = new Date().toISOString();
    
    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .lte('next_review', now)
      .order('next_review', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: flashcards, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to load due flashcards' };
  }
}

/**
 * Get a single flashcard by ID
 */
export async function getFlashcard(id: string): Promise<{ data: Flashcard | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: flashcard, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: flashcard, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to load flashcard' };
  }
}

/**
 * Update an existing flashcard
 */
export async function updateFlashcard(id: string, data: UpdateFlashcardData): Promise<{ data: Flashcard | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { data: flashcard, error } = await supabase
      .from('flashcards')
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

    return { data: flashcard, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to update flashcard' };
  }
}

/**
 * Delete a flashcard
 */
export async function deleteFlashcard(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Failed to delete flashcard' };
  }
}

/**
 * Study a flashcard (Anki-style spaced repetition)
 */
export async function studyFlashcard(studyResult: StudyResult): Promise<{ data: Flashcard | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    const { flashcard, quality } = studyResult;
    
    // Anki-style spaced repetition algorithm
    let newEaseFactor = flashcard.ease_factor;
    let newInterval = flashcard.interval;
    let newRepetitions = flashcard.repetitions;
    
    if (quality >= 3) {
      // Correct answer
      newRepetitions += 1;
      
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(newInterval * newEaseFactor);
      }
      
      // Adjust ease factor
      newEaseFactor = Math.max(1.3, newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    } else {
      // Incorrect answer
      newRepetitions = 0;
      newInterval = 1;
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
    }
    
    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);
    
    // Update flashcard
    const { data: updatedFlashcard, error } = await supabase
      .from('flashcards')
      .update({
        ease_factor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        next_review: nextReview.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', flashcard.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Create review record
    await supabase
      .from('reviews')
      .insert({
        flashcard_id: flashcard.id,
        user_id: flashcard.user_id,
        quality,
        review_time: new Date().toISOString(),
      });

    return { data: updatedFlashcard, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to study flashcard' };
  }
}

/**
 * Search flashcards by content
 */
export async function searchFlashcards(query: string): Promise<{ data: Flashcard[] | null; error: string | null }> {
  try {
    const supabase = requireSupabaseClient();
    
    // Get the current user ID from the auth context
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    
    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .or(`front.ilike.%${query}%,back.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: flashcards, error: null };
  } catch (err) {
    return { data: null, error: 'Failed to search flashcards' };
  }
}
