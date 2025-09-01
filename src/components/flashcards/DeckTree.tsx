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
  BookOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DeckWithChildren } from '../../lib/decks';

interface DeckTreeProps {
  decks: DeckWithChildren[];
  selectedDeckId: string | null;
  onSelectDeck: (deckId: string | null) => void;
  onCreateDeck: (parentId?: string) => void;
  onEditDeck: (deck: DeckWithChildren) => void;
  onDeleteDeck: (deckId: string) => void;
  onMoveDeck: (deckId: string, newParentId: string | null) => void;
}

interface DeckItemProps {
  deck: DeckWithChildren;
  level: number;
  selectedDeckId: string | null;
  onSelectDeck: (deckId: string | null) => void;
  onCreateDeck: (parentId?: string) => void;
  onEditDeck: (deck: DeckWithChildren) => void;
  onDeleteDeck: (deckId: string) => void;
  onMoveDeck: (deckId: string, newParentId: string | null) => void;
}

function DeckItem({
  deck,
  level,
  selectedDeckId,
  onSelectDeck,
  onCreateDeck,
  onEditDeck,
  onDeleteDeck,
  onMoveDeck,
}: DeckItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const hasChildren = deck.children.length > 0 || deck.flashcard_count > 0;
  const isSelected = selectedDeckId === deck.id;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelectDeck(deck.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(true);
  };

  const handleCreateSubdeck = () => {
    onCreateDeck(deck.id);
    setShowContextMenu(false);
  };

  const handleEdit = () => {
    onEditDeck(deck);
    setShowContextMenu(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${deck.name}"? This will move all contents to the parent deck.`)) {
      onDeleteDeck(deck.id);
    }
    setShowContextMenu(false);
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center py-1 px-2 rounded cursor-pointer hover:bg-neutral-100 transition-colors',
          isSelected && 'bg-primary-50 text-primary-700',
          level > 0 && 'ml-4'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
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
            className="p-1 hover:bg-neutral-200 rounded mr-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <div className="w-5 mr-1" />
        )}

        {/* Deck Icon */}
        <div className="mr-2 text-neutral-500">
          {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
        </div>

        {/* Deck Name */}
        <span className="flex-1 truncate text-sm">{deck.name}</span>

        {/* Flashcard Count */}
        {deck.flashcard_count > 0 && (
          <span className="text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
            {deck.flashcard_count}
          </span>
        )}

        {/* Context Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowContextMenu(!showContextMenu);
          }}
          className="p-1 hover:bg-neutral-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-3 h-3" />
        </button>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div className="absolute bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[160px]">
          <button
            onClick={handleCreateSubdeck}
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
          >
            <Plus className="w-3 h-3" />
            <span>New Deck</span>
          </button>
          <button
            onClick={handleEdit}
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
          >
            <Edit3 className="w-3 h-3" />
            <span>Rename</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2 text-red-600"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {deck.children.map((child) => (
            <DeckItem
              key={child.id}
              deck={child}
              level={level + 1}
              selectedDeckId={selectedDeckId}
              onSelectDeck={onSelectDeck}
              onCreateDeck={onCreateDeck}
              onEditDeck={onEditDeck}
              onDeleteDeck={onDeleteDeck}
              onMoveDeck={onMoveDeck}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DeckTree({
  decks,
  selectedDeckId,
  onSelectDeck,
  onCreateDeck,
  onEditDeck,
  onDeleteDeck,
  onMoveDeck,
}: DeckTreeProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-700 flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Decks</span>
          </h3>
          <button
            onClick={() => onCreateDeck()}
            className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700"
            title="New Deck"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deck Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {decks.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No decks yet</p>
            <button
              onClick={() => onCreateDeck()}
              className="text-sm text-primary-600 hover:text-primary-700 mt-1"
            >
              Create your first deck
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {decks.map((deck) => (
              <DeckItem
                key={deck.id}
                deck={deck}
                level={0}
                selectedDeckId={selectedDeckId}
                onSelectDeck={onSelectDeck}
                onCreateDeck={onCreateDeck}
                onEditDeck={onEditDeck}
                onDeleteDeck={onDeleteDeck}
                onMoveDeck={onMoveDeck}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
