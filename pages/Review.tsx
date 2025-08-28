import React, { useState } from 'react';
import { 
  RotateCcw, 
  X, 
  Minus, 
  Check, 
  Plus,
  TrendingUp,
  Clock,
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Flashcard {
  id: number;
  front: string;
  back: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
}

export default function Review() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    reviewed: 0,
    correct: 0,
    streak: 0,
  });

  // Mock flashcards data
  const [flashcards] = useState<Flashcard[]>([
    {
      id: 1,
      front: "What is the capital of France?",
      back: "Paris",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: "2024-04-18",
    },
    {
      id: 2,
      front: "What is the chemical symbol for gold?",
      back: "Au",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: "2024-04-18",
    },
    {
      id: 3,
      front: "What is the largest planet in our solar system?",
      back: "Jupiter",
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: "2024-04-18",
    },
  ]);

  const currentCard = flashcards[currentCardIndex];

  const handleQualityRating = (quality: number) => {
    // Update review stats
    setReviewStats(prev => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (quality >= 3 ? 1 : 0),
      streak: quality >= 3 ? prev.streak + 1 : 0,
    }));

    // Move to next card
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Review session complete
      setReviewStats(prev => ({ ...prev, total: flashcards.length }));
    }
  };

  const handleFlipCard = () => {
    setShowAnswer(!showAnswer);
  };

  const handleResetSession = () => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setReviewStats({
      total: 0,
      reviewed: 0,
      correct: 0,
      streak: 0,
    });
  };

  if (reviewStats.reviewed >= flashcards.length) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="card">
          <div className="text-green-600 mb-4">
            <Check className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Review Session Complete!</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{reviewStats.correct}</div>
              <div className="text-sm text-neutral-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{reviewStats.streak}</div>
              <div className="text-sm text-neutral-600">Streak</div>
            </div>
          </div>
          
          <button
            onClick={handleResetSession}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start New Session</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-neutral-900">Review Session</h1>
          <div className="flex items-center space-x-4 text-sm text-neutral-600">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>{reviewStats.reviewed + 1} of {flashcards.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Streak: {reviewStats.streak}</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((reviewStats.reviewed + 1) / flashcards.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="card max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-sm text-neutral-500 mb-2">
            {showAnswer ? 'Answer' : 'Question'}
          </div>
          <div className="text-2xl font-medium text-neutral-900 min-h-[4rem] flex items-center justify-center">
            {showAnswer ? currentCard.back : currentCard.front}
          </div>
        </div>

        {!showAnswer && (
          <button
            onClick={handleFlipCard}
            className="w-full btn-secondary mb-6"
          >
            Show Answer
          </button>
        )}

        {showAnswer && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600 text-center mb-6">
              How well did you know this?
            </p>
            
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => handleQualityRating(1)}
                className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-200"
              >
                <X className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-medium">Again</div>
              </button>
              
              <button
                onClick={() => handleQualityRating(2)}
                className="p-3 border border-orange-200 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors duration-200"
              >
                <Minus className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-medium">Hard</div>
              </button>
              
              <button
                onClick={() => handleQualityRating(3)}
                className="p-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                <Check className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-medium">Good</div>
              </button>
              
              <button
                onClick={() => handleQualityRating(4)}
                className="p-3 border border-green-200 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200"
              >
                <Plus className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-medium">Easy</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session Controls */}
      <div className="text-center mt-6">
        <button
          onClick={handleResetSession}
          className="btn-secondary flex items-center space-x-2 mx-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Session</span>
        </button>
      </div>
    </div>
  );
}
