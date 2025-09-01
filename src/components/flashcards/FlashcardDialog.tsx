import React, { useState, useEffect } from 'react';
import { FileText, Edit3 } from 'lucide-react';
import type { Flashcard } from '../../types';

interface FlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (front: string, back: string) => void;
  flashcard?: Flashcard | null;
  mode: 'create' | 'edit';
}

export default function FlashcardDialog({
  isOpen,
  onClose,
  onSubmit,
  flashcard,
  mode,
}: FlashcardDialogProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && flashcard) {
        setFront(flashcard.front);
        setBack(flashcard.back);
      } else {
        setFront('');
        setBack('');
      }
      setError('');
    }
  }, [isOpen, mode, flashcard]);

  const handleSubmit = () => {
    if (!front.trim()) {
      setError('Question is required');
      return;
    }

    if (!back.trim()) {
      setError('Answer is required');
      return;
    }

    if (front.length > 500) {
      setError('Question must be less than 500 characters');
      return;
    }

    if (back.length > 1000) {
      setError('Answer must be less than 1000 characters');
      return;
    }

    onSubmit(front.trim(), back.trim());
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center space-x-2 mb-4">
          {mode === 'create' ? (
            <FileText className="w-5 h-5 text-primary-600" />
          ) : (
            <Edit3 className="w-5 h-5 text-primary-600" />
          )}
          <h3 className="text-lg font-medium">
            {mode === 'create' ? 'Create New Flashcard' : 'Edit Flashcard'}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Question *
            </label>
            <textarea
              placeholder="Enter the question..."
              value={front}
              onChange={(e) => setFront(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input w-full resize-none"
              rows={3}
              maxLength={500}
              autoFocus
            />
            <div className="text-xs text-neutral-400 text-right mt-1">
              {front.length}/500
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Answer *
            </label>
            <textarea
              placeholder="Enter the answer..."
              value={back}
              onChange={(e) => setBack(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input w-full resize-none"
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-neutral-400 text-right mt-1">
              {back.length}/1000
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded">
            <p><strong>Tip:</strong> Press Ctrl+Enter to save quickly</p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!front.trim() || !back.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
