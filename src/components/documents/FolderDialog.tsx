import React, { useState, useEffect } from 'react';
import { Folder, Edit3 } from 'lucide-react';
import type { FolderWithChildren } from '../../lib/folders';

interface FolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, parentId?: string) => void;
  folder?: FolderWithChildren | null;
  parentId?: string;
  mode: 'create' | 'edit';
}

export default function FolderDialog({
  isOpen,
  onClose,
  onSubmit,
  folder,
  parentId,
  mode,
}: FolderDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && folder) {
        setName(folder.name);
      } else {
        setName('');
      }
      setError('');
    }
  }, [isOpen, mode, folder]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    if (name.length > 50) {
      setError('Folder name must be less than 50 characters');
      return;
    }

    onSubmit(name.trim(), parentId);
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
            <Folder className="w-5 h-5 text-primary-600" />
          ) : (
            <Edit3 className="w-5 h-5 text-primary-600" />
          )}
          <h3 className="text-lg font-medium">
            {mode === 'create' ? 'Create New Folder' : 'Rename Folder'}
          </h3>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Folder Name
          </label>
          <input
            type="text"
            placeholder="Enter folder name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input w-full"
            autoFocus
            maxLength={50}
          />
          {error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
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
            {mode === 'create' ? 'Create' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  );
}
