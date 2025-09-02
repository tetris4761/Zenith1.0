import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Plus,
  BookOpen,
  Move,
  Copy,
  Settings,
  Search,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { FlashcardFolderWithChildren, FlashcardDeck } from '../../lib/flashcard-folders';

interface FlashcardFolderTreeProps {
  folders: FlashcardFolderWithChildren[];
  selectedFolderId: string | null;
  selectedDeckId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectDeck: (deckId: string | null) => void;
  onCreateFolder: (parentId?: string) => void;
  onCreateDeck: (folderId?: string) => void;
  onEditFolder: (folder: FlashcardFolderWithChildren) => void;
  onEditDeck: (deck: FlashcardDeck) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onMoveFolder: (folderId: string, newParentId: string | null) => void;
  onMoveDeck: (deckId: string, newFolderId: string | null) => void;
}

interface FolderItemProps {
  folder: FlashcardFolderWithChildren;
  level: number;
  selectedFolderId: string | null;
  selectedDeckId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectDeck: (deckId: string | null) => void;
  onCreateFolder: (parentId?: string) => void;
  onCreateDeck: (folderId?: string) => void;
  onEditFolder: (folder: FlashcardFolderWithChildren) => void;
  onEditDeck: (deck: FlashcardDeck) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onMoveFolder: (folderId: string, newParentId: string | null) => void;
  onMoveDeck: (deckId: string, newFolderId: string | null) => void;
}

