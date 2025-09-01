import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  FileText, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Plus, 
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  Type
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Document } from '../../types';
import type { FolderWithChildren } from '../../lib/folders';

interface UnifiedSidebarProps {
  folders: FolderWithChildren[];
  documents: Document[];
  selectedFolderId: string | null;
  selectedDocument: Document | null;
  loading: boolean;
  error: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectDocument: (document: Document) => void;
  onCreateFolder: (parentId?: string) => void;
  onCreateDocument: () => void;
  onEditFolder: (folder: FolderWithChildren) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onMoveFolder: (folderId: string, newParentId: string | null) => void;
}

type SortField = 'name' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

export default function UnifiedSidebar({
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
  onMoveFolder,
}: UnifiedSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Get breadcrumb path for selected folder
  const getBreadcrumbPath = (): string[] => {
    if (!selectedFolderId) return ['Root'];
    
    const path: string[] = [];
    const findPath = (folderId: string, folderList: FolderWithChildren[]): boolean => {
      for (const folder of folderList) {
        if (folder.id === folderId) {
          path.unshift(folder.name);
          return true;
        }
        if (folder.children.length > 0 && findPath(folderId, folder.children)) {
          path.unshift(folder.name);
          return true;
        }
      }
      return false;
    };
    
    findPath(selectedFolderId, folders);
    return path.length > 0 ? path : ['Root'];
  };

  // Sort documents
  const getSortedDocuments = () => {
    let sorted = [...documents];
    
    sorted.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (sortField) {
        case 'name':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        case 'type':
          aValue = a.title.split('.').pop() || '';
          bValue = b.title.split('.').pop() || '';
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return sorted;
  };

  // Filter documents by search term
  const getFilteredDocuments = () => {
    const sorted = getSortedDocuments();
    if (!searchTerm.trim()) return sorted;
    
    return sorted.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get documents in current folder
  const getCurrentFolderDocuments = () => {
    if (!selectedFolderId) return getFilteredDocuments();
    return getFilteredDocuments().filter(doc => doc.folder_id === selectedFolderId);
  };

  // Get subfolders in current folder
  const getCurrentFolderSubfolders = () => {
    if (!selectedFolderId) return folders;
    
    const findSubfolders = (folderId: string, folderList: FolderWithChildren[]): FolderWithChildren[] => {
      for (const folder of folderList) {
        if (folder.id === folderId) {
          return folder.children;
        }
        if (folder.children.length > 0) {
          const found = findSubfolders(folderId, folder.children);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    
    return findSubfolders(selectedFolderId, folders);
  };

  const currentDocuments = getCurrentFolderDocuments();
  const currentSubfolders = getCurrentFolderSubfolders();
  const breadcrumbPath = getBreadcrumbPath();

  return (
    <div className="w-80 bg-white border-r border-neutral-200 flex flex-col">
      {/* Header with breadcrumb */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-900">Documents</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onCreateFolder()}
              className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700"
              title="New Folder"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onCreateDocument}
              className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700"
              title="New Document"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-1 text-sm text-neutral-600 mb-3">
          {breadcrumbPath.map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mx-1">/</span>}
              <button
                onClick={() => {
                  // Navigate to this level in the breadcrumb
                  if (index === breadcrumbPath.length - 1) return;
                  // TODO: Implement breadcrumb navigation
                }}
                className={cn(
                  'hover:text-neutral-900 transition-colors',
                  index === breadcrumbPath.length - 1 ? 'text-neutral-900 font-medium' : 'text-neutral-500'
                )}
              >
                {segment}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Sort Controls */}
      <div className="px-4 py-2 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-neutral-600">Sort by:</span>
          <div className="flex items-center space-x-1">
            {[
              { key: 'name', label: 'Name', icon: Type },
              { key: 'date', label: 'Date', icon: Calendar },
              { key: 'type', label: 'Type', icon: Type }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  if (sortField === key) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField(key as SortField);
                    setSortOrder('asc');
                  }
                }}
                className={cn(
                  'px-2 py-1 rounded text-xs transition-colors',
                  sortField === key 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-neutral-600 hover:bg-neutral-200'
                )}
              >
                <Icon className="w-3 h-3 inline mr-1" />
                {label}
                {sortField === key && (
                  sortOrder === 'asc' ? <SortAsc className="w-3 h-3 inline ml-1" /> : <SortDesc className="w-3 h-3 inline ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-neutral-500 mt-2">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500 mb-2">{error}</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Subfolders */}
            {currentSubfolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors border border-neutral-200"
              >
                <Folder className="w-5 h-5 text-blue-500 mr-3" />
                <div className="flex-1">
                  <h3 className="font-medium text-neutral-900">{folder.name}</h3>
                  <p className="text-sm text-neutral-500">
                    {folder.document_count} document{folder.document_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFolder(folder);
                  }}
                  className="p-1 hover:bg-neutral-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            ))}

            {/* Documents */}
            {currentDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={cn(
                  'flex items-center p-3 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors border',
                  selectedDocument?.id === doc.id 
                    ? 'border-primary-300 bg-primary-50' 
                    : 'border-neutral-200'
                )}
              >
                <FileText className="w-5 h-5 text-neutral-500 mr-3" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-neutral-900 truncate">{doc.title}</h3>
                  <p className="text-sm text-neutral-500">
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDocument(doc.id);
                  }}
                  className="p-1 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Empty State */}
            {currentSubfolders.length === 0 && currentDocuments.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">
                  {searchTerm ? 'No documents found' : 'No documents in this folder'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
