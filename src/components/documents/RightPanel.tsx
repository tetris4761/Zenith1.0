import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Bot, 
  BookOpen, 
  CheckSquare, 
  FileText,
  Send,
  Loader2,
  Plus,
  Copy,
  Check,
  X,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { chatWithAI, AI_MODELS, generateFlashcard as generateFlashcardAI } from '../../lib/ai';
import { createFlashcard } from '../../lib/flashcards';
import { createTask } from '../../lib/tasks';
import { getDecks, createDeck } from '../../lib/decks';

interface RightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  documentContent?: string;
  children?: React.ReactNode;
  // Flashcard mode props
  flashcardMode?: boolean;
  flashcardStep?: 'front' | 'back' | 'complete';
  pendingFront?: string;
  pendingBack?: string;
  selectedText?: string;
  onToggleFlashcardMode?: () => void;
  onResetFlashcardMode?: () => void;
  onSetFlashcardStep?: (step: 'front' | 'back' | 'complete') => void;
  onSetPendingFront?: (front: string) => void;
  onSetPendingBack?: (back: string) => void;
  onClearSelectedText?: () => void;
}

export default function RightPanel({
  isOpen,
  onToggle,
  documentContent,
  children,
  flashcardMode = false,
  flashcardStep = 'front',
  pendingFront = '',
  pendingBack = '',
  selectedText = '',
  onToggleFlashcardMode,
  onResetFlashcardMode,
  onSetFlashcardStep,
  onSetPendingFront,
  onSetPendingBack,
  onClearSelectedText
}: RightPanelProps) {
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'flashcards' | 'tasks' | 'outline' | 'flashcard-mode'>('ai');

  // AI State
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Flashcard State
  const [flashcardFront, setFlashcardFront] = useState('');
  const [flashcardBack, setFlashcardBack] = useState('');
  const [selectedDeck, setSelectedDeck] = useState('');
  const [decks, setDecks] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

  // Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  const minWidth = 200;
  const maxWidth = 600;


  // Load decks when flashcards tab or flashcard mode tab is active
  useEffect(() => {
    if (activeTab === 'flashcards' || activeTab === 'flashcard-mode') {
      loadDecks();
    }
  }, [activeTab]);

  // Auto-switch to flashcard mode tab when flashcard mode is enabled
  useEffect(() => {
    if (flashcardMode && activeTab !== 'flashcard-mode') {
      setActiveTab('flashcard-mode');
    }
  }, [flashcardMode, activeTab]);

  const loadDecks = async () => {
    try {
      const { data } = await getDecks();
      setDecks(data || []);
      if (data && data.length > 0) {
        setSelectedDeck(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load decks:', err);
    }
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;

    setIsCreatingDeck(true);
    setError(null);
    try {
      console.log('🎯 Creating deck:', newDeckName.trim());
      const { data, error } = await createDeck({
        name: newDeckName.trim(),
        description: 'Created from document flashcard mode'
      });

      if (error) {
        console.error('❌ Failed to create deck:', error);
        setError(`Failed to create deck: ${error}`);
        return;
      }

      if (data) {
        console.log('✅ Deck created successfully:', data);
        // Reload decks and select the new one
        await loadDecks();
        setSelectedDeck(data.id);
        setNewDeckName('');
        setShowCreateDeck(false);
      }
    } catch (err) {
      console.error('❌ Failed to create deck:', err);
      setError(`Failed to create deck: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCreatingDeck(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    let animationFrame: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      animationFrame = requestAnimationFrame(() => {
        const newWidth = window.innerWidth - e.clientX;
        const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
        setWidth(clampedWidth);
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // AI Functions
  const handleAIChat = async () => {
    if (!aiMessage.trim()) return;

    setLoading(true);
    setError(null);
    setAiResponse('');

    try {
      // Create the message with selected text directly included
      let finalMessage = aiMessage;

      if (selectedText && selectedText.trim()) {
        finalMessage = `Regarding this text: "${selectedText}"\n\nQuestion: ${aiMessage}`;
      }

      console.log('Final Message to AI:', finalMessage);

      const result = await chatWithAI({
        message: finalMessage,
        context: selectedText ? selectedText : (documentContent ? documentContent.substring(0, 500) : ''),
        model: AI_MODELS['gpt-3.5-turbo']
      });
      
      console.log('AI Response:', result.response); // Debug log
      
      setAiResponse(result.response);
      setAiMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(aiResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Flashcard Functions
  const handleCreateFlashcard = async () => {
    if (!flashcardFront.trim() || !flashcardBack.trim() || !selectedDeck) return;

    try {
      await createFlashcard({
        front: flashcardFront,
        back: flashcardBack,
        deck_id: selectedDeck
      });
      
      setFlashcardFront('');
      setFlashcardBack('');
    } catch (err) {
      console.error('Failed to create flashcard:', err);
    }
  };

  // Confirm selection with Enter key
  const confirmSelection = () => {
    if (!selectedText.trim()) return;
    
    const trimmedText = selectedText.trim();
    console.log('🔍 Confirming selection:', { text: trimmedText, step: flashcardStep });

    if (flashcardStep === 'front') {
      onSetPendingFront?.(trimmedText);
      onSetFlashcardStep?.('back');
      console.log('✅ Set front, moving to back step');
    } else if (flashcardStep === 'back') {
      onSetPendingBack?.(trimmedText);
      onSetFlashcardStep?.('complete');
      setShowPreview(true);
      console.log('✅ Set back, moving to complete step');
    }
    
    // Clear selected text after confirmation
    onClearSelectedText?.();
  };

  // AI optimization for flashcard content
  const optimizeFlashcard = async () => {
    if (!pendingFront || !pendingBack) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      console.log('🤖 Starting AI optimization with:', { front: pendingFront, back: pendingBack });
      
      const result = await generateFlashcardAI({
        text: `Front: "${pendingFront}"\nBack: "${pendingBack}"`,
        model: 'openai/gpt-4o-mini'
      });
      
      console.log('🤖 AI optimization result:', result);
      
      setFlashcardFront(result.front);
      setFlashcardBack(result.back);
      
      // Show success feedback
      console.log('✨ AI optimization completed successfully');
    } catch (error) {
      console.error('❌ Error optimizing flashcard:', error);
      setError(`AI optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using original text.`);
      // Use original selections if AI fails
      setFlashcardFront(pendingFront);
      setFlashcardBack(pendingBack);
    } finally {
      setIsGenerating(false);
    }
  };

  // Skip AI optimization
  const skipOptimization = () => {
    setFlashcardFront(pendingFront);
    setFlashcardBack(pendingBack);
    setShowPreview(false);
  };

  // Save flashcard to database
  const saveFlashcard = async () => {
    const front = flashcardFront || pendingFront;
    const back = flashcardBack || pendingBack;
    
    if (!front.trim() || !back.trim() || !selectedDeck) return;

    setError(null);
    try {
      console.log('💾 Saving flashcard:', { front, back, deck: selectedDeck });
      
      await createFlashcard({
        front: front,
        back: back,
        deck_id: selectedDeck
      });
      
      console.log('✅ Flashcard saved successfully!');
      
      // Show success feedback briefly
      const successMessage = `Flashcard saved to deck!`;
      console.log('🎉', successMessage);
      
      // Reset everything
      setFlashcardFront('');
      setFlashcardBack('');
      setShowPreview(false);
      onResetFlashcardMode?.();
    } catch (err) {
      console.error('❌ Failed to save flashcard:', err);
      setError(`Failed to save flashcard: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Task Functions
  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;

    try {
      await createTask({
        title: taskTitle,
        description: taskDescription,
        task_type: 'quick_task',
        priority: taskPriority,
        estimated_duration: 30,
        tags: ['document-related']
      });
      
      setTaskTitle('');
      setTaskDescription('');
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const tabs = [
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'outline', label: 'Outline', icon: FileText },
    { id: 'flashcard-mode', label: 'Flashcard Mode', icon: BookOpen },
  ] as const;

  const getStepMessage = () => {
    switch (flashcardStep) {
      case 'front':
        return 'Select text for the front (question) of your flashcard';
      case 'back':
        return 'Now select text for the back (answer) of your flashcard';
      case 'complete':
        return 'Ready for AI optimization';
      default:
        return 'Create Flashcard';
    }
  };

  const getStepColor = () => {
    switch (flashcardStep) {
      case 'front':
        return 'text-blue-600';
      case 'back':
        return 'text-green-600';
      case 'complete':
        return 'text-purple-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <>
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "absolute right-0 top-0 h-full bg-white dark:bg-neutral-800 border-l border-neutral-200 dark:border-neutral-700 transition-all duration-200 ease-out shadow-lg",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          width: isOpen ? `${width}px` : '0px',
          minWidth: isOpen ? `${minWidth}px` : '0px'
        }}
      >
        {/* Resize Handle */}
        {isOpen && (
          <div
            className="absolute left-0 top-0 h-full w-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize z-10 transition-colors duration-150"
            onMouseDown={handleMouseDown}
          />
        )}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      activeTab === tab.id
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    )}
                    title={tab.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={onToggle}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'ai' && (
              <div className="p-4 h-full flex flex-col">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                  AI Assistant
                </h3>
                
                {/* Selected Text Indicator */}
                {selectedText && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-xs text-blue-600 dark:text-blue-400">Selected text:</div>
                      <button
                        onClick={() => onClearSelectedText?.()}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="text-sm text-blue-900 dark:text-blue-100 line-clamp-2">
                      "{selectedText}"
                    </div>
                  </div>
                )}

                {/* Response */}
                {aiResponse && (
                  <div className="flex-1 mb-4 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg overflow-y-auto">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        AI Response {selectedText && '(based on selected text)'}:
                      </div>
                      <button
                        onClick={handleCopyResponse}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded transition-colors"
                        title="Copy response"
                      >
                        {copied ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-neutral-500" />
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                      {aiResponse}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="mb-4 flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
                      AI is thinking...
                    </span>
                  </div>
                )}

                {/* Chat Input */}
                <div className="mt-auto">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !loading && handleAIChat()}
                      placeholder={selectedText ? `Ask about: "${selectedText.substring(0, 30)}..."` : "Ask about this document..."}
                      className="flex-1 text-sm px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <button
                      onClick={handleAIChat}
                      disabled={loading || !aiMessage.trim()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    💡 Select text in the document to ask specific questions about it
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'flashcard-mode' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Flashcard Mode
                  </h3>
                  {flashcardMode ? (
                    <button
                      onClick={onResetFlashcardMode}
                      className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-neutral-500" />
                    </button>
                  ) : (
                    <button
                      onClick={onToggleFlashcardMode}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      Enable
                    </button>
                  )}
                </div>

                {!flashcardMode && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      Enable Flashcard Mode
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      Create flashcards by selecting text in your document
                    </p>
                    <button
                      onClick={onToggleFlashcardMode}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Start Creating Flashcards
                    </button>
                  </div>
                )}

                {flashcardMode && (
                  <>
                    {/* Step Message */}
                    <div className={`text-sm font-medium mb-3 ${getStepColor()}`}>
                      {getStepMessage()}
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center space-x-2 mb-4">
                      <div className={`flex-1 h-2 rounded ${flashcardStep === 'front' ? 'bg-blue-200 dark:bg-blue-800' : 'bg-blue-600'}`} />
                      <ArrowRight className="w-3 h-3 text-neutral-400" />
                      <div className={`flex-1 h-2 rounded ${flashcardStep === 'back' ? 'bg-green-200 dark:bg-green-800' : flashcardStep === 'complete' ? 'bg-green-600' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
                      <ArrowRight className="w-3 h-3 text-neutral-400" />
                      <div className={`flex-1 h-2 rounded ${flashcardStep === 'complete' ? 'bg-purple-600' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
                    </div>

                    {/* Selected Text */}
                    {selectedText && (
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg border mb-3">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Selected text:</div>
                        <div className="text-sm text-neutral-900 dark:text-neutral-100 mb-2">
                          "{selectedText}"
                        </div>
                        <button
                          onClick={confirmSelection}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors font-medium"
                        >
                          Press Enter to confirm
                        </button>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-4">
                        <div className="text-sm text-red-700 dark:text-red-300">
                          {error}
                        </div>
                      </div>
                    )}

                    {/* Status Message */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                      <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Flashcard Mode Active</div>
                      <div className="text-sm text-blue-900 dark:text-blue-100">
                        {flashcardStep === 'front' && 'Select text for front, then press Enter'}
                        {flashcardStep === 'back' && 'Select text for back, then press Enter'}
                        {flashcardStep === 'complete' && 'Ready for AI optimization'}
                      </div>
                    </div>

                    {/* Show different content based on step */}
                    {flashcardStep === 'front' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Front (Question)</div>
                          <div className="text-sm text-blue-900 dark:text-blue-100">
                            {pendingFront || 'Select text for the front...'}
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                          Next: Select text for the back (answer)
                        </div>
                      </div>
                    )}

                    {flashcardStep === 'back' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Front (Question)</div>
                          <div className="text-sm text-blue-900 dark:text-blue-100">
                            {pendingFront}
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-xs text-green-600 dark:text-green-400 mb-1">Back (Answer)</div>
                          <div className="text-sm text-green-900 dark:text-green-100">
                            {pendingBack || 'Select text for the back...'}
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                          {pendingBack ? 'Ready for AI optimization!' : 'Select text for the back (answer)'}
                        </div>
                      </div>
                    )}

                    {/* Preview and Save Section */}
                    {flashcardStep === 'complete' && (
                      <div className="space-y-4">
                        {/* Deck Selection */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Save to Deck
                            </label>
                            <button
                              onClick={() => setShowCreateDeck(true)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                            >
                              + Create New
                            </button>
                          </div>
                          
                          {showCreateDeck ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                                placeholder="Deck name..."
                                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                                autoFocus
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleCreateDeck}
                                  disabled={!newDeckName.trim() || isCreatingDeck}
                                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                                >
                                  {isCreatingDeck ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Plus className="w-3 h-3" />
                                  )}
                                  <span>{isCreatingDeck ? 'Creating...' : 'Create'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setShowCreateDeck(false);
                                    setNewDeckName('');
                                  }}
                                  className="px-3 py-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <select
                              value={selectedDeck}
                              onChange={(e) => setSelectedDeck(e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            >
                              {decks.length === 0 ? (
                                <option value="">No decks available</option>
                              ) : (
                                decks.map((deck) => (
                                  <option key={deck.id} value={deck.id}>
                                    {deck.name}
                                  </option>
                                ))
                              )}
                            </select>
                          )}
                        </div>

                        {/* AI Optimization Options */}
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            AI Optimization
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                            💡 AI will clean up grammar, formatting, and structure (minimal changes only)
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={skipOptimization}
                              className="flex-1 px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors text-sm"
                            >
                              Skip AI
                            </button>
                            <button
                              onClick={optimizeFlashcard}
                              disabled={isGenerating}
                              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-1 text-sm"
                            >
                              {isGenerating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Bot className="w-3 h-3" />
                              )}
                              <span>{isGenerating ? 'Optimizing...' : 'Clean Up'}</span>
                            </button>
                          </div>
                          {error && error.includes('AI optimization failed') && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                              ⚠️ AI functions not running. Install Docker or deploy functions to enable AI optimization.
                            </div>
                          )}
                        </div>

                        {/* Final Flashcard Preview */}
                        {(flashcardFront || pendingFront) && (flashcardBack || pendingBack) && (
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Final Flashcard
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-xs text-blue-600 dark:text-blue-400">Front</div>
                                <button
                                  onClick={() => {
                                    const newText = prompt('Edit front text:', flashcardFront || pendingFront);
                                    if (newText !== null) {
                                      setFlashcardFront(newText);
                                    }
                                  }}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                              <div className="text-sm text-blue-900 dark:text-blue-100">
                                {flashcardFront || pendingFront}
                              </div>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-xs text-green-600 dark:text-green-400">Back</div>
                                <button
                                  onClick={() => {
                                    const newText = prompt('Edit back text:', flashcardBack || pendingBack);
                                    if (newText !== null) {
                                      setFlashcardBack(newText);
                                    }
                                  }}
                                  className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                              <div className="text-sm text-green-900 dark:text-green-100">
                                {flashcardBack || pendingBack}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Save Button */}
                        <button
                          onClick={saveFlashcard}
                          disabled={!selectedDeck || (!flashcardFront && !pendingFront) || (!flashcardBack && !pendingBack)}
                          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {!selectedDeck ? 'Select or Create Deck' : 'Save Flashcard'}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        <strong>How to use:</strong>
                        <ol className="mt-1 space-y-1 list-decimal list-inside">
                          <li>Select text for the front (question)</li>
                          <li>Press Enter to confirm</li>
                          <li>Select text for the back (answer)</li>
                          <li>Press Enter to confirm</li>
                          <li>Choose to optimize with AI or skip</li>
                          <li>Select a deck and save</li>
                        </ol>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Create Flashcard
                </h3>
                
                {selectedText && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-xs text-green-600 dark:text-green-400 mb-1">Selected text:</div>
                    <div className="text-sm text-green-900 dark:text-green-100 mb-2">
                      "{selectedText}"
                    </div>
                    <button
                      onClick={() => setFlashcardFront(selectedText)}
                      className="text-xs text-green-600 dark:text-green-400 hover:underline"
                    >
                      Use as front
                    </button>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Deck
                  </label>
                  <select
                    value={selectedDeck}
                    onChange={(e) => setSelectedDeck(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Front
                  </label>
                  <input
                    type="text"
                    value={flashcardFront}
                    onChange={(e) => setFlashcardFront(e.target.value)}
                    placeholder="Question or term..."
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Back
                  </label>
                  <textarea
                    value={flashcardBack}
                    onChange={(e) => setFlashcardBack(e.target.value)}
                    placeholder="Answer or definition..."
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                  />
                </div>

                <button
                  onClick={handleCreateFlashcard}
                  disabled={!flashcardFront.trim() || !flashcardBack.trim() || !selectedDeck}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Flashcard</span>
                </button>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Create Task
                </h3>
                
                {selectedText && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-xs text-green-600 dark:text-green-400 mb-1">Selected text:</div>
                    <div className="text-sm text-green-900 dark:text-green-100 mb-2">
                      "{selectedText}"
                    </div>
                    <button
                      onClick={() => setTaskTitle(`Study: ${selectedText.substring(0, 50)}...`)}
                      className="text-xs text-green-600 dark:text-green-400 hover:underline"
                    >
                      Use as title
                    </button>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Task title..."
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Task description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateTask}
                  disabled={!taskTitle.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Create Task</span>
                </button>
              </div>
            )}

            {activeTab === 'outline' && (
              <div className="p-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                  Document Outline
                </h3>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Outline generation will be implemented here. This will include:
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Auto-generated headings from document</li>
                    <li>Quick navigation to sections</li>
                    <li>Reading progress tracking</li>
                    <li>Section jumping</li>
                  </ul>
                </div>
              </div>
            )}

            {children}
          </div>
        </div>
      </div>

      {/* Toggle Button (when closed) */}
      {!isOpen && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={onToggle}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-l-lg p-2 shadow-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      )}
    </>
  );
}