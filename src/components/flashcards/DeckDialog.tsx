import React, { useState, useEffect } from 'react';
import { BookOpen, Edit3 } from 'lucide-react';
import type { FlashcardDeck } from '../../lib/flashcard-folders';

interface DeckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, parentId?: string) => void;
  deck?: FlashcardDeck | null;
  parentId?: string;
  mode: 'create' | 'edit';
}

export default function DeckDialog({
  isOpen,
  onClose,
  onSubmit,
  deck,
  parentId,
  mode,
}: DeckDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && deck) {
        setName(deck.name);
        setDescription(deck.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setError('');
    }
  }, [isOpen, mode, deck]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Deck name is required');
      return;
    }

    if (name.length > 50) {
      setError('Deck name must be less than 50 characters');
      return;
    }

    if (description.length > 200) {
      setError('Description must be less than 200 characters');
      return;
    }

    onSubmit(name.trim(), description.trim(), parentId);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex items-center space-x-2 mb-4">
          {mode === 'create' ? (
            <BookOpen className="w-5 h-5 text-primary-600" />
          ) : (
            <Edit3 className="w-5 h-5 text-primary-600" />
          )}
          <h3 className="text-lg font-medium">
            {mode === 'create' ? 'Create New Deck' : 'Edit Deck'}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Deck Name *
            </label>
            <input
              type="text"
              placeholder="Enter deck name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input w-full"
              autoFocus
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description (optional)
            </label>
            <textarea
              placeholder="Enter deck description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full resize-none"
              rows={3}
              maxLength={200}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
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
            disabled={!name.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
