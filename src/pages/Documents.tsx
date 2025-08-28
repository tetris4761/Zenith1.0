import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Save, 
  Plus, 
  Folder, 
  FileText, 
  MoreVertical,
  Search,
  Filter,
  Trash2,
  Edit3
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  Document, 
  createDocument, 
  getDocuments, 
  updateDocument, 
  deleteDocument,
  searchDocuments 
} from '../lib/documents';
import { useAuth } from '../contexts/AuthContext';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showNewDocument, setShowNewDocument] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your notes...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  // Load documents on component mount
  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  // Auto-save every 30 seconds when editing
  useEffect(() => {
    if (!selectedDocument || !editor) return;

    const interval = setInterval(() => {
      if (selectedDocument) {
        handleAutoSave();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedDocument, editor]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await getDocuments();
      
      if (error) {
        setError(error);
        return;
      }
      
      setDocuments(data || []);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleNewDocument = () => {
    setShowNewDocument(true);
    setSelectedDocument(null);
    setNewDocumentTitle('');
    if (editor) {
      editor.commands.setContent('<p>Start writing your notes...</p>');
    }
  };

  const handleCreateDocument = async () => {
    if (!newDocumentTitle.trim() || !editor) return;

    try {
      setSaving(true);
      setError(null);
      
      const content = editor.getHTML();
      const { data: document, error } = await createDocument({
        title: newDocumentTitle.trim(),
        content,
      });

      if (error) {
        setError(error);
        return;
      }

      if (document) {
        setDocuments(prev => [document, ...prev]);
        setSelectedDocument(document);
        setShowNewDocument(false);
        setNewDocumentTitle('');
      }
    } catch (err) {
      setError('Failed to create document');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!selectedDocument || !editor) return;

    try {
      setSaving(true);
      setError(null);
      
      const content = editor.getHTML();
      const { data: document, error } = await updateDocument(selectedDocument.id, {
        content,
        title: selectedDocument.title,
      });

      if (error) {
        setError(error);
        return;
      }

      if (document) {
        setSelectedDocument(document);
        setDocuments(prev => 
          prev.map(doc => doc.id === document.id ? document : doc)
        );
      }
    } catch (err) {
      setError('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSave = async () => {
    if (!selectedDocument || !editor) return;
    
    try {
      const content = editor.getHTML();
      await updateDocument(selectedDocument.id, { content });
      // Silent auto-save, no user feedback needed
    } catch (err) {
      // Auto-save errors are silent to avoid interrupting user
      console.error('Auto-save failed:', err);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      const { error } = await deleteDocument(documentId);
      
      if (error) {
        setError(error);
        return;
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setShowNewDocument(false);
        if (editor) {
          editor.commands.setContent('<p>Start writing your notes...</p>');
        }
      }
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    
    if (!query.trim()) {
      loadDocuments();
      return;
    }

    try {
      const { data, error } = await searchDocuments(query);
      
      if (error) {
        setError(error);
        return;
      }
      
      setDocuments(data || []);
    } catch (err) {
      setError('Failed to search documents');
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Document List */}
      <div className="w-80 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Documents</h2>
            <button
              onClick={handleNewDocument}
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
              onChange={(e) => handleSearch(e.target.value)}
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
                onClick={loadDocuments}
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
                  onClick={() => setSelectedDocument(doc)}
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
                          setSelectedDocument(doc);
                        }}
                        className="p-1 hover:bg-neutral-100 rounded"
                      >
                        <Edit3 className="w-4 h-4 text-neutral-400" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc.id);
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

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Editor Toolbar */}
        <div className="border-b border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showNewDocument && (
                <input
                  type="text"
                  placeholder="Document title..."
                  value={newDocumentTitle}
                  onChange={(e) => setNewDocumentTitle(e.target.value)}
                  className="input max-w-xs"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateDocument()}
                />
              )}
              {selectedDocument && (
                <h3 className="text-lg font-medium text-neutral-900">{selectedDocument.title}</h3>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {showNewDocument && (
                <button
                  onClick={handleCreateDocument}
                  disabled={!newDocumentTitle.trim() || saving}
                  className="btn-accent flex items-center space-x-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{saving ? 'Creating...' : 'Create'}</span>
                </button>
              )}
              {selectedDocument && (
                <button
                  onClick={handleSaveDocument}
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {showNewDocument || selectedDocument ? (
            <div className="max-w-4xl mx-auto">
              <EditorContent editor={editor} />
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No document selected</h3>
              <p className="text-neutral-500 mb-4">
                Choose a document from the sidebar or create a new one to get started.
              </p>
              <button
                onClick={handleNewDocument}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Document</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
