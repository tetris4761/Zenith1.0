import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, RefreshCw, Folder, Edit3, Trash2, FileText, X, Clock, Star } from 'lucide-react';
import { getFlashcardFolders, createFlashcardFolder } from '../lib/flashcard-folders';
import { createDeck, updateDeck, deleteDeck } from '../lib/decks';
import { createFlashcard, updateFlashcard, deleteFlashcard, getFlashcards } from '../lib/flashcards';
import type { FlashcardFolderWithChildren } from '../lib/flashcard-folders';
import type { Deck, Flashcard } from '../types';

export default function Flashcards() {
  const [folders, setFolders] = useState<FlashcardFolderWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showCreateDeckDialog, setShowCreateDeckDialog] = useState(false);
  const [showCreateFlashcardDialog, setShowCreateFlashcardDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [newFlashcardFront, setNewFlashcardFront] = useState('');
  const [newFlashcardBack, setNewFlashcardBack] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [deckDialogMode, setDeckDialogMode] = useState<'create' | 'edit'>('create');
  const [flashcardDialogMode, setFlashcardDialogMode] = useState<'create' | 'edit'>('create');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);

  // Review functionality
  const [showReviewMode, setShowReviewMode] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewFlashcards, setReviewFlashcards] = useState<Flashcard[]>([]);
  const [reviewResults, setReviewResults] = useState<{ [key: string]: 'easy' | 'medium' | 'hard' }>({});

  useEffect(() => {
    console.log('Flashcards component mounted, loading folders...');
    loadFolders();
  }, []);

  // Load flashcards when deck selection changes
  useEffect(() => {
    if (selectedDeckId) {
      console.log('Selected deck changed, loading flashcards for:', selectedDeckId);
      loadFlashcards(selectedDeckId);
    } else {
      setFlashcards([]);
    }
  }, [selectedDeckId]);

  // Load flashcards for review when entering review mode
  useEffect(() => {
    if (showReviewMode && selectedDeckId) {
      loadFlashcards(selectedDeckId);
      setReviewFlashcards(flashcards);
      setCurrentReviewIndex(0);
      setShowAnswer(false);
      setReviewResults({});
    }
  }, [showReviewMode, selectedDeckId]);

  const loadFolders = async () => {
    try {
      console.log('Loading folders...');
      setLoading(true);
      setError(null);
      
      const { data, error } = await getFlashcardFolders();
      
      if (error) {
        console.error('Error loading folders:', error);
        setError(error);
        setFolders([]);
        return;
      }

      console.log('Folders loaded successfully:', data);
      if (data) {
        setFolders(data);
        // Select first folder if none selected
        if (!selectedFolderId && data.length > 0) {
          setSelectedFolderId(data[0].id);
        }
      } else {
        setFolders([]);
      }
    } catch (err) {
      console.error('Exception loading folders:', err);
      setError('Failed to load folders');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFlashcards = async (deckId: string) => {
    try {
      console.log('Loading flashcards for deck:', deckId);
      setFlashcardsLoading(true);
      const { data, error } = await getFlashcards(deckId);
      
      if (error) {
        console.error('Error loading flashcards:', error);
        setError(error);
        return;
      }

      console.log('Flashcards loaded successfully:', data);
      if (data) {
        setFlashcards(data);
      } else {
        setFlashcards([]);
      }
    } catch (err) {
      console.error('Exception loading flashcards:', err);
      setError('Failed to load flashcards');
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      console.log('Creating folder:', newFolderName);
      const { error } = await createFlashcardFolder({ name: newFolderName.trim() });
      
      if (error) {
        console.error('Error creating folder:', error);
        setError(error);
        return;
      }

      console.log('Folder created successfully');
      setNewFolderName('');
      setShowCreateFolderDialog(false);
      await loadFolders();
      setError(null);
    } catch (err) {
      console.error('Exception creating folder:', err);
      setError('Failed to create folder');
    }
  };

  const handleCreateDeck = (folderId?: string) => {
    setSelectedFolderId(folderId || selectedFolderId);
    setNewDeckName('');
    setNewDeckDescription('');
    setEditingDeck(null);
    setDeckDialogMode('create');
    setShowCreateDeckDialog(true);
  };

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setNewDeckName(deck.name);
    setNewDeckDescription(deck.description || '');
    setDeckDialogMode('edit');
    setShowCreateDeckDialog(true);
  };

  const handleDeckSubmit = async () => {
    if (!newDeckName.trim()) return;
    
    try {
      if (deckDialogMode === 'create') {
        console.log('Creating deck:', newDeckName, 'in folder:', selectedFolderId);
        const { error } = await createDeck({
          name: newDeckName.trim(),
          description: newDeckDescription.trim(),
          folder_id: selectedFolderId || undefined
        });
        
        if (error) {
          console.error('Error creating deck:', error);
          setError(error);
          return;
        }
      } else if (editingDeck) {
        console.log('Updating deck:', editingDeck.id);
        const { error } = await updateDeck(editingDeck.id, {
          name: newDeckName.trim(),
          description: newDeckDescription.trim()
        });
        
        if (error) {
          console.error('Error updating deck:', error);
          setError(error);
          return;
        }
      }

      console.log('Deck saved successfully');
      setNewDeckName('');
      setNewDeckDescription('');
      setEditingDeck(null);
      setShowCreateDeckDialog(false);
      await loadFolders();
      setError(null);
    } catch (err) {
      console.error('Exception saving deck:', err);
      setError('Failed to save deck');
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck? This will also delete all flashcards in it.')) {
      return;
    }
    
    try {
      console.log('Deleting deck:', deckId);
      const { error } = await deleteDeck(deckId);
      
      if (error) {
        console.error('Error deleting deck:', error);
        setError(error);
        return;
      }

      console.log('Deck deleted successfully');
      if (selectedDeckId === deckId) {
        setSelectedDeckId(null);
        setFlashcards([]);
      }
      await loadFolders();
      setError(null);
    } catch (err) {
      console.error('Exception deleting deck:', err);
      setError('Failed to delete deck');
    }
  };

  const handleCreateFlashcard = (deckId?: string) => {
    setSelectedDeckId(deckId || selectedDeckId);
    setNewFlashcardFront('');
    setNewFlashcardBack('');
    setEditingFlashcard(null);
    setFlashcardDialogMode('create');
    setShowCreateFlashcardDialog(true);
  };

  const handleEditFlashcard = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard);
    setNewFlashcardFront(flashcard.front);
    setNewFlashcardBack(flashcard.back);
    setFlashcardDialogMode('edit');
    setShowCreateFlashcardDialog(true);
  };

  const handleFlashcardSubmit = async () => {
    if (!newFlashcardFront.trim() || !newFlashcardBack.trim()) return;
    
    try {
      if (flashcardDialogMode === 'create') {
        console.log('Creating flashcard in deck:', selectedDeckId);
        const { error } = await createFlashcard({
          front: newFlashcardFront.trim(),
          back: newFlashcardBack.trim(),
          deck_id: selectedDeckId || undefined,
        });
        
        if (error) {
          console.error('Error creating flashcard:', error);
          setError(error);
          return;
        }
      } else if (editingFlashcard) {
        console.log('Updating flashcard:', editingFlashcard.id);
        const { error } = await updateFlashcard(editingFlashcard.id, {
          front: newFlashcardFront.trim(),
          back: newFlashcardBack.trim()
        });
        
        if (error) {
          console.error('Error updating flashcard:', error);
          setError(error);
          return;
        }
      }

      console.log('Flashcard saved successfully');
      setNewFlashcardFront('');
      setNewFlashcardBack('');
      setEditingFlashcard(null);
      setShowCreateFlashcardDialog(false);
      
      // Refresh both flashcards and folders (to update counts)
      if (selectedDeckId) {
        await loadFlashcards(selectedDeckId);
      }
      await loadFolders();
      setError(null);
    } catch (err) {
      console.error('Exception saving flashcard:', err);
      setError('Failed to save flashcard');
    }
  };

  const handleDeleteFlashcard = async (flashcardId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) {
      return;
    }
    
    try {
      console.log('Deleting flashcard:', flashcardId);
      const { error } = await deleteFlashcard(flashcardId);
      
      if (error) {
        console.error('Error deleting flashcard:', error);
        setError(error);
        return;
      }

      console.log('Flashcard deleted successfully');
      
      // Refresh both flashcards and folders (to update counts)
      if (selectedDeckId) {
        await loadFlashcards(selectedDeckId);
      }
      await loadFolders();
      setError(null);
    } catch (err) {
      console.error('Exception deleting flashcard:', err);
      setError('Failed to delete flashcard');
    }
  };

  // Review functionality
  const startReview = () => {
    if (!selectedDeckId || flashcards.length === 0) {
      alert('Please select a deck with flashcards to review');
      return;
    }
    setShowReviewMode(true);
    setReviewFlashcards(flashcards);
    setCurrentReviewIndex(0);
    setShowAnswer(false);
    setReviewResults({});
  };

  const endReview = () => {
    setShowReviewMode(false);
    setCurrentReviewIndex(0);
    setShowAnswer(false);
    setReviewResults({});
  };

  const nextCard = () => {
    if (currentReviewIndex < reviewFlashcards.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
      setShowAnswer(false);
    } else {
      // Review complete
      endReview();
    }
  };

  const previousCard = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(currentReviewIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleReviewResponse = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const currentCard = reviewFlashcards[currentReviewIndex];
    if (!currentCard) return;

    // Update review results
    setReviewResults(prev => ({
      ...prev,
      [currentCard.id]: difficulty
    }));

    // TODO: Update spaced repetition data in database
    // This would update the next_review date based on difficulty

    // Move to next card
    nextCard();
  };

  const selectedFolder = selectedFolderId 
    ? folders.find(f => f.id === selectedFolderId) 
    : null;
  const selectedDeck = selectedDeckId 
    ? selectedFolder?.decks.find(d => d.id === selectedDeckId)
    : null;

  const currentReviewCard = reviewFlashcards[currentReviewIndex];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-neutral-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Something went wrong</h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadFolders();
            }}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-neutral-50">
      {/* Left Sidebar - Folder Tree */}
      <div className="w-80 bg-white border-r border-neutral-200">
        <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Flashcard Folders</span>
            </h3>
            <div className="flex space-x-1">
              <button
                onClick={() => setShowCreateFolderDialog(true)}
                className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 hover:text-blue-700 transition-colors"
                title="New Folder"
              >
                <Folder className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCreateDeck()}
                className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 hover:text-blue-700 transition-colors"
                title="New Deck"
                disabled={!selectedFolderId}
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-neutral-600">
            <div className="flex items-center space-x-1">
              <Folder className="w-3 h-3" />
              <span>{folders.length} folders</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpen className="w-3 h-3" />
              <span>{folders.reduce((total, f) => total + f.deck_count, 0)} decks</span>
            </div>
          </div>
        </div>

        {/* Folder List */}
        <div className="p-3">
          {folders.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">No folders yet</p>
              <button
                onClick={() => setShowCreateFolderDialog(true)}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
              >
                + Create First Folder
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => (
                <div key={folder.id}>
                  {/* Folder Item */}
                  <div
                    className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFolderId === folder.id 
                        ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                        : 'hover:bg-neutral-50'
                    }`}
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <Folder className="w-4 h-4 text-blue-500 mr-3" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{folder.name}</span>
                      {folder.deck_count > 0 && (
                        <span className="text-xs text-neutral-400 ml-2">
                          {folder.deck_count} deck{folder.deck_count === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateDeck(folder.id);
                      }}
                      className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-600"
                      title="Create deck in this folder"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Decks in this folder */}
                  {selectedFolderId === folder.id && folder.decks.length > 0 && (
                    <div className="ml-6 mt-2 space-y-1">
                      {folder.decks.map((deck) => (
                        <div
                          key={deck.id}
                          className={`flex items-center py-2 px-3 rounded-lg hover:bg-neutral-50 group cursor-pointer ${
                            selectedDeckId === deck.id ? 'bg-green-50 text-green-700 border border-green-200' : ''
                          }`}
                          onClick={() => setSelectedDeckId(deck.id)}
                        >
                          <BookOpen className="w-3 h-3 text-green-500 mr-3" />
                          <div className="flex-1">
                            <span className="text-sm">{deck.name}</span>
                            {deck.flashcard_count > 0 && (
                              <span className="text-xs text-neutral-400 ml-2">
                                {deck.flashcard_count} card{deck.flashcard_count === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateFlashcard(deck.id);
                              }}
                              className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-600"
                              title="Create flashcard in this deck"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDeck(deck);
                              }}
                              className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-600"
                              title="Edit deck"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDeck(deck.id);
                              }}
                              className="p-1 hover:bg-red-50 rounded text-neutral-400 hover:text-red-600"
                              title="Delete deck"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {selectedFolder ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                  {selectedFolder.name}
                </h2>
                <p className="text-neutral-600">
                  {selectedFolder.deck_count > 0 
                    ? `${selectedFolder.deck_count} deck${selectedFolder.deck_count === 1 ? '' : 's'} in this folder`
                    : 'No decks in this folder yet'
                  }
                </p>
              </div>

              {selectedFolder.deck_count === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No decks yet</h3>
                  <p className="text-neutral-500 mb-4">
                    Create your first deck to start adding flashcards
                  </p>
                  <button
                    onClick={() => handleCreateDeck(selectedFolder.id)}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Deck
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedFolder.decks.map((deck) => (
                    <div
                      key={deck.id}
                      className={`bg-white p-4 rounded-lg border transition-colors cursor-pointer ${
                        selectedDeckId === deck.id 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                      onClick={() => setSelectedDeckId(deck.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <BookOpen className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateFlashcard(deck.id);
                            }}
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600"
                            title="Create flashcard"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDeck(deck);
                            }}
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDeck(deck.id);
                            }}
                            className="p-1 hover:bg-red-50 rounded text-neutral-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-medium text-neutral-900 mb-1">{deck.name}</h4>
                      {deck.description && (
                        <p className="text-sm text-neutral-600 mb-3">{deck.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{deck.flashcard_count} card{deck.flashcard_count === 1 ? '' : 's'}</span>
                        <span>Created {new Date(deck.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Deck Content */}
              {selectedDeck && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                        {selectedDeck.name}
                      </h3>
                      {selectedDeck.description && (
                        <p className="text-neutral-600">{selectedDeck.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCreateFlashcard(selectedDeck.id)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Flashcard</span>
                    </button>
                  </div>

                  {flashcardsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                      <p className="text-neutral-600">Loading flashcards...</p>
                    </div>
                  ) : flashcards.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-neutral-900 mb-2">No flashcards yet</h4>
                      <p className="text-neutral-500 mb-4">
                        Create your first flashcard to start studying
                      </p>
                      <button
                        onClick={() => handleCreateFlashcard(selectedDeck.id)}
                        className="btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Flashcard
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flashcards.map((flashcard) => (
                        <div
                          key={flashcard.id}
                          className="bg-white p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditFlashcard(flashcard)}
                                className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600"
                                title="Edit flashcard"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteFlashcard(flashcard.id)}
                                className="p-1 hover:bg-red-50 rounded text-neutral-400 hover:text-red-600"
                                title="Delete flashcard"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Front</label>
                              <p className="text-sm text-neutral-900 mt-1">{flashcard.front}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Back</label>
                              <p className="text-sm text-neutral-900 mt-1">{flashcard.back}</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                            <span>Created {new Date(flashcard.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Flashcard System</h2>
              <p className="text-neutral-600 mb-6">
                {folders.length > 0 
                  ? 'Select a folder to view its decks'
                  : 'Create your first folder to get started.'
                }
              </p>
              
              {folders.length === 0 && (
                <button
                  onClick={() => setShowCreateFolderDialog(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Folder
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Button */}
      <button
        onClick={startReview}
        disabled={!selectedDeckId || flashcards.length === 0}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-200 flex items-center space-x-2 ${
          !selectedDeckId || flashcards.length === 0
            ? 'bg-neutral-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 text-white hover:scale-105'
        }`}
        title={!selectedDeckId || flashcards.length === 0 
          ? 'Select a deck with flashcards to review' 
          : 'Start Review Session'
        }
      >
        <RefreshCw className="w-5 h-5" />
        <span className="hidden sm:inline">Review</span>
      </button>

      {/* Review Mode Overlay */}
      {showReviewMode && currentReviewCard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            {/* Review Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-semibold">Review Session</h3>
                  <p className="text-primary-100 text-sm">
                    {selectedDeck?.name} • Card {currentReviewIndex + 1} of {reviewFlashcards.length}
                  </p>
                </div>
              </div>
              <button
                onClick={endReview}
                className="p-2 hover:bg-primary-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="bg-neutral-100 h-2">
              <div 
                className="bg-primary-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${((currentReviewIndex + 1) / reviewFlashcards.length) * 100}%` }}
              />
            </div>

            {/* Flashcard Content */}
            <div className="p-8">
              {/* Question (Front) */}
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Question</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs text-neutral-500">Take your time</span>
                  </div>
                </div>
                <div className="bg-neutral-50 p-6 rounded-lg border-2 border-neutral-200 min-h-[120px] flex items-center">
                  <p className="text-lg text-neutral-900 leading-relaxed">{currentReviewCard.front}</p>
                </div>
              </div>

              {/* Answer (Back) - Initially Hidden */}
              {!showAnswer ? (
                <div className="text-center mb-8">
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="btn-primary px-8 py-3 text-lg"
                  >
                    Show Answer
                  </button>
                </div>
              ) : (
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Answer</span>
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200 min-h-[120px] flex items-center">
                    <p className="text-lg text-neutral-900 leading-relaxed">{currentReviewCard.back}</p>
                  </div>
                </div>
              )}

              {/* Difficulty Buttons - Only shown after answer is revealed */}
              {showAnswer && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-neutral-600 mb-4">
                    How well did you know this?
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => handleReviewResponse('hard')}
                      className="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 rounded-lg transition-colors group"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-red-200 transition-colors">
                        <span className="text-red-600 font-bold text-sm">1</span>
                      </div>
                      <span className="text-sm font-medium text-red-700">Hard</span>
                      <span className="text-xs text-red-600">Review soon</span>
                    </button>
                    
                    <button
                      onClick={() => handleReviewResponse('medium')}
                      className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200 hover:border-yellow-300 rounded-lg transition-colors group"
                    >
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-red-200 transition-colors">
                        <span className="text-red-600 font-bold text-sm">2</span>
                      </div>
                      <span className="text-sm font-medium text-yellow-700">Medium</span>
                      <span className="text-xs text-yellow-600">Review later</span>
                    </button>
                    
                    <button
                      onClick={() => handleReviewResponse('easy')}
                      className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 rounded-lg transition-colors group"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                        <span className="text-green-600 font-bold text-sm">3</span>
                      </div>
                      <span className="text-sm font-medium text-green-700">Easy</span>
                      <span className="text-xs text-green-600">Review much later</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Footer */}
            <div className="bg-neutral-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={previousCard}
                disabled={currentReviewIndex === 0}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentReviewIndex === 0
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-600">
                  {currentReviewIndex + 1} of {reviewFlashcards.length}
                </span>
              </div>
              
              <button
                onClick={nextCard}
                disabled={currentReviewIndex === reviewFlashcards.length - 1}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentReviewIndex === reviewFlashcards.length - 1
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Dialog */}
      {showCreateFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center space-x-2 mb-4">
              <Folder className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium">Create New Folder</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Folder Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  className="input w-full"
                  autoFocus
                  maxLength={50}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateFolderDialog(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Deck Dialog */}
      {showCreateDeckDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium">
                {deckDialogMode === 'create' ? 'Create New Deck' : 'Edit Deck'}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Deck Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter deck name..."
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDeckSubmit()}
                  className="input w-full"
                  autoFocus
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Enter deck description..."
                  value={newDeckDescription}
                  onChange={(e) => setNewDeckDescription(e.target.value)}
                  className="input w-full h-20 resize-none"
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateDeckDialog(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeckSubmit}
                disabled={!newDeckName.trim()}
                className="btn-primary disabled:opacity-50"
              >
                {deckDialogMode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Flashcard Dialog */}
      {showCreateFlashcardDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium">
                {flashcardDialogMode === 'create' ? 'Create New Flashcard' : 'Edit Flashcard'}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Question (Front) *
                </label>
                <textarea
                  placeholder="Enter the question..."
                  value={newFlashcardFront}
                  onChange={(e) => setNewFlashcardFront(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && e.ctrlKey && handleFlashcardSubmit()}
                  className="input w-full h-20 resize-none"
                  autoFocus
                  maxLength={500}
                />
                <p className="text-xs text-neutral-500 mt-1">Ctrl+Enter to save</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2">
                  Answer (Back) *
                </label>
                <textarea
                  placeholder="Enter the answer..."
                  value={newFlashcardBack}
                  onChange={(e) => setNewFlashcardBack(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && e.ctrlKey && handleFlashcardSubmit()}
                  className="input w-full h-20 resize-none"
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateFlashcardDialog(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleFlashcardSubmit}
                disabled={!newFlashcardFront.trim() || !newFlashcardBack.trim()}
                className="btn-primary disabled:opacity-50"
              >
                {flashcardDialogMode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
