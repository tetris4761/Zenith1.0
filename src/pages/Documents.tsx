import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  createDocument, 
  getDocuments, 
  updateDocument, 
  deleteDocument,
  duplicateDocument,
  moveDocument
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
import DocumentLayout from '../components/documents/DocumentLayout';
import LinkDialog from '../components/documents/LinkDialog';
import ImageDialog from '../components/documents/ImageDialog';
import FolderDialog from '../components/documents/FolderDialog';
import AIAssistant from '../components/AIAssistant';

export default function Documents() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Load documents and folders on component mount
  useEffect(() => {
    if (user) {
      loadDocuments();
      loadFolders();
    }
  }, [user]);

  // Handle URL parameters to open specific document
  useEffect(() => {
    const docId = searchParams.get('doc');
    if (docId && documents.length > 0) {
      const document = documents.find(doc => doc.id === docId);
      if (document) {
        setSelectedDocument(document);
        // Clear the URL parameter after opening
        setSearchParams({});
      }
    }
  }, [documents, searchParams, setSearchParams]);

  // Reload documents when selected folder changes
  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [selectedFolderId, user]);

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
  };

  const handleCreateDocument = async () => {
    if (!newDocumentTitle.trim()) return;

    try {
      setSaving(true);
      setError(null);
      
      const content = '<p>Start writing your notes...</p>';
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

  const handleSaveDocument = async (content: string) => {
    if (!selectedDocument) return;

    try {
      setSaving(true);
      setError(null);
      
      // Update the document with the new content from the editor
      const { data: document, error } = await updateDocument(selectedDocument.id, {
        content: content,
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
      }
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const handleDuplicateDocument = async (document: Document) => {
    try {
      setError(null);
      const { data: duplicatedDocument, error } = await duplicateDocument(document);
      
      if (error) {
        setError(error);
        return;
      }

      if (duplicatedDocument) {
        // Add the duplicated document to the beginning of the list
        setDocuments(prev => [duplicatedDocument, ...prev]);
        
        // Optionally open the duplicated document
        setSelectedDocument(duplicatedDocument);
        setShowNewDocument(false);
      }
    } catch (err) {
      setError('Failed to duplicate document');
    }
  };

  const handleMoveDocument = async (documentId: string, folderId: string | null) => {
    try {
      setError(null);
      const { data: movedDocument, error } = await moveDocument(documentId, folderId);
      
      if (error) {
        setError(error);
        return;
      }

      if (movedDocument) {
        // Update the document in the list
        setDocuments(prev => 
          prev.map(doc => doc.id === documentId ? movedDocument : doc)
        );
        
        // Update selected document if it's the one being moved
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(movedDocument);
        }
      }
    } catch (err) {
      setError('Failed to move document');
    }
  };

  const handleSelectDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowNewDocument(false);
  };

  const handleInsertLink = (url: string) => {
    // Link insertion will be handled by the DocumentEditor component
    console.log('Insert link:', url);
  };

  const handleInsertImage = (url: string) => {
    // Image insertion will be handled by the DocumentEditor component
    console.log('Insert image:', url);
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
      } else if (editingFolder) {
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
    <>
      <DocumentLayout
        // Document state
        document={selectedDocument}
        isNewDocument={showNewDocument}
        newDocumentTitle={newDocumentTitle}
        onTitleChange={setNewDocumentTitle}
        onSave={handleSaveDocument}
        onNewDocument={handleCreateDocument}
        saving={saving}
        
        // Browser state
        folders={folders}
        documents={documents}
        selectedFolderId={selectedFolderId}
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
        onDuplicateDocument={handleDuplicateDocument}
        onMoveDocument={handleMoveDocument}
        
        // Panel state
        onInsertLink={() => setShowLinkDialog(true)}
        onInsertImage={() => setShowImageDialog(true)}
        
        // Navigation
        onBackToDashboard={() => {
          setSelectedDocument(null);
          setShowNewDocument(false);
        }}
      />

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

      <AIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        context={selectedDocument ? selectedDocument.content : undefined}
      />
    </>
  );
}