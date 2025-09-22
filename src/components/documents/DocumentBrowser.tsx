import React, { useState } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  Folder, 
  FolderOpen,
  Plus,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Document, FolderWithChildren } from '../../lib/folders';

interface DocumentBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderWithChildren[];
  documents: Document[];
  selectedFolderId: string | null;
  selectedDocument: Document | null;
  loading: boolean;
  error: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectDocument: (document: Document) => void;
  onCreateFolder: () => void;
  onCreateDocument: () => void;
  onEditFolder: (folder: FolderWithChildren) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onMoveFolder: (folderId: string, newParentId: string | null) => void;
}

export default function DocumentBrowser({
  isOpen,
  onClose,
  folders,
  documents,
  selectedFolderId,
  selectedDocument,
  loading,
  error,
  onSelectFolder,
  onSelectDocument,
  onCreateFolder,
  onCreateDocument,
  onEditFolder,
  onDeleteFolder,
  onDeleteDocument,
  onMoveFolder
}: DocumentBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Get recent documents (last 5, sorted by updated_at)
  const recentDocuments = documents
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-start">
      <div className="w-80 h-full bg-white dark:bg-neutral-800 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Documents
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Recent Documents - Only show when not searching */}
              {searchQuery === '' && recentDocuments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent
                  </h3>
                  <div className="space-y-1">
                    {recentDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => onSelectDocument(doc)}
                        className={cn(
                          "w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors",
                          selectedDocument?.id === doc.id
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                            : "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                        )}
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate text-sm">{doc.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Folders with nested documents */}
              <div className="space-y-1">
                {filteredFolders.map((folder) => (
                  <div key={folder.id}>
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className={cn(
                        "w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors",
                        selectedFolderId === folder.id
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                      )}
                    >
                      {expandedFolders.has(folder.id) ? (
                        <FolderOpen className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="truncate text-sm">{folder.name}</span>
                      <span className="text-xs text-neutral-400 ml-auto">
                        {folder.document_count || 0}
                      </span>
                    </button>
                    
                    {expandedFolders.has(folder.id) && (
                      <div className="ml-6 mt-1 space-y-1 border-l border-neutral-200 dark:border-neutral-700 pl-3">
                        {/* Subfolders */}
                        {folder.children.length > 0 && (
                          <>
                            {folder.children.map((child) => (
                              <button
                                key={child.id}
                                onClick={() => onSelectFolder(child.id)}
                                className="w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                              >
                                <Folder className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate text-sm">{child.name}</span>
                                <span className="text-xs text-neutral-400 ml-auto">
                                  {child.document_count || 0}
                                </span>
                              </button>
                            ))}
                            <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-2"></div>
                          </>
                        )}
                        
                        {/* Documents in this folder */}
                        {folder.documents && folder.documents.length > 0 ? (
                          folder.documents.map((doc) => (
                            <button
                              key={doc.id}
                              onClick={() => onSelectDocument(doc)}
                              className={cn(
                                "w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors",
                                selectedDocument?.id === doc.id
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                                  : "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                              )}
                            >
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate text-sm">{doc.title}</span>
                            </button>
                          ))
                        ) : (
                          <div className="text-xs text-neutral-400 py-2 px-2">
                            No documents in this folder
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Root level documents (documents not in any folder) - Only show when searching */}
              {searchQuery !== '' && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Documents
                  </h3>
                  {filteredDocuments
                    .filter(doc => !doc.folder_id) // Only show documents without a folder
                    .map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => onSelectDocument(doc)}
                      className={cn(
                        "w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors",
                        selectedDocument?.id === doc.id
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                      )}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate text-sm">{doc.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex space-x-2">
            <button
              onClick={onCreateDocument}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Document</span>
            </button>
            <button
              onClick={onCreateFolder}
              className="flex-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Folder className="w-4 h-4" />
              <span>New Folder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
