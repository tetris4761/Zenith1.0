import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  RotateCcw, 
  BookOpen, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Minus,
  Plus,
  Star
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getDueFlashcards, studyFlashcard } from '../lib/flashcards';
import type { Flashcard } from '../types';

export default function Review() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    completed: 0,
    streak: 0,
    correct: 0,
    incorrect: 0,
  });

  useEffect(() => {
    loadDueFlashcards();
  }, []);

  const loadDueFlashcards = async () => {
    try {
      setLoading(true);
      const { data, error } = await getDueFlashcards();
      
      if (error) {
        setError(error);
        return;
      }

      if (data) {
        setFlashcards(data);
        setSessionStats(prev => ({ ...prev, total: data.length }));
      }
    } catch (err) {
      setError('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleQualityRating = async (quality: 1 | 2 | 3 | 4 | 5) => {
    if (!flashcards[currentIndex]) return;

    try {
      const { error } = await studyFlashcard({
        flashcard: flashcards[currentIndex],
        quality,
      });

      if (error) {
        setError(error);
        return;
      }

      // Update session stats
      const isCorrect = quality >= 3;
      setSessionStats(prev => ({
        ...prev,
        completed: prev.completed + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
        streak: isCorrect ? prev.streak + 1 : 0,
      }));

      // Move to next card or end session
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        // Session completed
        setCurrentIndex(0);
        setShowAnswer(false);
        await loadDueFlashcards(); // Reload for new due cards
      }
    } catch (err) {
      setError('Failed to save review');
    }
  };

  const handleResetSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats(prev => ({ ...prev, completed: 0, correct: 0, incorrect: 0, streak: 0 }));
  };

  const getQualityLabel = (quality: number) => {
    switch (quality) {
      case 1: return 'Again';
      case 2: return 'Hard';
      case 3: return 'Good';
      case 4: return 'Easy';
      case 5: return 'Perfect';
      default: return '';
    }
  };

  const getQualityColor = (quality: number) => {
    switch (quality) {
      case 1: return 'bg-red-500 hover:bg-red-600';
      case 2: return 'bg-orange-500 hover:bg-orange-600';
      case 3: return 'bg-blue-500 hover:bg-blue-600';
      case 4: return 'bg-green-500 hover:bg-green-600';
      case 5: return 'bg-purple-500 hover:bg-purple-600';
      default: return 'bg-neutral-500';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-neutral-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Error loading flashcards</h3>
          <p className="text-neutral-500 mb-4">{error}</p>
          <button
            onClick={loadDueFlashcards}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">All caught up!</h3>
          <p className="text-neutral-500 mb-4">
            You have no flashcards due for review right now.
          </p>
          <button
            onClick={loadDueFlashcards}
            className="btn-primary"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Flashcard Review</h1>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <BookOpen className="w-4 h-4" />
              <span>Progress: {sessionStats.completed + 1} of {sessionStats.total}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <TrendingUp className="w-4 h-4" />
              <span>Streak: {sessionStats.streak}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Clock className="w-4 h-4" />
              <span>Due: {flashcards.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Flashcard */}
          <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8 mb-8">
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-neutral-600 mb-2">Question:</h3>
                <p className="text-xl text-neutral-900 leading-relaxed">{currentCard.front}</p>
              </div>

              {showAnswer && (
                <div className="border-t border-neutral-200 pt-6">
                  <h4 className="text-lg font-medium text-neutral-600 mb-2">Answer:</h4>
                  <p className="text-xl text-neutral-900 leading-relaxed">{currentCard.back}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            {!showAnswer ? (
              <button
                onClick={handleShowAnswer}
                className="btn-primary text-lg px-8 py-3 flex items-center justify-center space-x-2 mx-auto"
              >
                <Eye className="w-5 h-5" />
                <span>Show Answer</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-neutral-600 mb-4">
                  How well did you know this?
                </div>
                
                {/* Quality Rating Buttons */}
                <div className="flex items-center justify-center space-x-3">
                  {[1, 2, 3, 4, 5].map((quality) => (
                    <button
                      key={quality}
                      onClick={() => handleQualityRating(quality as 1 | 2 | 3 | 4 | 5)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-white font-medium transition-colors',
                        getQualityColor(quality)
                      )}
                    >
                      {getQualityLabel(quality)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Session Button */}
            <button
              onClick={handleResetSession}
              className="btn-secondary text-sm px-4 py-2 flex items-center space-x-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Session Stats */}
      {sessionStats.completed > 0 && (
        <div className="bg-white border-t border-neutral-200 p-4">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600">Correct: {sessionStats.correct}</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600">Incorrect: {sessionStats.incorrect}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-600">Streak: {sessionStats.streak}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
