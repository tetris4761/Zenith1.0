import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Save, 
  Plus, 
  Folder, 
  FileText, 
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Documents() {
  const [documents, setDocuments] = useState([
    { id: 1, title: 'Biology Notes - Chapter 1', updatedAt: '2024-04-18', folder: 'Biology' },
    { id: 2, title: 'Math Homework - Calculus', updatedAt: '2024-04-17', folder: 'Mathematics' },
    { id: 3, title: 'Literature Essay Outline', updatedAt: '2024-04-16', folder: 'English' },
  ]);
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [showNewDocument, setShowNewDocument] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your notes...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  const handleNewDocument = () => {
    setShowNewDocument(true);
    setSelectedDocument(null);
    if (editor) {
      editor.commands.setContent('<p>Start writing your notes...</p>');
    }
  };

  const handleSaveDocument = () => {
    if (editor) {
      const content = editor.getHTML();
      console.log('Saving document:', content);
      // TODO: Implement save functionality
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.folder.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocument(doc.id)}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-colors duration-200',
                  selectedDocument === doc.id
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
                      <Folder className="w-3 h-3" />
                      <span>{doc.folder}</span>
                      <span>•</span>
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-neutral-100 rounded">
                    <MoreVertical className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Editor Toolbar */}
        <div className="border-b border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={cn(
                  'p-2 rounded hover:bg-neutral-100',
                  editor?.isActive('bold') ? 'bg-neutral-100' : ''
                )}
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={cn(
                  'p-2 rounded hover:bg-neutral-100',
                  editor?.isActive('italic') ? 'bg-neutral-100' : ''
                )}
              >
                <em>I</em>
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                  'p-2 rounded hover:bg-neutral-100',
                  editor?.isActive('heading', { level: 2 }) ? 'bg-neutral-100' : ''
                )}
              >
                H2
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={cn(
                  'p-2 rounded hover:bg-neutral-100',
                  editor?.isActive('bulletList') ? 'bg-neutral-100' : ''
                )}
              >
                •
              </button>
            </div>
            
            <button
              onClick={handleSaveDocument}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
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
