import React from 'react';
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
import { 
  Menu, 
  Save, 
  Bot, 
  FileText,
  Loader2,
  BookOpen,
  Edit3,
  Check,
  X,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';
import EditorToolbar from './EditorToolbar';
import { generateFlashcard as generateFlashcardAI } from '../../lib/ai';
import type { Document } from '../../types';

interface DocumentEditorProps {
  document: Document | null;
  isNewDocument: boolean;
  newDocumentTitle: string;
  onTitleChange: (title: string) => void;
  onSave: (content: string) => void;
  onNewDocument: () => void;
  saving: boolean;
  onOpenBrowser: () => void;
  onOpenAIPanel: () => void;
  onInsertLink: () => void;
  onInsertImage: () => void;
  // Flashcard props
  flashcardMode?: boolean;
  flashcardStep?: 'front' | 'back' | 'complete';
  pendingFront?: string;
  pendingBack?: string;
  onToggleFlashcardMode?: () => void;
  onResetFlashcardMode?: () => void;
  onSetFlashcardStep?: (step: 'front' | 'back' | 'complete') => void;
  onSetPendingFront?: (front: string) => void;
  onSetPendingBack?: (back: string) => void;
  onSetSelectedText?: (text: string) => void;
}

export default function DocumentEditor({
  document,
  isNewDocument,
  newDocumentTitle,
  onTitleChange,
  onSave,
  onNewDocument,
  saving,
  onOpenBrowser,
  onOpenAIPanel,
  onInsertLink,
  onInsertImage,
  // Flashcard props
  flashcardMode = false,
  flashcardStep = 'front',
  pendingFront = '',
  pendingBack = '',
  onToggleFlashcardMode,
  onResetFlashcardMode,
  onSetFlashcardStep,
  onSetPendingFront,
  onSetPendingBack,
  onSetSelectedText
}: DocumentEditorProps) {
  // Flashcard state
  const [selectedText, setSelectedText] = React.useState('');
  const [tempSelectedText, setTempSelectedText] = React.useState('');

  // Confirm selection with Enter key
  const confirmSelection = React.useCallback(() => {
    if (!tempSelectedText.trim()) return;
    
    const trimmedText = tempSelectedText.trim();
    console.log('🔍 Confirming selection:', { text: trimmedText, step: flashcardStep });

    // Keep the selection visible by storing it
    setSelectedText(trimmedText);
    
    if (flashcardStep === 'front') {
      onSetPendingFront?.(trimmedText);
      onSetFlashcardStep?.('back');
      console.log('✅ Set front, moving to back step');
    } else if (flashcardStep === 'back') {
      onSetPendingBack?.(trimmedText);
      onSetFlashcardStep?.('complete');
      console.log('✅ Set back, moving to complete step');
    }
    
    // Clear temp selection but keep the confirmed one
    setTempSelectedText('');
  }, [tempSelectedText, flashcardStep, onSetPendingFront, onSetPendingBack, onSetFlashcardStep]);

  // Handle text selection (temporary)
  const handleTextSelection = React.useCallback((text: string) => {
    if (!flashcardMode) return;
    
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      // Only clear temp selection if we don't have a confirmed selection
      if (!selectedText) {
        setTempSelectedText('');
        onSetSelectedText?.('');
      }
      return;
    }

    console.log('📝 Text selected (temp):', trimmedText);
    setTempSelectedText(trimmedText);
    onSetSelectedText?.(trimmedText);
  }, [flashcardMode, selectedText, onSetSelectedText]);

  // Reset flashcard mode
  const resetFlashcardMode = React.useCallback(() => {
    setSelectedText('');
    setTempSelectedText('');
    onSetSelectedText?.('');
    onResetFlashcardMode?.();
  }, [onResetFlashcardMode, onSetSelectedText]);

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
          class: 'bg-gray-100 p-4 rounded-lg font-mono text-sm',
        },
      }),
    ],
    content: document?.content || '',
    onUpdate: ({ editor }) => {
      // Auto-save logic can be added here
    },
  });

  // Update editor content when document changes
  React.useEffect(() => {
    if (document && editor) {
      editor.commands.setContent(document.content);
    }
  }, [document, editor]);

  // Add text selection listeners when flashcard mode is active
  React.useEffect(() => {
    if (!flashcardMode || !editor) return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const text = selection.toString().trim();
        if (text.length > 0) {
          handleTextSelection(text);
        }
      } else {
        // Only clear if we don't have a confirmed selection
        if (!selectedText) {
          setTempSelectedText('');
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Enter if we have a selection AND flashcard mode is active
      if (e.key === 'Enter' && flashcardMode && tempSelectedText.trim()) {
        // Check if there's actually a text selection
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          e.preventDefault();
          e.stopPropagation();
          confirmSelection();
          return false;
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('mouseup', handleSelectionChange);
    editorElement.addEventListener('keyup', handleSelectionChange);
    editorElement.addEventListener('keydown', handleKeyDown);

    return () => {
      editorElement.removeEventListener('mouseup', handleSelectionChange);
      editorElement.removeEventListener('keyup', handleSelectionChange);
      editorElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [flashcardMode, editor, handleTextSelection, confirmSelection, tempSelectedText, selectedText]);

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Top Bar */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 p-3">
        <div className="flex items-center justify-between">
          {/* Left side - Menu and Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenBrowser}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              title="Back to documents"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            
            {isNewDocument ? (
              <input
                type="text"
                placeholder="Document title..."
                value={newDocumentTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                autoFocus
              />
            ) : (
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {document?.title || 'Untitled Document'}
              </h1>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAIPanel}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Bot className="w-4 h-4" />
              <span>AI Assistant</span>
            </button>
            
            {isNewDocument ? (
              <button
                onClick={onNewDocument}
                disabled={!newDocumentTitle.trim() || saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>{saving ? 'Creating...' : 'Create'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (editor) {
                    const content = editor.getHTML();
                    onSave(content);
                  }
                }}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Flashcard Mode Status */}
        {flashcardMode && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Flashcard Mode: {flashcardStep === 'front' && 'Select front text'}
                  {flashcardStep === 'back' && 'Select back text'}
                  {flashcardStep === 'complete' && 'Ready for AI optimization'}
                </span>
              </div>
              <button
                onClick={onResetFlashcardMode}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Editor Toolbar */}
        {editor && (
          <div className="mt-4">
            <EditorToolbar
              editor={editor}
              onInsertLink={onInsertLink}
              onInsertImage={onInsertImage}
            />
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto p-8">
          <EditorContent 
            editor={editor} 
            className="min-h-full focus:outline-none [&_.ProseMirror]:min-h-[600px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-neutral-900 [&_.ProseMirror]:dark:text-neutral-100 [&_.ProseMirror]:leading-relaxed [&_.ProseMirror]:text-base [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-6 [&_.ProseMirror_h1]:mt-8 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-4 [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mb-3 [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_ul]:mb-4 [&_.ProseMirror_ol]:mb-4 [&_.ProseMirror_li]:mb-2 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-neutral-300 [&_.ProseMirror_blockquote]:dark:border-neutral-600 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-neutral-600 [&_.ProseMirror_blockquote]:dark:text-neutral-400 [&_.ProseMirror_code]:bg-neutral-100 [&_.ProseMirror_code]:dark:bg-neutral-800 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_pre]:bg-neutral-100 [&_.ProseMirror_pre]:dark:bg-neutral-800 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:mb-4 [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:dark:text-blue-400 [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:hover:text-blue-800 [&_.ProseMirror_a]:dark:hover:text-blue-300 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:mb-4 [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:mb-4 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-neutral-300 [&_.ProseMirror_th]:dark:border-neutral-600 [&_.ProseMirror_th]:px-4 [&_.ProseMirror_th]:py-2 [&_.ProseMirror_th]:bg-neutral-50 [&_.ProseMirror_th]:dark:bg-neutral-800 [&_.ProseMirror_th]:font-semibold [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-neutral-300 [&_.ProseMirror_td]:dark:border-neutral-600 [&_.ProseMirror_td]:px-4 [&_.ProseMirror_td]:py-2"
          />
        </div>
      </div>

    </div>
  );
}