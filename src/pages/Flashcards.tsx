import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Plus, RefreshCw, Folder, Edit3, Trash2, FileText, X, Clock, Star } from 'lucide-react';
import { getFlashcardFolders, createFlashcardFolder } from '../lib/flashcard-folders';
import { createDeck, updateDeck, deleteDeck } from '../lib/decks';
import { createFlashcard, updateFlashcard, deleteFlashcard, getFlashcards } from '../lib/flashcards';
import type { FlashcardFolderWithChildren } from '../lib/flashcard-folders';
import type { Deck, Flashcard } from '../types';

export default function Flashcards() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [showReviewSettings, setShowReviewSettings] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewStage, setReviewStage] = useState<'flip' | 'multiple-choice' | 'typing' | 'matching' | 'true-false'>('flip');
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewFlashcards, setReviewFlashcards] = useState<Flashcard[]>([]);
  const [reviewResults, setReviewResults] = useState<{ [key: string]: { type: 'correct' | 'wrong' | 'close', attempts: number } }>({});
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'close' | 'wrong' | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [missedCards, setMissedCards] = useState<Set<string>>(new Set());

  // Review settings
  const [reviewSettings, setReviewSettings] = useState({
    questionTypes: ['flip', 'multiple-choice', 'typing', 'matching'] as ('flip' | 'multiple-choice' | 'typing' | 'matching' | 'true-false')[],
    shuffle: false,
    termFirst: true, // true = term->definition, false = definition->term
    allowDontKnow: true,
    sequentialMode: true // Complete all cards in one mode before moving to next
  });

  // Simplified review state
  const [currentModeIndex, setCurrentModeIndex] = useState(0);
  const [cardResults, setCardResults] = useState<{ [cardId: string]: { [mode: string]: 'correct' | 'wrong' | 'pending' } }>({});
  const [currentDeck, setCurrentDeck] = useState<Flashcard[]>([]);
  const [showFlipAnswer, setShowFlipAnswer] = useState(false);

  useEffect(() => {
    console.log('Flashcards component mounted, loading folders...');
    loadFolders();
  }, []);

  // Handle URL parameters to open specific deck
  useEffect(() => {
    const deckId = searchParams.get('deck');
    if (deckId && folders.length > 0) {
      // Find the deck in all folders
      let targetDeck: Deck | null = null;
      let targetFolderId: string | null = null;
      
      for (const folder of folders) {
        const deck = folder.decks?.find(d => d.id === deckId);
        if (deck) {
          targetDeck = deck;
          targetFolderId = folder.id;
          break;
        }
      }
      
      if (targetDeck && targetFolderId) {
        setSelectedFolderId(targetFolderId);
        setSelectedDeckId(deckId);
        // Clear the URL parameter after opening
        setSearchParams({});
      }
    }
  }, [folders, searchParams, setSearchParams]);

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

  // Initialize shuffled definitions when entering matching mode
  useEffect(() => {
    if (reviewStage === 'matching' && reviewFlashcards.length > 0) {
      // Use max 6 cards for better screen fit
      const cardsToUse = reviewFlashcards.slice(0, Math.min(6, reviewFlashcards.length));
      
      // Create shuffled definitions (ensuring they're not in same order as terms)
      const shuffled = cardsToUse
        .map((card, index) => ({ card, originalIndex: index }))
        .sort(() => Math.random() - 0.5);
      
      // Make sure definitions are not in the same order as terms
      let attempts = 0;
      while (attempts < 10) {
        let sameOrder = true;
        for (let i = 0; i < Math.min(3, shuffled.length); i++) {
          if (shuffled[i].originalIndex !== i) {
            sameOrder = false;
            break;
          }
        }
        if (!sameOrder) break;
        shuffled.sort(() => Math.random() - 0.5);
        attempts++;
      }
      
      console.log('🎯 Matching mode initialized:', {
        totalCards: cardsToUse.length,
        termsOrder: cardsToUse.map((c, i) => `${String.fromCharCode(65 + i)}: ${c.front}`),
        definitionsOrder: shuffled.map((s, i) => `${i + 1}: ${s.card.back} (original: ${s.originalIndex})`)
      });
      
      setShuffledDefinitions(shuffled);
      setSelectedTerm(null);
      setDrawnLines([]);
    }
  }, [reviewStage, reviewFlashcards]);

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
        
        // Don't set parent_id if we're in the virtual "Documents" folder
        const parentId = selectedFolderId === 'documents-virtual' ? undefined : selectedFolderId;
        
        const { error } = await createDeck({
          name: newDeckName.trim(),
          description: newDeckDescription.trim(),
          parent_id: parentId
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

  // Smart answer matching logic
  const checkAnswerSimilarity = (userAnswer: string, correctAnswer: string): 'correct' | 'close' | 'wrong' => {
    const normalize = (text: string) => text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const userNorm = normalize(userAnswer);
    const correctNorm = normalize(correctAnswer);
    
    if (userNorm === correctNorm) return 'correct';
    
    // Check if it's close enough (fuzzy matching)
    const words1 = userNorm.split(' ');
    const words2 = correctNorm.split(' ');
    
    // Simple similarity check - at least 70% of words match or are similar
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || 
            (word1.length > 3 && word2.length > 3 && 
             (word1.includes(word2) || word2.includes(word1)))) {
          matches++;
          break;
        }
      }
    }
    
    const similarity = matches / Math.max(words1.length, words2.length);
    return similarity >= 0.7 ? 'close' : 'wrong';
  };

  // Generate multiple choice options
  const generateMultipleChoiceOptions = (correctAnswer: string, allFlashcards: Flashcard[]): string[] => {
    // Ensure we have a valid correct answer
    if (!correctAnswer || correctAnswer.trim() === '') {
      console.error('Invalid correct answer provided to generateMultipleChoiceOptions:', correctAnswer);
      return ['Error: Invalid answer', 'Option 2', 'Option 3', 'Option 4'];
    }

    // Start with the correct answer
    const options = [correctAnswer.trim()];
    
    // Get other unique answers, excluding the correct one
    const otherAnswers = allFlashcards
      .filter(card => card.back && card.back.trim() !== correctAnswer.trim())
      .map(card => card.back.trim())
      .filter((answer, index, arr) => arr.indexOf(answer) === index) // Remove duplicates
      .sort(() => Math.random() - 0.5);
    
    // Add 3 random wrong answers
    for (let i = 0; i < 3 && i < otherAnswers.length; i++) {
      options.push(otherAnswers[i]);
    }
    
    // If we don't have enough flashcards, add some generic wrong answers
    while (options.length < 4) {
      options.push(`Option ${options.length}`);
    }
    
    // Shuffle the options but log for debugging
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    console.log('Generated multiple choice options:', {
      correctAnswer: correctAnswer.trim(),
      allOptions: shuffledOptions,
      correctIndex: shuffledOptions.indexOf(correctAnswer.trim())
    });
    
    return shuffledOptions;
  };

  // Review functionality
  const startReview = () => {
    if (!selectedDeckId || flashcards.length === 0) {
      alert('Please select a deck with flashcards to review');
      return;
    }
    
    // Prepare flashcards based on settings
    let cardsToReview = [...flashcards];
    
    // Shuffle if enabled
    if (reviewSettings.shuffle) {
      cardsToReview = cardsToReview.sort(() => Math.random() - 0.5);
    }
    
    // Initialize simple review system
    setShowReviewMode(true);
    setReviewFlashcards(cardsToReview);
    setCurrentModeIndex(0);
    setReviewStage(reviewSettings.questionTypes[0] || 'flip');
    
    // Reset all state
    setCurrentReviewIndex(0);
    setShowAnswer(false);
    setReviewResults({});
    setSelectedChoice(null);
    setTypedAnswer('');
    setAnswerFeedback(null);
    setCurrentRound(1);
    setMissedCards(new Set());
    setShowFlipAnswer(false);
    
    // Initialize card results tracking
    const initialResults: { [cardId: string]: { [mode: string]: 'correct' | 'wrong' | 'pending' } } = {};
    cardsToReview.forEach(card => {
      initialResults[card.id] = {};
      reviewSettings.questionTypes.forEach(mode => {
        initialResults[card.id][mode] = 'pending';
      });
    });
    setCardResults(initialResults);
    
    // Start with all cards for first mode
    setCurrentDeck(cardsToReview);
    
    // Generate multiple choice options for first card if needed
    if (cardsToReview.length > 0 && reviewSettings.questionTypes.includes('multiple-choice')) {
      const firstCard = cardsToReview[0];
      console.log('🎯 Initial setup - generating options for first card:', {
        cardId: firstCard.id,
        front: firstCard.front,
        back: firstCard.back,
        index: 0
      });
      const options = generateMultipleChoiceOptions(firstCard.back, cardsToReview);
      setMultipleChoiceOptions(options);
    }
  };

  const startReviewWithSettings = () => {
    setShowReviewSettings(true);
  };

  const endReview = () => {
    // Show session summary before closing
    const totalCards = reviewFlashcards.length;
    const correctCards = Object.values(reviewResults).filter(r => r.type === 'correct').length;
    const wrongCards = Object.values(reviewResults).filter(r => r.type === 'wrong').length;
    const closeCards = Object.values(reviewResults).filter(r => r.type === 'close').length;
    const percentage = Math.round((correctCards / totalCards) * 100);
    
    const summary = `Session Complete! 🎉
    
📊 Results:
• Total Cards: ${totalCards}
• Correct: ${correctCards} (${percentage}%)
• Close: ${closeCards}
• Wrong: ${wrongCards}
• Round: ${currentRound}

${missedCards.size > 0 ? `\n📚 Cards to review: ${missedCards.size}` : '\n🎯 All cards mastered!'}`;

    alert(summary);
    
    setShowReviewMode(false);
    setCurrentReviewIndex(0);
    setReviewStage('multiple-choice');
    setShowAnswer(false);
    setReviewResults({});
    setSelectedChoice(null);
    setTypedAnswer('');
    setAnswerFeedback(null);
    setCurrentRound(1);
    setMissedCards(new Set());
  };

  const nextCard = () => {
    const currentMode = reviewSettings.questionTypes[currentModeIndex];

    if (currentReviewIndex < currentDeck.length - 1) {
      // Get the current card we're moving FROM
      const currentCard = currentDeck[currentReviewIndex];

      // Move to next card in current deck
      const nextIndex = currentReviewIndex + 1;
      const nextCard = currentDeck[nextIndex];

      setCurrentReviewIndex(nextIndex);
      resetCardState();

      // Generate options for the NEW current card (the one we're moving TO)
      if (currentMode === 'multiple-choice') {
        console.log('🎯 Moving from card:', {
          fromCardId: currentCard.id,
          fromFront: currentCard.front,
          fromBack: currentCard.back
        });
        console.log('🎯 Generating options for new card:', {
          cardId: nextCard.id,
          front: nextCard.front,
          back: nextCard.back,
          index: nextIndex
        });
        const options = generateMultipleChoiceOptions(nextCard.back, reviewFlashcards);
        console.log('🎯 Generated options for next card:', {
          cardId: nextCard.id,
          correctAnswer: nextCard.back,
          generatedOptions: options,
          correctAnswerInOptions: options.includes(nextCard.back),
          correctAnswerIndex: options.findIndex(opt => opt === nextCard.back)
        });
        setMultipleChoiceOptions(options);
      }
    } else {
      // End of current deck - check what to do next
      checkModeCompletion();
    }
  };

  const checkModeCompletion = () => {
    const currentMode = reviewSettings.questionTypes[currentModeIndex];
    
    // Get all cards that still need to be retried in current mode
    const cardsToRetry = reviewFlashcards.filter(card => 
      cardResults[card.id]?.[currentMode] === 'wrong'
    );
    
    console.log('🔍 Checking mode completion:', { 
      mode: currentMode, 
      cardsToRetry: cardsToRetry.length,
      currentDeckLength: currentDeck.length,
      allResults: cardResults
    });
    
    if (cardsToRetry.length > 0) {
      // Start retry round with only wrong cards
      console.log('🔄 Starting retry round with', cardsToRetry.length, 'cards');
      setCurrentDeck(cardsToRetry);
      setCurrentReviewIndex(0);
      resetCardState();
      
      // Generate options for first retry card if needed
      if (currentMode === 'multiple-choice') {
        const options = generateMultipleChoiceOptions(cardsToRetry[0].back, reviewFlashcards);
        setMultipleChoiceOptions(options);
      }
    } else {
      // All cards completed in current mode - move to next mode
      console.log('✅ All cards completed in mode:', currentMode);
      moveToNextMode();
    }
  };

  const moveToNextMode = () => {
    const nextModeIndex = currentModeIndex + 1;
    
    console.log('🎯 Moving to next mode:', { 
      currentMode: reviewSettings.questionTypes[currentModeIndex],
      nextModeIndex, 
      totalModes: reviewSettings.questionTypes.length 
    });
    
    if (nextModeIndex < reviewSettings.questionTypes.length) {
      // Update all state simultaneously to prevent screen flicker
      setCurrentModeIndex(nextModeIndex);
      setCurrentReviewIndex(0);
      setReviewStage(reviewSettings.questionTypes[nextModeIndex]);
      setCurrentDeck(reviewFlashcards); // Reset to all cards for new mode
      resetCardState();
      
      // Generate options for first card in new mode if needed
      if (reviewSettings.questionTypes[nextModeIndex] === 'multiple-choice') {
        const options = generateMultipleChoiceOptions(reviewFlashcards[0].back, reviewFlashcards);
        setMultipleChoiceOptions(options);
      }
      
      console.log('✅ Successfully moved to mode:', reviewSettings.questionTypes[nextModeIndex]);
    } else {
      // All modes completed
      console.log('🎉 All modes completed, ending review');
      endReview();
    }
  };

  const resetCardState = () => {
    setShowAnswer(false);
    setSelectedChoice(null);
    setTypedAnswer('');
    setAnswerFeedback(null);
    setShowFlipAnswer(false);
    setMatchingPairs({});
    setMatchingSelections({});
    setSelectedTerm(null);
    setDrawnLines([]);
    
    // Initialize shuffled definitions for matching mode
    if (reviewStage === 'matching') {
      const cardsToUse = reviewFlashcards.slice(0, Math.min(6, reviewFlashcards.length));
      const shuffled = cardsToUse
        .map((card, index) => ({ card, originalIndex: index }))
        .sort(() => Math.random() - 0.5);
      setShuffledDefinitions(shuffled);
    }
  };

  const previousCard = () => {
    if (currentReviewIndex > 0) {
      const prevIndex = currentReviewIndex - 1;
      const prevCard = currentDeck[prevIndex];

      setCurrentReviewIndex(prevIndex);
      setReviewStage('multiple-choice');
      setShowAnswer(false);
      setSelectedChoice(null);
      setTypedAnswer('');
      setAnswerFeedback(null);

      // Generate new multiple choice options
      console.log('🎯 Previous card - generating options for:', {
        cardId: prevCard.id,
        front: prevCard.front,
        back: prevCard.back,
        index: prevIndex
      });
      const options = generateMultipleChoiceOptions(prevCard.back, reviewFlashcards);
      setMultipleChoiceOptions(options);
    }
  };

  // Handle multiple choice selection
  const handleMultipleChoiceSelect = (choice: string) => {
    setSelectedChoice(choice);
    const currentCard = currentDeck[currentReviewIndex];
    const currentMode = reviewSettings.questionTypes[currentModeIndex];

    // Robust comparison with trimming
    const isCorrect = choice.trim() === currentCard.back.trim();

    console.log('🎯 Multiple choice selection:', {
      selectedChoice: choice.trim(),
      correctAnswer: currentCard.back.trim(),
      isCorrect,
      cardId: currentCard.id,
      cardFront: currentCard.front,
      availableOptions: multipleChoiceOptions,
      correctAnswerInOptions: multipleChoiceOptions.includes(currentCard.back.trim()),
      correctAnswerIndex: multipleChoiceOptions.findIndex(opt => opt.trim() === currentCard.back.trim()),
      currentReviewIndex,
      currentDeckLength: currentDeck.length,
      currentDeck: currentDeck.map(c => ({id: c.id, front: c.front, back: c.back})),
      // Also check against currentReviewCard for comparison
      currentReviewCardBack: currentReviewCard?.back || 'undefined'
    });

    // Force re-render to update UI colors immediately
    setTimeout(() => {
      // Trigger a re-render by updating a state variable
      setCurrentReviewIndex(prev => prev);
    }, 0);
    
    // Update card results
    setCardResults(prev => ({
      ...prev,
      [currentCard.id]: {
        ...prev[currentCard.id],
        [currentMode]: isCorrect ? 'correct' : 'wrong'
      }
    }));
    
    // Update review results for display
    setReviewResults(prev => ({
      ...prev,
      [currentCard.id]: { type: isCorrect ? 'correct' : 'wrong', attempts: (prev[currentCard.id]?.attempts || 0) + 1 }
    }));
    
    if (isCorrect) {
      // Defer deck mutation until after highlight so UI compares against correct card
      setTimeout(() => {
        const currentModeAfter = reviewSettings.questionTypes[currentModeIndex];
        const newDeck = currentDeck.filter(card => card.id !== currentCard.id);
        console.log('✅ Correct answer - removed card from deck (deferred):', {
          cardId: currentCard.id,
          oldDeckLength: currentDeck.length,
          newDeckLength: newDeck.length,
          newDeck: newDeck.map(c => c.id)
        });
        setCurrentDeck(newDeck);

        if (newDeck.length === 0) {
          console.log('🎉 Last card completed! Moving to next mode...');
          moveToNextMode();
        } else {
          // Keep index at same position; it now points to the next card
          const safeIndex = Math.min(currentReviewIndex, newDeck.length - 1);
          if (safeIndex !== currentReviewIndex) {
            setCurrentReviewIndex(safeIndex);
          }
          resetCardState();
          setSelectedChoice(null);

          // Regenerate options for the new current card if needed
          if (currentModeAfter === 'multiple-choice') {
            const nextCardBack = newDeck[safeIndex]?.back;
            if (nextCardBack) {
              const options = generateMultipleChoiceOptions(nextCardBack, reviewFlashcards);
              setMultipleChoiceOptions(options);
            }
          }
        }
      }, 600);
    } else {
      // Wrong answer - DO NOT mutate deck yet. Show answer, then requeue on Continue.
      setMissedCards(prev => new Set([...prev, currentCard.id]));
      setShowAnswer(true);
    }
  };

  // Handle typed answer submission
  const handleTypedAnswerSubmit = () => {
    const currentCard = currentDeck[currentReviewIndex];
    const currentMode = reviewSettings.questionTypes[currentModeIndex];
    const feedback = checkAnswerSimilarity(typedAnswer, currentCard.back);
    setAnswerFeedback(feedback);
    
    // Update card results
    setCardResults(prev => ({
      ...prev,
      [currentCard.id]: {
        ...prev[currentCard.id],
        [currentMode]: feedback === 'correct' ? 'correct' : 'wrong'
      }
    }));
    
    // Update results for display
    setReviewResults(prev => ({
      ...prev,
      [currentCard.id]: { 
        type: feedback, 
        attempts: (prev[currentCard.id]?.attempts || 0) + 1 
      }
    }));
    
    if (feedback === 'wrong') {
      // Add current card to end of deck
      setCurrentDeck(prev => {
        // Create new deck: remove current card and add it to the end
        const beforeCurrent = prev.slice(0, currentReviewIndex);
        const afterCurrent = prev.slice(currentReviewIndex + 1);
        const newDeck = [...beforeCurrent, ...afterCurrent, currentCard];
        
        console.log('🔄 Typing wrong - moved card to end:', { 
          cardId: currentCard.id, 
          oldIndex: currentReviewIndex,
          newDeckLength: newDeck.length,
          newDeck: newDeck.map(c => c.id)
        });
        
        return newDeck;
      });
      
      setMissedCards(prev => new Set([...prev, currentCard.id]));
    }
    
    if (feedback === 'correct') {
      // Correct - move to next card after brief delay
      setTimeout(() => {
        nextCard();
      }, 1500);
    }
    // For 'close' or 'wrong', user decides what to do next
  };

  // Handle user decision on close answer
  const handleCloseAnswerDecision = (wasCorrect: boolean) => {
    const currentCard = currentDeck[currentReviewIndex];
    const currentMode = reviewSettings.questionTypes[currentModeIndex];
    
    if (wasCorrect) {
      // Update card results
      setCardResults(prev => ({
        ...prev,
        [currentCard.id]: {
          ...prev[currentCard.id],
          [currentMode]: 'correct'
        }
      }));
      
      // Update to correct
      setReviewResults(prev => ({
        ...prev,
        [currentCard.id]: { ...prev[currentCard.id], type: 'correct' }
      }));
      
      nextCard();
    } else {
      // Mark as wrong and add to end of deck
      setCardResults(prev => ({
        ...prev,
        [currentCard.id]: {
          ...prev[currentCard.id],
          [currentMode]: 'wrong'
        }
      }));
      
      // Add current card to end of deck
      setCurrentDeck(prev => {
        // Create new deck: remove current card and add it to the end
        const beforeCurrent = prev.slice(0, currentReviewIndex);
        const afterCurrent = prev.slice(currentReviewIndex + 1);
        const newDeck = [...beforeCurrent, ...afterCurrent, currentCard];
        
        console.log('🔄 Close answer wrong - moved card to end:', { 
          cardId: currentCard.id, 
          oldIndex: currentReviewIndex,
          newDeckLength: newDeck.length,
          newDeck: newDeck.map(c => c.id)
        });
        
        return newDeck;
      });
      
      setMissedCards(prev => new Set([...prev, currentCard.id]));
      setReviewResults(prev => ({
        ...prev,
        [currentCard.id]: { ...prev[currentCard.id], type: 'wrong' }
      }));
      
      // Try again - reset typing stage (stay on same card)
      setTypedAnswer('');
      setAnswerFeedback(null);
    }
  };

  // Handle flip card response
  const handleFlipResponse = (response: 'correct' | 'wrong') => {
    const currentCard = currentDeck[currentReviewIndex];
    const currentMode = reviewSettings.questionTypes[currentModeIndex];
    
    // Update card results
    setCardResults(prev => ({
      ...prev,
      [currentCard.id]: {
        ...prev[currentCard.id],
        [currentMode]: response
      }
    }));
    
    // Track results for display
    setReviewResults(prev => ({
      ...prev,
      [currentCard.id]: { 
        type: response, 
        attempts: (prev[currentCard.id]?.attempts || 0) + 1 
      }
    }));
    
    if (response === 'wrong') {
      // Add current card to end of deck
      setCurrentDeck(prev => {
        // Create new deck: remove current card and add it to the end
        const beforeCurrent = prev.slice(0, currentReviewIndex);
        const afterCurrent = prev.slice(currentReviewIndex + 1);
        const newDeck = [...beforeCurrent, ...afterCurrent, currentCard];
        
        console.log('🔄 Flip wrong - moved card to end:', { 
          cardId: currentCard.id, 
          oldIndex: currentReviewIndex,
          newDeckLength: newDeck.length,
          newDeck: newDeck.map(c => c.id)
        });
        
        return newDeck;
      });
      
      setMissedCards(prev => new Set([...prev, currentCard.id]));
    }
    
    // Reset flip state
    setShowFlipAnswer(false);
    
    if (response === 'correct') {
      // Remove card from current deck
      setCurrentDeck(prev => {
        const newDeck = prev.filter(card => card.id !== currentCard.id);
        console.log('✅ Flip correct - removed card from deck:', { 
          cardId: currentCard.id, 
          oldDeckLength: prev.length,
          newDeckLength: newDeck.length,
          newDeck: newDeck.map(c => c.id)
        });
        return newDeck;
      });
      
      setTimeout(() => {
        // Check if deck is now empty after removing this card
        if (currentDeck.length === 1) {
          // This was the last card - move to next mode
          console.log('🎉 Last card completed! Moving to next mode...');
          moveToNextMode();
        } else if (currentReviewIndex >= currentDeck.length - 1) {
          // Index beyond new deck - reset to last card
          setCurrentReviewIndex(currentDeck.length - 2); // -2 because we removed one card
          resetCardState();
        } else {
          // Continue with same index (now points to next card)
          resetCardState();
        }
      }, 500);
    } else {
      // For wrong answers, don't remove card - just reset state
      setTimeout(() => {
        resetCardState();
        // Generate options for the card that's now at current index
        const currentMode = reviewSettings.questionTypes[currentModeIndex];
        if (currentMode === 'multiple-choice' && currentDeck[currentReviewIndex]) {
          const options = generateMultipleChoiceOptions(currentDeck[currentReviewIndex].back, reviewFlashcards);
          setMultipleChoiceOptions(options);
        }
      }, 500);
    }
  };

  // Matching mode state and handlers
  const [matchingSelections, setMatchingSelections] = useState<{question?: number, answer?: number}>({});
  const [matchingPairs, setMatchingPairs] = useState<{[key: number]: number}>({});
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [drawnLines, setDrawnLines] = useState<{from: number, to: number, correct: boolean, id: string}[]>([]);
  const [shuffledDefinitions, setShuffledDefinitions] = useState<{card: Flashcard, originalIndex: number}[]>([]);

  const handleLineDrawingClick = (type: 'term' | 'definition', index: number) => {
    if (type === 'term') {
      // Clicking a term - select it
      setSelectedTerm(selectedTerm === index ? null : index);
    } else if (type === 'definition' && selectedTerm !== null) {
      // Clicking a definition with a term selected - draw line
      const lineId = `${selectedTerm}-${index}`;
      const isCorrect = selectedTerm === index; // Correct if indices match
      
      // Check if line already exists
      const existingLineIndex = drawnLines.findIndex(line => line.from === selectedTerm);
      if (existingLineIndex >= 0) {
        // Replace existing line from this term
        setDrawnLines(prev => prev.map((line, i) => 
          i === existingLineIndex 
            ? { from: selectedTerm, to: index, correct: isCorrect, id: lineId }
            : line
        ));
      } else {
        // Add new line
        setDrawnLines(prev => [...prev, { from: selectedTerm, to: index, correct: isCorrect, id: lineId }]);
      }
      
      if (!isCorrect) {
        // Wrong match - flash red and remove after delay
        setTimeout(() => {
          setDrawnLines(prev => prev.filter(line => line.id !== lineId));
        }, 1000);
      }
      
      setSelectedTerm(null);
      
      // Check if all correct matches are made
      const totalCards = shuffledDefinitions.length;
      const correctLines = drawnLines.filter(line => line.correct).length + (isCorrect ? 1 : 0);
      
      if (correctLines === totalCards) {
        // All matched correctly!
        setTimeout(() => {
          handleMatchingComplete();
        }, 1500);
      }
    }
  };

  const handleMatchingComplete = () => {
    // Calculate score based on correct matches
    const currentCards = reviewFlashcards.slice(currentReviewIndex, Math.min(currentReviewIndex + 4, reviewFlashcards.length));
    let correctMatches = 0;
    
    Object.entries(matchingPairs).forEach(([questionIndex, answerIndex]) => {
      if (parseInt(questionIndex) === answerIndex) {
        correctMatches++;
      }
    });
    
    const accuracy = correctMatches / currentCards.length;
    const currentCard = reviewFlashcards[currentReviewIndex];
    
    // Track results
    setReviewResults(prev => ({
      ...prev,
      [currentCard.id]: { 
        type: accuracy >= 0.75 ? 'correct' : accuracy >= 0.5 ? 'close' : 'wrong', 
        attempts: (prev[currentCard.id]?.attempts || 0) + 1 
      }
    }));
    
    if (accuracy < 0.75) {
      setMissedCards(prev => new Set([...prev, currentCard.id]));
    }
    
    // Reset matching state and move to next
    setMatchingPairs({});
    setMatchingSelections({});
    
    setTimeout(() => {
      nextCard();
    }, 1000);
  };

  const handleReviewResponse = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const currentCard = reviewFlashcards[currentReviewIndex];
    if (!currentCard) return;

    // Update review results - convert difficulty to proper format
    const resultType = difficulty === 'easy' ? 'correct' : difficulty === 'medium' ? 'close' : 'wrong';
    setReviewResults(prev => ({
      ...prev,
      [currentCard.id]: { 
        type: resultType, 
        attempts: (prev[currentCard.id]?.attempts || 0) + 1 
      }
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

  const currentReviewCard = React.useMemo(() => {
    return currentDeck[currentReviewIndex];
  }, [currentDeck, currentReviewIndex]);

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

      {/* Review Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        <button
          onClick={startReviewWithSettings}
          disabled={!selectedDeckId || flashcards.length === 0}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 flex items-center space-x-2 ${
            !selectedDeckId || flashcards.length === 0
              ? 'bg-neutral-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'
          }`}
          title="Review with Settings"
        >
          <Star className="w-5 h-5" />
        </button>
        
      <button
        onClick={startReview}
        disabled={!selectedDeckId || flashcards.length === 0}
          className={`p-4 rounded-full shadow-lg transition-all duration-200 flex items-center space-x-2 ${
          !selectedDeckId || flashcards.length === 0
            ? 'bg-neutral-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
        }`}
        title={!selectedDeckId || flashcards.length === 0 
          ? 'Select a deck with flashcards to review' 
            : 'Quick Review'
        }
      >
        <RefreshCw className="w-5 h-5" />
        <span className="hidden sm:inline">Review</span>
      </button>
      </div>

      {/* Review Mode Overlay - Full Screen */}
      {showReviewMode && reviewFlashcards.length > 0 && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 z-50 flex flex-col">
          {/* Review Header - Compact */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6" />
                <div>
                <h3 className="text-lg font-bold">Review Session</h3>
                <p className="text-blue-100 text-sm">
                  {selectedDeck?.name} • Card {currentReviewIndex + 1}/{currentDeck.length}
                </p>
                <p className="text-blue-200 text-xs">
                  Mode: {reviewStage.charAt(0).toUpperCase() + reviewStage.slice(1).replace('-', ' ')} • 
                  Stage {currentModeIndex + 1}/{reviewSettings.questionTypes.length}
                  </p>
                </div>
              </div>
              <button
                onClick={endReview}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
          <div className="bg-neutral-200 h-3">
              <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${((currentReviewIndex + 1) / reviewFlashcards.length) * 100}%` }}
              />
            </div>

          {/* Main Content Area - Optimized Layout */}
          <div className="flex-1 flex flex-col justify-center p-6 min-h-0">
            {currentReviewCard ? (
            <div className="w-full max-w-4xl mx-auto space-y-6">
              {/* Question (Front) - Compact */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-base font-bold text-blue-600 uppercase tracking-wide">Question</span>
                  <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                <div className="text-center">
                  <p className="text-xl text-neutral-900 leading-relaxed font-medium">
                    {currentReviewCard.front}
                  </p>
                </div>
                </div>

              {/* Stage 1: Flip Card Mode */}
              {reviewStage === 'flip' && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="text-center space-y-6">
                    <div className="bg-blue-50 rounded-lg p-8 min-h-[200px] flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-blue-100"
                         onClick={() => setShowFlipAnswer(!showFlipAnswer)}>
                      {!showFlipAnswer ? (
                        <div>
                          <p className="text-lg font-medium text-blue-700 mb-2">Click to reveal answer</p>
                          <p className="text-sm text-blue-600">👆 Tap the card</p>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-green-600 mb-3">Answer:</div>
                          <p className="text-xl text-green-800 font-medium leading-relaxed">
                            {currentReviewCard.back}
                          </p>
                        </div>
                      )}
              </div>

                    {showFlipAnswer && (
                      <div className="flex justify-center space-x-4">
                  <button
                          onClick={() => handleFlipResponse('wrong')}
                          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <span>❌</span>
                          <span>Didn't Know</span>
                        </button>
                        <button
                          onClick={() => handleFlipResponse('correct')}
                          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <span>✅</span>
                          <span>I Knew It</span>
                  </button>
                </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stage 2: Multiple Choice - Compact */}
              {reviewStage === 'multiple-choice' && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-lg font-semibold text-neutral-700 mb-4 text-center">Choose the correct answer:</h4>
                  <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {multipleChoiceOptions.map((option, index) => {
                          const isOptionCorrect = option.trim() === currentReviewCard.back.trim();
                          const isSelected = selectedChoice === option;

                          console.log(`🎨 Option ${index + 1} rendering:`, {
                            option: option.trim(),
                            currentCardAnswer: currentReviewCard.back.trim(),
                            isOptionCorrect,
                            isSelected,
                            optionClass: isSelected ? (isOptionCorrect ? 'correct' : 'wrong') : (selectedChoice !== null ? (isOptionCorrect ? 'correct-dim' : 'wrong-dim') : 'normal')
                          });

                          return (
                            <button
                              key={index}
                              onClick={() => handleMultipleChoiceSelect(option)}
                              disabled={selectedChoice !== null}
                              className={`p-3 rounded-lg border-2 transition-all duration-200 text-left text-sm ${
                                isSelected
                                  ? isOptionCorrect
                                    ? 'bg-green-100 border-green-400 text-green-800'
                                    : 'bg-red-100 border-red-400 text-red-800'
                                  : selectedChoice !== null
                                  ? isOptionCorrect
                                    ? 'bg-green-50 border-green-300 text-green-700'
                                    : 'bg-neutral-100 border-neutral-300 text-neutral-500'
                                  : 'bg-white border-neutral-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-800'
                              }`}
                            >
                            <div className="flex items-start space-x-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                                isSelected
                                  ? isOptionCorrect
                                    ? 'bg-green-200 text-green-800'
                                    : 'bg-red-200 text-red-800'
                                  : 'bg-neutral-200 text-neutral-600'
                              }`}>
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="flex-1 leading-snug">{option}</span>
                              <span className="text-xs text-neutral-400 ml-1 opacity-0 group-hover:opacity-100">
                                {index + 1}
                              </span>
                            </div>
                          </button>
                          );
                        })}
                    </div>
                    
                    {/* Don't Know Button */}
                    {reviewSettings.allowDontKnow && selectedChoice === null && (
                      <div className="text-center">
                    <button
                          onClick={() => {
                            setShowAnswer(true);
                            setMissedCards(prev => new Set([...prev, currentReviewCard.id]));
                            setTimeout(() => {
                              setReviewStage('typing');
                              setShowAnswer(false);
                            }, 2000);
                          }}
                          className="px-4 py-2 bg-neutral-500 hover:bg-neutral-600 text-white rounded-lg text-sm transition-colors"
                        >
                          🤷‍♂️ Don't Know
                  </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Show correct answer if wrong choice - Inline */}
                  {selectedChoice && selectedChoice !== currentReviewCard.back && showAnswer && (
                    <div className="mt-4 space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-center">
                          <span className="text-green-800 font-medium text-sm">Correct Answer: </span>
                          <span className="text-green-700 text-sm font-medium">{currentReviewCard.back}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <button
                          onClick={() => {
                            // Requeue wrong card to the end now (after user had time to see)
                            const wrongCard = currentDeck[currentReviewIndex];
                            const beforeCurrent = currentDeck.slice(0, currentReviewIndex);
                            const afterCurrent = currentDeck.slice(currentReviewIndex + 1);
                            const newDeck = [...beforeCurrent, ...afterCurrent, wrongCard];
                            console.log('🔄 Continue → requeue wrong card to end (deferred):', {
                              cardId: wrongCard.id,
                              oldIndex: currentReviewIndex,
                              newDeckLength: newDeck.length,
                              newDeck: newDeck.map(c => c.id)
                            });
                            setCurrentDeck(newDeck);

                            // Keep index at same position to show the next card in order
                            const safeIndex = Math.min(currentReviewIndex, newDeck.length - 1);
                            if (safeIndex !== currentReviewIndex) {
                              setCurrentReviewIndex(safeIndex);
                            }

                            setSelectedChoice(null);
                            setShowAnswer(false);
                            resetCardState();

                            // Generate options for the card that's now at current index
                            const currentMode = reviewSettings.questionTypes[currentModeIndex];
                            if (currentMode === 'multiple-choice' && newDeck[safeIndex]) {
                              const options = generateMultipleChoiceOptions(newDeck[safeIndex].back, reviewFlashcards);
                              setMultipleChoiceOptions(options);
                            }
                          }}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Continue →
                    </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stage 2: Matching Mode - Clean Pairing */}
              {reviewStage === 'matching' && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-neutral-800 mb-2">Match the Pairs</h4>
                    <p className="text-neutral-600 mb-3">
                      Click a term, then click its matching definition
                    </p>
                    <div className="inline-flex items-center px-3 py-1 bg-green-50 rounded-full border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-green-700">
                        {drawnLines.filter(line => line.correct).length} / {shuffledDefinitions.length} matched
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Top Row - Terms */}
                    <div>
                      <div className="text-center mb-4">
                        <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
                          📚 Terms
                        </span>
                      </div>
                      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(shuffledDefinitions.length, 6)}, 1fr)` }}>
                        {shuffledDefinitions.slice(0, 6).map((_, index) => {
                          const card = reviewFlashcards[index];
                          if (!card) return null;
                          
                          const isSelected = selectedTerm === index;
                          const isMatched = drawnLines.some(line => line.from === index && line.correct);
                          
                          return (
                            <div
                              key={`term-${index}`}
                              className={`relative p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 text-center ${
                                isSelected 
                                  ? 'bg-blue-500 text-white border-blue-600 shadow-lg scale-105' 
                                  : isMatched
                                  ? 'bg-green-500 text-white border-green-600 shadow-md'
                                  : 'bg-white border-neutral-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={() => handleLineDrawingClick('term', index)}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2 ${
                                isSelected ? 'bg-white/20 text-white' :
                                isMatched ? 'bg-white/20 text-white' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="text-sm font-medium leading-tight">
                                {card.front.length > 30 ? card.front.substring(0, 30) + '...' : card.front}
                              </span>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Bottom Row - Definitions (Shuffled) */}
                    <div>
                      <div className="text-center mb-4">
                        <span className="inline-block px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium text-sm">
                          💡 Definitions
                        </span>
                      </div>
                      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(shuffledDefinitions.length, 6)}, 1fr)` }}>
                        {shuffledDefinitions.slice(0, 6).map((item, shuffledIndex) => {
                          const isMatched = drawnLines.some(line => line.to === item.originalIndex && line.correct);
                          const canSelect = selectedTerm !== null && !isMatched;
                          
                          return (
                            <div
                              key={`def-${item.originalIndex}`}
                              className={`relative p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 text-center ${
                                canSelect
                                  ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 hover:border-yellow-400 hover:scale-102'
                                  : isMatched
                                  ? 'bg-green-500 text-white border-green-600 shadow-md'
                                  : 'bg-white border-neutral-200 hover:border-purple-300 hover:bg-purple-50'
                              }`}
                              onClick={() => handleLineDrawingClick('definition', item.originalIndex)}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2 ${
                                isMatched ? 'bg-white/20 text-white' :
                                canSelect ? 'bg-yellow-200 text-yellow-800' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {shuffledIndex + 1}
                              </div>
                              <span className="text-sm font-medium leading-tight">
                                {item.card.back.length > 30 ? item.card.back.substring(0, 30) + '...' : item.card.back}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Instructions and Controls */}
                  <div className="mt-6 flex justify-between items-center bg-neutral-50 rounded-lg p-3">
                    <div className="text-sm text-neutral-600">
                      {selectedTerm !== null ? 
                        `Term ${String.fromCharCode(65 + selectedTerm)} selected - click a definition` : 
                        'Click any term to start matching'
                      }
                    </div>
                    <button
                      onClick={() => {
                        setDrawnLines([]);
                        setSelectedTerm(null);
                      }}
                      className="px-3 py-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded text-sm transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 3: Type Answer - Compact */}
              {reviewStage === 'typing' && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-lg font-semibold text-neutral-700 mb-4 text-center">Now type the answer:</h4>
                  
                <div className="space-y-4">
                    <textarea
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !answerFeedback && handleTypedAnswerSubmit()}
                      placeholder="Type your answer here..."
                      className={`w-full p-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none text-base h-20 resize-none ${
                        answerFeedback ? 'border-neutral-200 bg-neutral-50 text-neutral-500' : 'border-neutral-300'
                      }`}
                      autoFocus
                      disabled={!!answerFeedback}
                    />
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-neutral-500">
                        {answerFeedback ? 'Answer submitted' : 'Press Enter to submit'}
                      </p>
                    <button
                        onClick={handleTypedAnswerSubmit}
                        disabled={!typedAnswer.trim() || !!answerFeedback}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Submit
                    </button>
                  </div>

                    {/* Answer Feedback - Compact */}
                    {answerFeedback && (
                      <div className={`p-4 rounded-lg border-2 ${
                        answerFeedback === 'correct' 
                          ? 'bg-green-50 border-green-300'
                          : answerFeedback === 'close'
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-red-50 border-red-300'
                      }`}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className={`font-bold ${
                              answerFeedback === 'correct' ? 'text-green-700' :
                              answerFeedback === 'close' ? 'text-yellow-700' : 'text-red-700'
                            }`}>
                              {answerFeedback === 'correct' ? '✅ Correct!' :
                               answerFeedback === 'close' ? '🟡 Close!' : '❌ Not quite'}
                            </div>
                            <div className="text-neutral-700 text-sm">
                              <span className="font-medium">Answer: </span>
                              <span>{currentReviewCard.back}</span>
                            </div>
                          </div>

                          {answerFeedback === 'close' && (
                            <div className="flex space-x-3 justify-center">
                    <button
                                onClick={() => handleCloseAnswerDecision(true)}
                                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                              >
                                ✓ Close enough
                    </button>
                    <button
                                onClick={() => handleCloseAnswerDecision(false)}
                                className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                    >
                                ↻ Try again
                              </button>
                </div>
              )}

                          {answerFeedback === 'wrong' && (
                            <div className="text-center">
                              <button
                                onClick={() => handleCloseAnswerDecision(false)}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                              >
                                ↻ Try Again
                    </button>
            </div>
                          )}

                          {answerFeedback === 'correct' && (
                            <div className="text-green-700 font-medium text-center text-sm">
                              Moving to next card...
                </div>
              )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            ) : (
              <div className="w-full max-w-4xl mx-auto flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-neutral-600">Loading next question...</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer - Compact */}
          <div className="bg-white border-t border-neutral-200 px-6 py-4 flex items-center justify-between shadow-lg">
              <button
                onClick={previousCard}
                disabled={currentReviewIndex === 0}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  currentReviewIndex === 0
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300'
                }`}
              >
              ← Previous
              </button>
              
            <div className="flex items-center space-x-4">
              {reviewStage === 'typing' && (
                <button
                  onClick={() => {
                    setReviewStage('multiple-choice');
                    setTypedAnswer('');
                    setAnswerFeedback(null);
                  }}
                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs transition-colors"
                >
                  ← Multiple Choice
                </button>
              )}
              
              <div className="text-center">
                <span className="text-sm font-bold text-neutral-700">
                  {currentReviewIndex + 1}/{reviewFlashcards.length}
                </span>
              </div>
              </div>
              
              <button
                onClick={nextCard}
                disabled={currentReviewIndex === reviewFlashcards.length - 1}
              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  currentReviewIndex === reviewFlashcards.length - 1
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
              {currentReviewIndex === reviewFlashcards.length - 1 ? 'Complete' : 'Next →'}
              </button>
            </div>
        </div>
      )}

      {/* Review Settings Dialog */}
      {showReviewSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center space-x-2 mb-6">
              <Star className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold text-neutral-900">Review Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Question Types with Ordering */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-3">
                  Question Types & Order
                </label>
                <div className="space-y-3">
                  {/* Available Types */}
                  <div>
                    <div className="text-xs font-medium text-neutral-600 mb-2">Available Types:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'flip', label: 'Flip Cards', desc: 'Click to reveal answer' },
                        { id: 'multiple-choice', label: 'Multiple Choice', desc: '4 answer options' },
                        { id: 'typing', label: 'Type Answer', desc: 'Type the correct answer' },
                        { id: 'matching', label: 'Matching', desc: 'Match pairs together' }
                      ].map(type => (
                        <label key={type.id} className="flex items-start space-x-2 p-2 border rounded hover:bg-neutral-50">
                          <input
                            type="checkbox"
                            checked={reviewSettings.questionTypes.includes(type.id as any)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setReviewSettings(prev => ({
                                  ...prev,
                                  questionTypes: [...prev.questionTypes, type.id as any]
                                }));
                              } else {
                                setReviewSettings(prev => ({
                                  ...prev,
                                  questionTypes: prev.questionTypes.filter(t => t !== type.id)
                                }));
                              }
                            }}
                            className="w-3 h-3 text-blue-600 mt-0.5"
                          />
                          <div>
                            <div className="text-xs font-medium text-neutral-900">{type.label}</div>
                            <div className="text-xs text-neutral-500">{type.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Current Order */}
                  {reviewSettings.questionTypes.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-neutral-600 mb-2">Study Order:</div>
                      <div className="space-y-1">
                        {reviewSettings.questionTypes.map((type, index) => (
                          <div key={type} className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                            <span className="font-medium">
                              {index + 1}. {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => {
                                  if (index > 0) {
                                    const newTypes = [...reviewSettings.questionTypes];
                                    [newTypes[index], newTypes[index - 1]] = [newTypes[index - 1], newTypes[index]];
                                    setReviewSettings(prev => ({ ...prev, questionTypes: newTypes }));
                                  }
                                }}
                                disabled={index === 0}
                                className="text-blue-600 hover:text-blue-800 disabled:text-neutral-400 px-1"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => {
                                  if (index < reviewSettings.questionTypes.length - 1) {
                                    const newTypes = [...reviewSettings.questionTypes];
                                    [newTypes[index], newTypes[index + 1]] = [newTypes[index + 1], newTypes[index]];
                                    setReviewSettings(prev => ({ ...prev, questionTypes: newTypes }));
                                  }
                                }}
                                disabled={index === reviewSettings.questionTypes.length - 1}
                                className="text-blue-600 hover:text-blue-800 disabled:text-neutral-400 px-1"
                              >
                                ↓
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Other Settings */}
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-neutral-900">Shuffle Cards</div>
                    <div className="text-xs text-neutral-500">Randomize order each session</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reviewSettings.shuffle}
                    onChange={(e) => setReviewSettings(prev => ({ ...prev, shuffle: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-neutral-900">Term First</div>
                    <div className="text-xs text-neutral-500">Show term → definition (vs definition → term)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reviewSettings.termFirst}
                    onChange={(e) => setReviewSettings(prev => ({ ...prev, termFirst: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-neutral-900">Allow "Don't Know"</div>
                    <div className="text-xs text-neutral-500">Option to reveal answer without guessing</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reviewSettings.allowDontKnow}
                    onChange={(e) => setReviewSettings(prev => ({ ...prev, allowDontKnow: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                </label>


                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-neutral-900">Adaptive Repetition</div>
                    <div className="text-xs text-neutral-500">Show missed cards more frequently</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reviewSettings.sequentialMode}
                    onChange={(e) => setReviewSettings(prev => ({ ...prev, sequentialMode: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowReviewSettings(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReviewSettings(false);
                  startReview();
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              >
                Start Review
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
