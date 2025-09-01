import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  BookOpen,
  FileText,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Flashcard } from '../../types';
import type { FlashcardDeck } from '../../lib/flashcard-folders';

interface FlashcardManagerProps {
  selectedDeck: FlashcardDeck | null;
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  onCreateFlashcard: () => void;
  onEditFlashcard: (flashcard: Flashcard) => void;
  onDeleteFlashcard: (flashcardId: string) => void;
  onSelectFlashcard: (flashcard: Flashcard) => void;
  selectedFlashcard: Flashcard | null;
}

export default function FlashcardManager({
  selectedDeck,
  flashcards,
  loading,
  error,
  onCreateFlashcard,
  onEditFlashcard,
  onDeleteFlashcard,
  onSelectFlashcard,
  selectedFlashcard,
}: FlashcardManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFlashcards = flashcards.filter(card =>
    card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.back.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getNextReviewText = (nextReview: string) => {
    const now = new Date();
    const reviewDate = new Date(nextReview);
    const diffTime = reviewDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Overdue';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return `${diffDays} days`;
    }
  };

  if (!selectedDeck) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No deck selected</h3>
          <p className="text-neutral-500">
            Choose a deck from the sidebar to view its flashcards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">{selectedDeck.name}</h2>
            {selectedDeck.description && (
              <p className="text-sm text-neutral-600 mt-1">{selectedDeck.description}</p>
            )}
          </div>
          <button
            onClick={onCreateFlashcard}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Card</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search flashcards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-neutral-500 mt-2">Loading flashcards...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500 mb-2">{error}</p>
          </div>
        ) : filteredFlashcards.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">
              {searchTerm ? 'No flashcards found' : 'No flashcards in this deck yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={onCreateFlashcard}
                className="text-sm text-primary-600 hover:text-primary-700 mt-2"
              >
                Create your first flashcard
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredFlashcards.map((card) => (
              <div
                key={card.id}
                onClick={() => onSelectFlashcard(card)}
                className={cn(
                  'p-4 rounded-lg border cursor-pointer transition-colors hover:bg-neutral-50',
                  selectedFlashcard?.id === card.id 
                    ? 'border-primary-300 bg-primary-50' 
                    : 'border-neutral-200'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <h3 className="font-medium text-neutral-900 mb-1">Question:</h3>
                      <p className="text-sm text-neutral-700">{card.front}</p>
                    </div>
                    <div className="mb-3">
                      <h4 className="font-medium text-neutral-900 mb-1">Answer:</h4>
                      <p className="text-sm text-neutral-700">{card.back}</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-xs text-neutral-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Next: {getNextReviewText(card.next_review)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Repetitions: {card.repetitions}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>Ease: {card.ease_factor.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditFlashcard(card);
                      }}
                      className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this flashcard?')) {
                          onDeleteFlashcard(card.id);
                        }
                      }}
                      className="p-1 hover:bg-red-50 rounded text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
