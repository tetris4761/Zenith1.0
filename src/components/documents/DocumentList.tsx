import React from 'react';
import { FileText, Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Document } from '../../types';

interface DocumentListProps {
  documents: Document[];
  selectedDocument: Document | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  onNewDocument: () => void;
  onSelectDocument: (document: Document) => void;
  onDeleteDocument: (documentId: string) => void;
  onSearch: (query: string) => void;
  onRetry: () => void;
}

export default function DocumentList({
  documents,
  selectedDocument,
  loading,
  error,
  searchTerm,
  onNewDocument,
  onSelectDocument,
  onDeleteDocument,
  onSearch,
  onRetry,
}: DocumentListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-neutral-200 flex flex-col">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Documents</h2>
          <button
            onClick={onNewDocument}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-neutral-500 mt-2">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button 
              onClick={onRetry}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Try again
            </button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">
              {searchTerm ? 'No documents found' : 'No documents yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-colors duration-200',
                  selectedDocument?.id === doc.id
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-neutral-50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <h3 className="font-medium text-neutral-900 truncate">{doc.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-neutral-500">
                      <span>•</span>
                      <span>{formatDate(doc.updated_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDocument(doc);
                      }}
                      className="p-1 hover:bg-neutral-100 rounded"
                    >
                      <Edit3 className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc.id);
                      }}
                      className="p-1 hover:bg-red-50 rounded hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
