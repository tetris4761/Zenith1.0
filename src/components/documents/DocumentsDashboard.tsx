import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  Plus, 
  Search, 
  Clock, 
  Star,
  MoreHorizontal,
  Grid3X3,
  List,
  Copy,
  Trash2,
  Move,
  Edit,
  Download,
  Filter,
  X,
  Calendar,
  FolderOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { duplicateDocument } from '../../lib/documents';
import MoveDocumentDialog from './MoveDocumentDialog';
import type { Document } from '../../types';
import type { FolderWithChildren } from '../../lib/folders';

interface DocumentsDashboardProps {
  folders: FolderWithChildren[];
  documents: Document[];
  loading: boolean;
  error: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectDocument: (document: Document) => void;
  onCreateFolder: () => void;
  onCreateDocument: () => void;
  onEditFolder: (folder: FolderWithChildren) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onDuplicateDocument: (document: Document) => void;
  onMoveDocument: (documentId: string, folderId: string | null) => void;
}

export default function DocumentsDashboard({
  folders,
  documents,
  loading,
  error,
  onSelectFolder,
  onSelectDocument,
  onCreateFolder,
  onCreateDocument,
  onEditFolder,
  onDeleteFolder,
  onDeleteDocument,
  onDuplicateDocument,
  onMoveDocument
}: DocumentsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    folderId: null as string | null,
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month' | 'year',
    sortBy: 'updated' as 'updated' | 'created' | 'title'
  });
  const [contextMenu, setContextMenu] = useState<{
    type: 'document' | 'folder';
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [moveDialog, setMoveDialog] = useState<{
    isOpen: boolean;
    document: Document | null;
  }>({ isOpen: false, document: null });
  const contextMenuRef = useRef<HTMLDivElement>(null);


  // Filter folders and documents based on search and filters
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [folders, searchQuery]);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Apply search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply folder filter
    if (searchFilters.folderId !== null) {
      filtered = filtered.filter(doc => doc.folder_id === searchFilters.folderId);
    }

    // Apply date range filter
    if (searchFilters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (searchFilters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(doc => 
        new Date(doc.updated_at) >= cutoffDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (searchFilters.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [documents, searchQuery, searchFilters]);

  // Get recent documents (last 10, sorted by updated_at) - only when no search/filters
  const recentDocuments = useMemo(() => {
    if (searchQuery.trim() || searchFilters.folderId !== null || searchFilters.dateRange !== 'all') {
      return [];
    }
    return documents
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);
  }, [documents, searchQuery, searchFilters]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return 'Root';
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Unknown';
  };

  const clearFilters = () => {
    setSearchFilters({
      folderId: null,
      dateRange: 'all',
      sortBy: 'updated'
    });
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return searchQuery.trim() || 
           searchFilters.folderId !== null || 
           searchFilters.dateRange !== 'all' ||
           searchFilters.sortBy !== 'updated';
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, type: 'document' | 'folder', id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type,
      id,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleDuplicateDocument = async (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    try {
      // Call the parent component's duplicate handler
      onDuplicateDocument(document);
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to duplicate document:', error);
    }
  };

  const handleMoveDocument = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    setContextMenu(null);
    setMoveDialog({ isOpen: true, document });
  };

  const handleMoveConfirm = (documentId: string, folderId: string | null) => {
    onMoveDocument(documentId, folderId);
    setMoveDialog({ isOpen: false, document: null });
  };

  const handleDownloadDocument = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    // Create a blob with the document content
    const blob = new Blob([document.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.title}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setContextMenu(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            Error loading documents
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-50 dark:bg-neutral-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Documents
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Manage your documents and folders
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-l-lg transition-colors",
                    viewMode === 'grid' 
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-r-lg transition-colors",
                    viewMode === 'list' 
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* New Document Button */}
              <button
                onClick={onCreateDocument}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Document</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search documents and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors",
                  showFilters || hasActiveFilters()
                    ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                )}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Active Filters */}
            {hasActiveFilters() && (
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Filters:</span>
                
                {searchQuery.trim() && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                
                {searchFilters.folderId !== null && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full">
                    Folder: {getFolderName(searchFilters.folderId)}
                    <button
                      onClick={() => setSearchFilters(prev => ({ ...prev, folderId: null }))}
                      className="ml-1 hover:text-green-600 dark:hover:text-green-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                
                {searchFilters.dateRange !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                    Date: {searchFilters.dateRange}
                    <button
                      onClick={() => setSearchFilters(prev => ({ ...prev, dateRange: 'all' }))}
                      className="ml-1 hover:text-purple-600 dark:hover:text-purple-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                
                {searchFilters.sortBy !== 'updated' && (
                  <span className="inline-flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                    Sort: {searchFilters.sortBy}
                    <button
                      onClick={() => setSearchFilters(prev => ({ ...prev, sortBy: 'updated' }))}
                      className="ml-1 hover:text-orange-600 dark:hover:text-orange-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                
                <button
                  onClick={clearFilters}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Folder Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Folder
                    </label>
                    <select
                      value={searchFilters.folderId || ''}
                      onChange={(e) => setSearchFilters(prev => ({ 
                        ...prev, 
                        folderId: e.target.value || null 
                      }))}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All folders</option>
                      <option value="">Root (No folder)</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Date Range
                    </label>
                    <select
                      value={searchFilters.dateRange}
                      onChange={(e) => setSearchFilters(prev => ({ 
                        ...prev, 
                        dateRange: e.target.value as any 
                      }))}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">Past week</option>
                      <option value="month">Past month</option>
                      <option value="year">Past year</option>
                    </select>
                  </div>

                  {/* Sort By Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Sort By
                    </label>
                    <select
                      value={searchFilters.sortBy}
                      onChange={(e) => setSearchFilters(prev => ({ 
                        ...prev, 
                        sortBy: e.target.value as any 
                      }))}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="updated">Last modified</option>
                      <option value="created">Date created</option>
                      <option value="title">Title (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access - Recent Documents */}
        {!searchQuery && recentDocuments.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Recent Documents
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentDocuments.slice(0, 8).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <button 
                      onClick={(e) => handleContextMenu(e, 'document', doc.id)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2">
                    {doc.title}
                  </h3>
                  
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatDate(doc.updated_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folders Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Folder className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Folders
              </h2>
            </div>
            
            <button
              onClick={onCreateFolder}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              + New Folder
            </button>
          </div>

          {filteredFolders.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {searchQuery ? 'No folders found' : 'No folders yet'}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Create your first folder to organize your documents'}
              </p>
              {!searchQuery && (
                <button
                  onClick={onCreateFolder}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Folder
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Folder className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <button 
                      onClick={(e) => handleContextMenu(e, 'folder', folder.id)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2">
                    {folder.name}
                  </h3>
                  
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {folder.document_count} {folder.document_count === 1 ? 'document' : 'documents'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Results */}
        {hasActiveFilters() && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {searchQuery.trim() ? 'Search Results' : 'Filtered Documents'}
              {filteredDocuments.length > 0 && (
                <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400 ml-2">
                  ({filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'})
                </span>
              )}
            </h2>
            
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  No documents found
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {searchQuery.trim() 
                    ? 'Try searching with different keywords or adjust your filters'
                    : 'Try adjusting your filters to find documents'
                  }
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <button 
                        onClick={(e) => handleContextMenu(e, 'document', doc.id)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2">
                      {doc.title}
                    </h3>
                    
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                      {formatDate(doc.updated_at)}
                    </p>
                    
                    {doc.folder_id && (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center">
                        <FolderOpen className="w-3 h-3 mr-1" />
                        {getFolderName(doc.folder_id)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State - No documents or folders */}
        {!searchQuery && documents.length === 0 && folders.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Welcome to Documents
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
              Get started by creating your first document or organizing your work with folders.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={onCreateDocument}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Document</span>
              </button>
              <button
                onClick={onCreateFolder}
                className="bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-6 py-3 rounded-lg font-medium border border-neutral-200 dark:border-neutral-700 transition-colors flex items-center space-x-2"
              >
                <Folder className="w-4 h-4" />
                <span>Create Folder</span>
              </button>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            ref={contextMenuRef}
            className="fixed bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-2 z-50 min-w-[160px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            {contextMenu.type === 'document' ? (
              <>
                <button
                  onClick={() => handleDuplicateDocument(contextMenu.id)}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => handleMoveDocument(contextMenu.id)}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center space-x-2"
                >
                  <Move className="w-4 h-4" />
                  <span>Move</span>
                </button>
                <button
                  onClick={() => handleDownloadDocument(contextMenu.id)}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <div className="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>
                <button
                  onClick={() => {
                    onDeleteDocument(contextMenu.id);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    const folder = folders.find(f => f.id === contextMenu.id);
                    if (folder) {
                      onEditFolder(folder);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Rename</span>
                </button>
                <div className="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>
                <button
                  onClick={() => {
                    onDeleteFolder(contextMenu.id);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Move Document Dialog */}
        <MoveDocumentDialog
          isOpen={moveDialog.isOpen}
          onClose={() => setMoveDialog({ isOpen: false, document: null })}
          onMove={handleMoveConfirm}
          document={moveDialog.document}
          folders={folders}
        />
      </div>
    </div>
  );
}
