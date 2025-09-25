import React, { useState, useEffect } from 'react';
import { X, Folder, FolderOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Document } from '../../types';
import type { FolderWithChildren } from '../../lib/folders';

interface MoveDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (documentId: string, folderId: string | null) => void;
  document: Document | null;
  folders: FolderWithChildren[];
}

export default function MoveDocumentDialog({
  isOpen,
  onClose,
  onMove,
  document,
  folders
}: MoveDocumentDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen && document) {
      setSelectedFolderId(document.folder_id || null);
    } else {
      setSelectedFolderId(null);
      setExpandedFolders(new Set());
    }
  }, [isOpen, document]);

  const handleMove = () => {
    if (!document) return;
    onMove(document.id, selectedFolderId);
    onClose();
  };

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolder = (folder: FolderWithChildren, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors",
            isSelected 
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" 
              : "hover:bg-neutral-100 dark:hover:bg-neutral-700"
          )}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => setSelectedFolderId(folder.id)}
        >
          {folder.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpansion(folder.id);
              }}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded transition-colors"
            >
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-neutral-500" />
              ) : (
                <Folder className="w-4 h-4 text-neutral-500" />
              )}
            </button>
          )}
          
          {folder.children.length === 0 && (
            <div className="w-6 h-6 flex items-center justify-center">
              <Folder className="w-4 h-4 text-neutral-500" />
            </div>
          )}
          
          <span className="text-sm font-medium">{folder.name}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            ({folder.document_count} docs)
          </span>
        </div>
        
        {isExpanded && folder.children.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Move Document
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Document Info */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                {document.title.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                {document.title}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Choose a destination folder
              </p>
            </div>
          </div>
        </div>

        {/* Folder List */}
        <div className="p-6 max-h-64 overflow-y-auto">
          {/* Root folder option */}
          <div
            className={cn(
              "flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors mb-2",
              selectedFolderId === null 
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100" 
                : "hover:bg-neutral-100 dark:hover:bg-neutral-700"
            )}
            onClick={() => setSelectedFolderId(null)}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <Folder className="w-4 h-4 text-neutral-500" />
            </div>
            <span className="text-sm font-medium">Root (No folder)</span>
          </div>

          {/* Folders */}
          {folders.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">
                No folders available
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {folders.map(folder => renderFolder(folder))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Move Document
          </button>
        </div>
      </div>
    </div>
  );
}
