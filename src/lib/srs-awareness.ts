import { getSupabaseClient } from './supabase';
import type { Deck } from '../types';

export interface DueReview {
  deck_id: string;
  deck_name: string;
  due_count: number;
  total_cards: number;
  last_reviewed?: string;
  priority: 'high' | 'medium' | 'low';
}

export async function getDueReviews(): Promise<{ data: DueReview[] | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Get decks with flashcards that are due for review
    const { data, error } = await supabase
      .from('decks')
      .select(`
        id,
        name,
        flashcards!inner(
          id,
          next_review
        )
      `)
      .eq('user_id', user.id)
      .lte('flashcards.next_review', new Date().toISOString());

    if (error) {
      console.error('Error fetching due reviews:', error);
      return { data: null, error: error.message };
    }

    // Process the data to get due counts and priorities
    const dueReviews: DueReview[] = [];
    const deckMap = new Map<string, DueReview>();

    data?.forEach((deck: any) => {
      const deckId = deck.id;
      const dueCards = deck.flashcards.filter((card: any) => 
        new Date(card.next_review) <= new Date()
      );

      if (dueCards.length > 0) {
        const existing = deckMap.get(deckId);
        if (existing) {
          existing.due_count += dueCards.length;
        } else {
          deckMap.set(deckId, {
            deck_id: deckId,
            deck_name: deck.name,
            due_count: dueCards.length,
            total_cards: deck.flashcards.length,
            priority: getReviewPriority(dueCards.length, deck.flashcards.length)
          });
        }
      }
    });

    // Convert map to array and sort by priority
    const result = Array.from(deckMap.values()).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return { data: result, error: null };
  } catch (err) {
    console.error('Exception fetching due reviews:', err);
    return { data: null, error: 'Failed to fetch due reviews' };
  }
}

export async function getOverdueReviews(): Promise<{ data: DueReview[] | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Get decks with flashcards that are overdue (more than 1 day past due)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data, error } = await supabase
      .from('decks')
      .select(`
        id,
        name,
        flashcards!inner(
          id,
          next_review
        )
      `)
      .eq('user_id', user.id)
      .lte('flashcards.next_review', yesterday.toISOString());

    if (error) {
      console.error('Error fetching overdue reviews:', error);
      return { data: null, error: error.message };
    }

    // Process overdue data
    const overdueReviews: DueReview[] = [];
    const deckMap = new Map<string, DueReview>();

    data?.forEach((deck: any) => {
      const deckId = deck.id;
      const overdueCards = deck.flashcards.filter((card: any) => 
        new Date(card.next_review) <= yesterday
      );

      if (overdueCards.length > 0) {
        deckMap.set(deckId, {
          deck_id: deckId,
          deck_name: deck.name,
          due_count: overdueCards.length,
          total_cards: deck.flashcards.length,
          priority: 'high' // Overdue is always high priority
        });
      }
    });

    const result = Array.from(deckMap.values()).sort((a, b) => b.due_count - a.due_count);
    return { data: result, error: null };
  } catch (err) {
    console.error('Exception fetching overdue reviews:', err);
    return { data: null, error: 'Failed to fetch overdue reviews' };
  }
}

export async function getTodayReviews(): Promise<{ data: DueReview[] | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Get decks with flashcards due today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const { data, error } = await supabase
      .from('decks')
      .select(`
        id,
        name,
        flashcards!inner(
          id,
          next_review
        )
      `)
      .eq('user_id', user.id)
      .gte('flashcards.next_review', startOfDay.toISOString())
      .lt('flashcards.next_review', endOfDay.toISOString());

    if (error) {
      console.error('Error fetching today reviews:', error);
      return { data: null, error: error.message };
    }

    // Process today's data
    const todayReviews: DueReview[] = [];
    const deckMap = new Map<string, DueReview>();

    data?.forEach((deck: any) => {
      const deckId = deck.id;
      const todayCards = deck.flashcards.filter((card: any) => {
        const reviewDate = new Date(card.next_review);
        return reviewDate >= startOfDay && reviewDate < endOfDay;
      });

      if (todayCards.length > 0) {
        deckMap.set(deckId, {
          deck_id: deckId,
          deck_name: deck.name,
          due_count: todayCards.length,
          total_cards: deck.flashcards.length,
          priority: getReviewPriority(todayCards.length, deck.flashcards.length)
        });
      }
    });

    const result = Array.from(deckMap.values()).sort((a, b) => b.due_count - a.due_count);
    return { data: result, error: null };
  } catch (err) {
    console.error('Exception fetching today reviews:', err);
    return { data: null, error: 'Failed to fetch today reviews' };
  }
}

function getReviewPriority(dueCount: number, totalCount: number): 'high' | 'medium' | 'low' {
  const percentage = (dueCount / totalCount) * 100;
  
  if (percentage >= 50) return 'high';
  if (percentage >= 25) return 'medium';
  return 'low';
}

export function getReviewPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getReviewPriorityIcon(priority: string): string {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
}

export function formatDueTime(nextReview: string): string {
  const now = new Date();
  const reviewDate = new Date(nextReview);
  const diffMs = reviewDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    return 'Overdue';
  } else if (diffHours < 1) {
    return 'Due now';
  } else if (diffHours < 24) {
    return `Due in ${diffHours}h`;
  } else if (diffDays < 7) {
    return `Due in ${diffDays}d`;
  } else {
    return reviewDate.toLocaleDateString();
  }
}
