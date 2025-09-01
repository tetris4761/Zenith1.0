import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlock from '@tiptap/extension-code-block';
import { Save, Plus, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  createDocument, 
  getDocuments, 
  updateDocument, 
  deleteDocument
} from '../lib/documents';
import { 
  createFolder, 
  getFolders, 
  updateFolder, 
  deleteFolder,
  moveFolder 
} from '../lib/folders';
import type { Document, Folder } from '../types';
import type { FolderWithChildren } from '../lib/folders';
import { useAuth } from '../contexts/AuthContext';
import EditorToolbar from '../components/documents/EditorToolbar';
import LinkDialog from '../components/documents/LinkDialog';
import ImageDialog from '../components/documents/ImageDialog';
import FolderDialog from '../components/documents/FolderDialog';
import UnifiedSidebar from '../components/documents/UnifiedSidebar';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewDocument, setShowNewDocument] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  
  // Folder state
  const [folders, setFolders] = useState<FolderWithChildren[]>([]);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<'create' | 'edit'>('create');
  const [editingFolder, setEditingFolder] = useState<FolderWithChildren | null>(null);
  const [folderParentId, setFolderParentId] = useState<string | undefined>(undefined);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 p-4 rounded font-mono text-sm',
        },
      }),
    ],
    content: '<p>Start writing your notes...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  // Load documents and folders on component mount
  useEffect(() => {
    if (user) {
      loadDocuments();
      loadFolders();
    }
  }, [user]);

  // Reload documents when selected folder changes
  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [selectedFolderId, user]);

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

  // Load document content when selection changes
  useEffect(() => {
    if (selectedDocument && editor) {
      editor.commands.setContent(selectedDocument.content);
    }
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
      
      // Filter documents by selected folder
      let filteredDocuments = data || [];
      if (selectedFolderId) {
        filteredDocuments = filteredDocuments.filter(doc => doc.folder_id === selectedFolderId);
      }
      
      setDocuments(filteredDocuments);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const { data, error } = await getFolders();
      
      if (error) {
        console.error('Failed to load folders:', error);
        return;
      }
      
      setFolders(data || []);
    } catch (err) {
      console.error('Failed to load folders:', err);
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
        folder_id: selectedFolderId,
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



  const handleSelectDocument = useCallback((document: Document) => {
    setSelectedDocument(document);
    setShowNewDocument(false);
  }, []);

  const handleInsertLink = (url: string) => {
    if (editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleInsertImage = (url: string) => {
    if (editor) {
      editor.chain().focus().insertContent(`<img src="${url}" alt="Image" />`).run();
    }
  };

  // Folder management functions
  const handleCreateFolder = (parentId?: string) => {
    setFolderDialogMode('create');
    setFolderParentId(parentId);
    setEditingFolder(null);
    setShowFolderDialog(true);
  };

  const handleEditFolder = (folder: FolderWithChildren) => {
    setFolderDialogMode('edit');
    setEditingFolder(folder);
    setFolderParentId(undefined);
    setShowFolderDialog(true);
  };

  const handleFolderSubmit = async (name: string, parentId?: string) => {
    try {
      if (folderDialogMode === 'create') {
        const { data: folder, error } = await createFolder({ name, parent_id: parentId });
        if (error) {
          setError(error);
          return;
        }
        if (folder) {
          await loadFolders();
        }
      } else if (folderDialogMode === 'edit' && editingFolder) {
        const { data: folder, error } = await updateFolder(editingFolder.id, { name });
        if (error) {
          setError(error);
          return;
        }
        if (folder) {
          await loadFolders();
        }
      }
    } catch (err) {
      setError('Failed to manage folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const { error } = await deleteFolder(folderId);
      if (error) {
        setError(error);
        return;
      }
      await loadFolders();
      await loadDocuments();
    } catch (err) {
      setError('Failed to delete folder');
    }
  };

  const handleMoveFolder = async (folderId: string, newParentId: string | null) => {
    try {
      const { error } = await moveFolder(folderId, newParentId);
      if (error) {
        setError(error);
        return;
      }
      await loadFolders();
    } catch (err) {
      setError('Failed to move folder');
    }
  };

  const handleSelectFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSelectedDocument(null);
    setShowNewDocument(false);
  };

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Unified Navigation */}
      <UnifiedSidebar
        folders={folders}
        documents={documents}
        selectedFolderId={selectedFolderId}
        selectedDocument={selectedDocument}
        loading={loading}
        error={error}
        onSelectFolder={handleSelectFolder}
        onSelectDocument={handleSelectDocument}
        onCreateFolder={handleCreateFolder}
        onCreateDocument={handleNewDocument}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onDeleteDocument={handleDeleteDocument}
        onMoveFolder={handleMoveFolder}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Editor Header */}
        <div className="border-b border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-4">
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

          {/* Rich Text Editor Toolbar */}
          {(showNewDocument || selectedDocument) && (
            <EditorToolbar
              editor={editor}
              onInsertLink={() => setShowLinkDialog(true)}
              onInsertImage={() => setShowImageDialog(true)}
            />
          )}
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto">
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

      {/* Dialogs */}
      <LinkDialog
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        onInsert={handleInsertLink}
      />
      
      <ImageDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onInsert={handleInsertImage}
      />

      <FolderDialog
        isOpen={showFolderDialog}
        onClose={() => setShowFolderDialog(false)}
        onSubmit={handleFolderSubmit}
        folder={editingFolder}
        parentId={folderParentId}
        mode={folderDialogMode}
      />
    </div>
  );
}
