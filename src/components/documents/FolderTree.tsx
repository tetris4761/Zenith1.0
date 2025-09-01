import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, Edit3, Trash2, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { FolderWithChildren } from '../../lib/folders';

interface FolderTreeProps {
  folders: FolderWithChildren[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId?: string) => void;
  onEditFolder: (folder: FolderWithChildren) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveFolder: (folderId: string, newParentId: string | null) => void;
}

interface FolderItemProps {
  folder: FolderWithChildren;
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId?: string) => void;
  onEditFolder: (folder: FolderWithChildren) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveFolder: (folderId: string, newParentId: string | null) => void;
}

function FolderItem({
  folder,
  level,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveFolder,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const hasChildren = folder.children.length > 0 || folder.document_count > 0;
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

        {/* Folder Icon */}
        <div className="mr-2 text-neutral-500">
          {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
        </div>

        {/* Folder Name */}
        <span className="flex-1 truncate text-sm">{folder.name}</span>

        {/* Document Count */}
        {folder.document_count > 0 && (
          <span className="text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
            {folder.document_count}
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
            onClick={handleCreateSubfolder}
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
          >
            <Plus className="w-3 h-3" />
            <span>New Folder</span>
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
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onMoveFolder={onMoveFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveFolder,
}: FolderTreeProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-700">Folders</h3>
          <button
            onClick={() => onCreateFolder()}
            className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700"
            title="New Folder"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {folders.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No folders yet</p>
            <button
              onClick={() => onCreateFolder()}
              className="text-sm text-primary-600 hover:text-primary-700 mt-1"
            >
              Create your first folder
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
                onSelectFolder={onSelectFolder}
                onCreateFolder={onCreateFolder}
                onEditFolder={onEditFolder}
                onDeleteFolder={onDeleteFolder}
                onMoveFolder={onMoveFolder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
