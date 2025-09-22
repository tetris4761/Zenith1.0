import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import DocumentEditor from './DocumentEditor';
import DocumentBrowser from './DocumentBrowser';
import RightPanel from './RightPanel';
import type { Document, FolderWithChildren } from '../../lib/folders';

interface DocumentLayoutProps {
  // Document state
  document: Document | null;
  isNewDocument: boolean;
  newDocumentTitle: string;
  onTitleChange: (title: string) => void;
  onSave: (content: string) => void;
  onNewDocument: () => void;
  saving: boolean;
  
  // Browser state
  folders: FolderWithChildren[];
  documents: Document[];
  selectedFolderId: string | null;
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
  
  // Panel state
  onInsertLink: () => void;
  onInsertImage: () => void;
}

export default function DocumentLayout({
  document,
  isNewDocument,
  newDocumentTitle,
  onTitleChange,
  onSave,
  onNewDocument,
  saving,
  folders,
  documents,
  selectedFolderId,
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
  onInsertLink,
  onInsertImage
}: DocumentLayoutProps) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Flashcard mode state
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flashcardStep, setFlashcardStep] = useState<'front' | 'back' | 'complete'>('front');
  const [pendingFront, setPendingFront] = useState('');
  const [pendingBack, setPendingBack] = useState('');
  const [selectedText, setSelectedText] = useState('');

  const handleOpenBrowser = () => setShowBrowser(true);
  const handleCloseBrowser = () => setShowBrowser(false);
  const handleOpenAIPanel = () => setShowRightPanel(true);
  const handleToggleRightPanel = () => setShowRightPanel(!showRightPanel);

  // Flashcard mode handlers
  const handleToggleFlashcardMode = () => {
    setFlashcardMode(!flashcardMode);
    if (!flashcardMode) {
      setFlashcardStep('front');
      setPendingFront('');
      setPendingBack('');
    }
  };

  const handleResetFlashcardMode = () => {
    setFlashcardMode(false);
    setFlashcardStep('front');
    setPendingFront('');
    setPendingBack('');
    setSelectedText('');
  };

  const handleClearSelectedText = () => {
    setSelectedText('');
  };

  // Show browser if no document is selected
  const shouldShowBrowser = !document && !isNewDocument;

  return (
    <div className="h-full w-full flex relative">
      {/* Document Browser (when no document selected) */}
      {shouldShowBrowser && (
        <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
          <div className="text-center">
            <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              No document selected
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Choose a document from the browser or create a new one
            </p>
            <button
              onClick={handleOpenBrowser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Open Document Browser
            </button>
          </div>
        </div>
      )}

      {/* Document Editor (when document is selected) */}
      {(document || isNewDocument) && (
        <div className="flex-1 h-full">
                   <DocumentEditor
                     document={document}
                     isNewDocument={isNewDocument}
                     newDocumentTitle={newDocumentTitle}
                     onTitleChange={onTitleChange}
                     onSave={onSave}
                     onNewDocument={onNewDocument}
                     saving={saving}
                     onOpenBrowser={handleOpenBrowser}
                     onOpenAIPanel={handleOpenAIPanel}
                     onInsertLink={onInsertLink}
                     onInsertImage={onInsertImage}
                     // Flashcard props
                     flashcardMode={flashcardMode}
                     flashcardStep={flashcardStep}
                     pendingFront={pendingFront}
                     pendingBack={pendingBack}
                     onToggleFlashcardMode={handleToggleFlashcardMode}
                     onResetFlashcardMode={handleResetFlashcardMode}
                     onSetFlashcardStep={setFlashcardStep}
                     onSetPendingFront={setPendingFront}
                     onSetPendingBack={setPendingBack}
                     onSetSelectedText={setSelectedText}
                   />
        </div>
      )}

      {/* Right Panel */}
      {(document || isNewDocument) && (
        <RightPanel
          isOpen={showRightPanel}
          onToggle={handleToggleRightPanel}
          documentContent={document?.content}
          // Flashcard props
          flashcardMode={flashcardMode}
          flashcardStep={flashcardStep}
          pendingFront={pendingFront}
          pendingBack={pendingBack}
          selectedText={selectedText}
          onToggleFlashcardMode={handleToggleFlashcardMode}
          onResetFlashcardMode={handleResetFlashcardMode}
          onSetFlashcardStep={setFlashcardStep}
          onSetPendingFront={setPendingFront}
          onSetPendingBack={setPendingBack}
          onClearSelectedText={handleClearSelectedText}
        />
      )}

      {/* Floating Document Browser */}
      <DocumentBrowser
        isOpen={showBrowser}
        onClose={handleCloseBrowser}
        folders={folders}
        documents={documents}
        selectedFolderId={selectedFolderId}
        selectedDocument={document}
        loading={loading}
        error={error}
        onSelectFolder={(folderId) => {
          onSelectFolder(folderId);
          setShowBrowser(false);
        }}
        onSelectDocument={(doc) => {
          onSelectDocument(doc);
          setShowBrowser(false);
        }}
        onCreateFolder={() => {
          onCreateFolder();
          setShowBrowser(false);
        }}
        onCreateDocument={() => {
          onCreateDocument();
          setShowBrowser(false);
        }}
        onEditFolder={onEditFolder}
        onDeleteFolder={onDeleteFolder}
        onDeleteDocument={onDeleteDocument}
        onMoveFolder={onMoveFolder}
      />
    </div>
  );
}