function FolderItem({
  folder,
  level,
  selectedFolderId,
  selectedDeckId,
  onSelectFolder,
  onSelectDeck,
  onCreateFolder,
  onCreateDeck,
  onEditFolder,
  onEditDeck,
  onDeleteFolder,
  onDeleteDeck,
  onMoveFolder,
  onMoveDeck,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const hasChildren = folder.children.length > 0 || folder.decks.length > 0;
  const isSelected = selectedFolderId === folder.id;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelectFolder(folder.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(true);
  };

  const handleCreateSubfolder = () => {
    onCreateFolder(folder.id);
    setShowContextMenu(false);
  };

  const handleCreateDeck = () => {
    onCreateDeck(folder.id);
    setShowContextMenu(false);
  };

  const handleEdit = () => {
    onEditFolder(folder);
    setShowContextMenu(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${folder.name}"? This will move all contents to the parent folder.`)) {
      onDeleteFolder(folder.id);
    }
    setShowContextMenu(false);
  };

  const handleMoveToRoot = () => {
    onMoveFolder(folder.id, null);
    setShowContextMenu(false);
  };

  const getFolderIcon = () => {
    if (level === 0) {
      return isExpanded ? <FolderOpen className="w-5 h-5 text-blue-500" /> : <Folder className="w-5 h-5 text-blue-500" />;
    } else {
      return isExpanded ? <FolderOpen className="w-4 h-4 text-neutral-500" /> : <Folder className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getIndentStyle = () => {
    if (level === 0) return {};
    return { 
      paddingLeft: `${level * 20 + 8}px`,
      borderLeft: `2px solid ${level === 1 ? '#e5e7eb' : '#f3f4f6'}`
    };
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 group relative',
          isSelected && 'bg-primary-50 text-primary-700 border border-primary-200',
          level > 0 && 'hover:bg-neutral-50',
          level === 0 && 'font-medium'
        )}
        style={getIndentStyle()}
        onClick={handleToggle}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-neutral-200 rounded mr-2 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <div className="w-5 mr-2" />
        )}

        {/* Folder Icon */}
        <div className="mr-3 flex-shrink-0">
          {getFolderIcon()}
        </div>

        {/* Folder Name and Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={cn(
              'truncate',
              level === 0 ? 'text-sm font-medium' : 'text-sm'
            )}>
              {folder.name}
            </span>
            {folder.deck_count > 0 && (
              <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full flex-shrink-0">
                {folder.deck_count}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowContextMenu(!showContextMenu);
            }}
            className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-600"
            title="More options"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div className="absolute bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[180px] py-1">
          <button
            onClick={handleCreateSubfolder}
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
          >
            <Folder className="w-3 h-3" />
            <span>New Folder</span>
          </button>
          <button
            onClick={handleCreateDeck}
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
          >
            <BookOpen className="w-3 h-3" />
            <span>New Deck</span>
          </button>
          <button
            onClick={handleEdit}
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
          >
            <Edit3 className="w-3 h-3" />
            <span>Rename</span>
          </button>
          {level > 0 && (
            <button
              onClick={handleMoveToRoot}
              className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
            >
              <Move className="w-3 h-3" />
              <span>Move to Root</span>
            </button>
          )}
          <div className="border-t border-neutral-200 my-1"></div>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 rounded flex items-center space-x-2 text-red-600"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Children - Folders */}
      {isExpanded && folder.children.length > 0 && (
        <div className="space-y-1">
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              selectedDeckId={selectedDeckId}
              onSelectFolder={onSelectFolder}
              onSelectDeck={onSelectDeck}
              onCreateFolder={onCreateFolder}
              onCreateDeck={onCreateDeck}
              onEditFolder={onEditFolder}
              onEditDeck={onEditDeck}
              onDeleteFolder={onDeleteFolder}
              onDeleteDeck={onDeleteDeck}
              onMoveFolder={onMoveFolder}
              onMoveDeck={onMoveDeck}
            />
          ))}
        </div>
      )}

      {/* Children - Decks */}
      {isExpanded && folder.decks.length > 0 && (
        <div className="space-y-1">
          {folder.decks.map((deck) => (
            <div
              key={deck.id}
              className={cn(
                'flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 group relative ml-6',
                selectedDeckId === deck.id && 'bg-primary-50 text-primary-700 border border-primary-200',
                'hover:bg-neutral-50'
              )}
              onClick={() => onSelectDeck(deck.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Show deck context menu
              }}
            >
              {/* Deck Icon */}
              <div className="mr-3 flex-shrink-0">
                <BookOpen className="w-4 h-4 text-green-500" />
              </div>

              {/* Deck Name and Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm truncate">{deck.name}</span>
                  {deck.flashcard_count > 0 && (
                    <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      {deck.flashcard_count}
                    </span>
                  )}
                </div>
                {deck.description && (
                  <p className="text-xs text-neutral-500 truncate mt-1">
                    {deck.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditDeck(deck);
                  }}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-600"
                  title="Edit deck"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${deck.name}"?`)) {
                      onDeleteDeck(deck.id);
                    }
                  }}
                  className="p-1 hover:bg-red-50 rounded text-neutral-400 hover:text-red-600"
                  title="Delete deck"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FlashcardFolderTree({
  folders,
  selectedFolderId,
  selectedDeckId,
  onSelectFolder,
  onSelectDeck,
  onCreateFolder,
  onCreateDeck,
  onEditFolder,
  onEditDeck,
  onDeleteFolder,
  onDeleteDeck,
  onMoveFolder,
  onMoveDeck,
}: FlashcardFolderTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'date' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const totalFolders = folders.length;
  const totalDecks = folders.reduce((total, folder) => total + folder.deck_count, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-700 flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Flashcard Folders</span>
          </h3>
          <div className="flex space-x-1">
            <button
              onClick={() => onCreateFolder()}
              className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 hover:text-blue-700 transition-colors"
              title="New Root Folder"
            >
              <Folder className="w-4 h-4" />
            </button>
            <button
              onClick={() => onCreateDeck()}
              className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 hover:text-blue-700 transition-colors"
              title="New Root Deck"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center space-x-4 text-xs text-neutral-600">
          <div className="flex items-center space-x-1">
            <Folder className="w-3 h-3" />
            <span>{totalFolders} folders</span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="w-3 h-3" />
            <span>{totalDecks} decks</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-neutral-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search folders and decks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Sort Controls */}
      <div className="p-3 border-b border-neutral-200">
        <div className="flex items-center space-x-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as 'name' | 'date' | 'type')}
            className="text-xs border border-neutral-200 rounded px-2 py-1"
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="type">Type</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto p-3">
        {folders.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-neutral-900 mb-2">No folders yet</h4>
            <p className="text-xs text-neutral-500 mb-4">
              Create your first folder to organize your flashcard decks
            </p>
            <button
              onClick={() => onCreateFolder()}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Create First Folder
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                level={0}
                selectedFolderId={selectedFolderId}
                selectedDeckId={selectedDeckId}
                onSelectFolder={onSelectFolder}
                onSelectDeck={onSelectDeck}
                onCreateFolder={onCreateFolder}
                onCreateDeck={onCreateDeck}
                onEditFolder={onEditFolder}
                onEditDeck={onEditDeck}
                onDeleteFolder={onDeleteFolder}
                onDeleteDeck={onDeleteDeck}
                onMoveFolder={onMoveFolder}
                onMoveDeck={onMoveDeck}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-200 bg-neutral-50">
        <div className="text-xs text-neutral-500 text-center">
          <p>💡 Tip: Right-click folders and decks for more options</p>
        </div>
      </div>
    </div>
  );
}
