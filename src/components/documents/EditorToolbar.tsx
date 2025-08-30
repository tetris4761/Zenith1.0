import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code2,
  ChevronDown
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  onInsertLink: () => void;
  onInsertImage: () => void;
}

export default function EditorToolbar({ editor, onInsertLink, onInsertImage }: EditorToolbarProps) {
  const [showTableMenu, setShowTableMenu] = useState(false);

  if (!editor) return null;

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    setShowTableMenu(false);
  };

  const addRow = () => {
    editor.chain().focus().addRowAfter().run();
    setShowTableMenu(false);
  };

  const addColumn = () => {
    editor.chain().focus().addColumnAfter().run();
    setShowTableMenu(false);
  };

  const deleteRow = () => {
    editor.chain().focus().deleteRow().run();
    setShowTableMenu(false);
  };

  const deleteColumn = () => {
    editor.chain().focus().deleteColumn().run();
    setShowTableMenu(false);
  };

  const deleteTable = () => {
    editor.chain().focus().deleteTable().run();
    setShowTableMenu(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-50 rounded-lg">
      {/* Text Formatting */}
      <div className="flex items-center space-x-1 border-r border-neutral-300 pr-3">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('bold') ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('italic') ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('underline') ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('strike') ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('code') ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center space-x-1 border-r border-neutral-300 pr-3">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('heading', { level: 1 }) ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('heading', { level: 2 }) ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('heading', { level: 3 }) ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center space-x-1 border-r border-neutral-300 pr-3">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('bulletList') ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('orderedList') ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Text Alignment */}
      <div className="flex items-center space-x-1 border-r border-neutral-300 pr-3">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive({ textAlign: 'left' }) ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive({ textAlign: 'center' }) ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive({ textAlign: 'right' }) ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive({ textAlign: 'justify' }) ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      {/* Block Elements */}
      <div className="flex items-center space-x-1 border-r border-neutral-300 pr-3">
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('blockquote') ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            'p-2 rounded hover:bg-neutral-200 transition-colors',
            editor.isActive('codeBlock') ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'text-neutral-600'
          )}
          title="Code Block"
        >
          <Code2 className="w-4 h-4" />
        </button>
      </div>

      {/* Table Controls */}
      <div className="flex items-center space-x-1 border-r border-neutral-300 pr-3">
        <div className="relative">
          <button
            onClick={() => setShowTableMenu(!showTableMenu)}
            className="p-2 rounded hover:bg-neutral-200 transition-colors text-neutral-600 flex items-center space-x-1"
            title="Table"
          >
            <TableIcon className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showTableMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 min-w-[200px]">
              <div className="p-2">
                <button
                  onClick={insertTable}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
                >
                  <TableIcon className="w-4 h-4" />
                  <span>Insert Table</span>
                </button>
                <button
                  onClick={addRow}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
                >
                  <span>+ Row</span>
                </button>
                <button
                  onClick={addColumn}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
                >
                  <span>+ Column</span>
                </button>
                <button
                  onClick={deleteRow}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
                >
                  <span>- Row</span>
                </button>
                <button
                  onClick={deleteColumn}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2"
                >
                  <span>- Column</span>
                </button>
                <button
                  onClick={deleteTable}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded flex items-center space-x-2 text-red-600"
                >
                  <span>Delete Table</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media & Links */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onInsertImage}
          className="p-2 rounded hover:bg-neutral-200 transition-colors text-neutral-600"
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onInsertLink}
          className="p-2 rounded hover:bg-neutral-200 transition-colors text-neutral-600"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
