import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  Calendar, 
  Play, 
  CheckCircle,
  FileText, 
  BookOpen, 
  Link,
  Archive,
  Check,
  Trash2,
  MoreHorizontal,
  Star,
  Zap,
  Target,
  RotateCcw
} from 'lucide-react';
import { 
  createTask, 
  createContextualTask,
  getTasks, 
  getTodaysTasks, 
  updateTask, 
  deleteTask, 
  completeTask,
  getPriorityColor,
  getTaskTypeIcon
} from '../lib/tasks';
import { getDocuments } from '../lib/documents';
import { getDecks } from '../lib/decks';
import type { Task, CreateTaskForm, CreateContextualTaskForm, FlowStep, Document, Deck } from '../types';

export default function TasksNew() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [taskToStart, setTaskToStart] = useState<Task | null>(null);

  // Task creation state
  const [newTask, setNewTask] = useState<CreateTaskForm>({
    title: '',
    description: '',
    task_type: 'quick_task',
    priority: 'medium',
    estimated_duration: 30,
    tags: []
  });

  // Contextual task state
  const [contextualType, setContextualType] = useState<'generic' | 'document' | 'deck' | 'combo' | 'multi'>('generic');
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);
  const [targetCardCount, setTargetCardCount] = useState<number>(20);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [availableDecks, setAvailableDecks] = useState<any[]>([]);

  useEffect(() => {
    loadTasks();
  }, [activeView]);

  // Load available documents and decks when dialog opens
  useEffect(() => {
    if (showCreateDialog) {
      loadAvailableItems();
    }
  }, [showCreateDialog]);

  const loadAvailableItems = async () => {
    try {
      // Load documents
      const docsResult = await getDocuments();
      if (docsResult.data) {
        setAvailableDocuments(docsResult.data);
      }

      // Load decks
      const decksResult = await getDecks();
      if (decksResult.data) {
        setAvailableDecks(decksResult.data);
      }
    } catch (err) {
      console.error('Failed to load available items:', err);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all tasks for kanban view
      const result = await getTasks({});
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setTasks(result.data || []);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for kanban view
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getTodayTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      if (!task.due_date) return true; // No due date = today
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate < tomorrow;
    });
  };

  const getUpcomingTasks = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      return task.due_date && new Date(task.due_date) >= tomorrow;
    });
  };

  const getCompletedTasks = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return tasks.filter(task => {
      if (task.status !== 'completed') return false;
      return task.completed_at && new Date(task.completed_at) >= sevenDaysAgo;
    });
  };

  const handleStartContextualTask = (task: Task) => {
    if (!task.contextual_type || task.contextual_type === 'generic') return;
    setTaskToStart(task);
    setShowConfirmDialog(true);
  };

  const handleConfirmStartTask = (action: 'document' | 'deck') => {
    if (!taskToStart) return;

    console.log('Starting task:', taskToStart);
    console.log('Action:', action);
    console.log('Contextual meta:', taskToStart.contextual_meta);

    switch (taskToStart.contextual_type) {
      case 'document':
        if (taskToStart.linked_id) {
          console.log('Navigating to document:', taskToStart.linked_id);
          navigate(`/documents?doc=${taskToStart.linked_id}`);
        }
        break;
      case 'deck':
        if (taskToStart.linked_id) {
          console.log('Navigating to deck:', taskToStart.linked_id);
          navigate(`/flashcards?deck=${taskToStart.linked_id}`);
        }
        break;
      case 'combo':
        if (taskToStart.contextual_meta) {
          if (action === 'document' && taskToStart.contextual_meta.document_id) {
            console.log('Navigating to combo document:', taskToStart.contextual_meta.document_id);
            navigate(`/documents?doc=${taskToStart.contextual_meta.document_id}`);
          } else if (action === 'deck' && taskToStart.contextual_meta.deck_id) {
            console.log('Navigating to combo deck:', taskToStart.contextual_meta.deck_id);
            navigate(`/flashcards?deck=${taskToStart.contextual_meta.deck_id}`);
          }
        }
        break;
      case 'multi':
        if (taskToStart.contextual_meta) {
          if (action === 'document' && taskToStart.contextual_meta.document_ids && taskToStart.contextual_meta.document_ids.length > 0) {
            console.log('Navigating to multi document:', taskToStart.contextual_meta.document_ids[0]);
            navigate(`/documents?doc=${taskToStart.contextual_meta.document_ids[0]}`);
          } else if (action === 'deck' && taskToStart.contextual_meta.deck_ids && taskToStart.contextual_meta.deck_ids.length > 0) {
            console.log('Navigating to multi deck:', taskToStart.contextual_meta.deck_ids[0]);
            navigate(`/flashcards?deck=${taskToStart.contextual_meta.deck_ids[0]}`);
          }
        }
        break;
    }
    
    setShowConfirmDialog(false);
    setTaskToStart(null);
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() && contextualType === 'generic') return;

    try {
      let result;
      if (contextualType === 'generic') {
        // Use regular task creation for generic tasks
        result = await createTask(newTask);
      } else {
        // Use contextual task creation
        const contextualData = {
          title: newTask.title || undefined, // Let it auto-generate if empty
          description: newTask.description,
          contextual_type: contextualType,
          priority: newTask.priority,
          due_date: newTask.due_date,
          estimated_duration: newTask.estimated_duration,
          linked_type: contextualType === 'document' ? 'document' as const : 
                      contextualType === 'deck' ? 'deck' as const : 'none' as const,
          linked_id: contextualType === 'document' ? selectedDocument :
                     contextualType === 'deck' ? selectedDeck : undefined,
          target_card_count: contextualType === 'deck' || contextualType === 'combo' ? targetCardCount : undefined,
          flow_steps: contextualType === 'combo' ? (['doc', 'create_cards', 'review'] as FlowStep[]) : undefined,
          task_source: 'manual' as const,
          tags: newTask.tags,
          notes: newTask.notes,
          // For combo tasks, store both document and deck IDs in contextual_meta
          // For multi tasks, store arrays of IDs
          contextual_meta: contextualType === 'combo' ? {
            document_id: selectedDocument,
            deck_id: selectedDeck
          } : contextualType === 'multi' ? {
            document_ids: selectedDocuments,
            deck_ids: selectedDecks
          } : undefined
        };
        console.log('Creating contextual task with data:', contextualData);
        result = await createContextualTask(contextualData);
      }
      
      if (result.error) {
        console.error('Task creation error:', result.error);
        setError(result.error);
        return;
      }

      // Reset form
      setNewTask({
        title: '',
        description: '',
        task_type: 'quick_task',
        priority: 'medium',
        estimated_duration: 30,
        tags: []
      });
      setContextualType('generic');
      setSelectedDocument('');
      setSelectedDeck('');
      setSelectedDocuments([]);
      setSelectedDecks([]);
      setTargetCardCount(20);
      setShowCreateDialog(false);
      setShowQuickAdd(false);
      setQuickAddText('');
      
      // Reload tasks
      await loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task');
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;

    try {
      const result = await createTask({
        title: quickAddText,
        description: '',
        task_type: 'quick_task',
        priority: 'medium',
        estimated_duration: 30,
        tags: []
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setQuickAddText('');
      setShowQuickAdd(false);
      await loadTasks();
    } catch (err) {
      console.error('Failed to create quick task:', err);
      setError('Failed to create task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const result = await completeTask(taskId);
      if (result.error) {
        setError(result.error);
        return;
      }
      await loadTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
      setError('Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const result = await deleteTask(taskId);
      if (result.error) {
        setError(result.error);
        return;
      }
      await loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Task Board</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Organize your work with a visual board</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setActiveView('kanban')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                activeView === 'kanban'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                activeView === 'list'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Quick Add */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="What needs to be done today?"
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
              className="w-full text-lg placeholder-neutral-400 dark:placeholder-neutral-500 border-none outline-none bg-transparent text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <button
            onClick={handleQuickAdd}
            disabled={!quickAddText.trim()}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
          >
            Add
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {activeView === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today Column */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Today</span>
              </h3>
              <span className="text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-full">
                {getTodayTasks().length}
              </span>
            </div>
            <div className="space-y-3">
              {getTodayTasks().map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStartContextualTask={handleStartContextualTask}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                />
              ))}
              {getTodayTasks().length === 0 && (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks for today</p>
                </div>
              )}
            </div>
          </div>

          {/* This Week Column */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>This Week</span>
              </h3>
              <span className="text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-full">
                {getUpcomingTasks().length}
              </span>
            </div>
            <div className="space-y-3">
              {getUpcomingTasks().map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStartContextualTask={handleStartContextualTask}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                />
              ))}
              {getUpcomingTasks().length === 0 && (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>In Progress</span>
              </h3>
              <span className="text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-full">
                {getTasksByStatus('in_progress').length}
              </span>
            </div>
            <div className="space-y-3">
              {getTasksByStatus('in_progress').map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStartContextualTask={handleStartContextualTask}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                />
              ))}
              {getTasksByStatus('in_progress').length === 0 && (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Done</span>
              </h3>
              <span className="text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-full">
                {getCompletedTasks().length}
              </span>
            </div>
            <div className="space-y-3">
              {getCompletedTasks().map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStartContextualTask={handleStartContextualTask}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                />
              ))}
              {getCompletedTasks().length === 0 && (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No completed tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadTasks}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">No tasks found</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">Get started by creating your first task</p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                Create Task
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStartContextualTask={handleStartContextualTask}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>
      )}

      {/* Create Task Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Create New Task</h3>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="input w-full"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Enter task description"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="input w-full h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Task Type
                  </label>
                  <select
                    value={newTask.task_type}
                    onChange={(e) => setNewTask(prev => ({ ...prev, task_type: e.target.value as any }))}
                    className="input w-full"
                  >
                    <option value="quick_task">⚡ Quick Task</option>
                    <option value="study_session">🎯 Study Session</option>
                    <option value="recurring_plan">🔄 Recurring Plan</option>
                  </select>
                </div>

                {/* Contextual Task Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Link to Content
                  </label>
                  <select
                    value={contextualType}
                    onChange={(e) => setContextualType(e.target.value as any)}
                    className="input w-full"
                  >
                    <option value="generic">📝 Generic Task</option>
                    <option value="document">📄 Study Document</option>
                    <option value="deck">🎴 Review Deck</option>
                    <option value="combo">🔗 Study → Review</option>
                    <option value="multi">📚 Multiple Items</option>
                  </select>
                </div>

                {/* Document Selection */}
                {contextualType === 'document' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Select Document
                    </label>
                    <select
                      value={selectedDocument}
                      onChange={(e) => setSelectedDocument(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Choose a document</option>
                      {availableDocuments.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          📄 {doc.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Deck Selection */}
                {contextualType === 'deck' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Select Deck
                    </label>
                    <select
                      value={selectedDeck}
                      onChange={(e) => setSelectedDeck(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Choose a deck</option>
                      {availableDecks.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                          🎴 {deck.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Combo Selection */}
                {contextualType === 'combo' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Select Document
                      </label>
                      <select
                        value={selectedDocument}
                        onChange={(e) => setSelectedDocument(e.target.value)}
                        className="input w-full"
                      >
                        <option value="">Choose a document</option>
                        {availableDocuments.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            📄 {doc.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Select Deck
                      </label>
                      <select
                        value={selectedDeck}
                        onChange={(e) => setSelectedDeck(e.target.value)}
                        className="input w-full"
                      >
                        <option value="">Choose a deck</option>
                        {availableDecks.map((deck) => (
                          <option key={deck.id} value={deck.id}>
                            🎴 {deck.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Multi Selection */}
                {contextualType === 'multi' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Select Documents
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-neutral-300 dark:border-neutral-600 rounded-lg p-2 space-y-1">
                        {availableDocuments.map((doc) => (
                          <label key={doc.id} className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocuments([...selectedDocuments, doc.id]);
                                } else {
                                  setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id));
                                }
                              }}
                              className="rounded border-neutral-300"
                            />
                            <span className="text-sm text-neutral-900 dark:text-neutral-100">📄 {doc.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Select Decks
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-neutral-300 dark:border-neutral-600 rounded-lg p-2 space-y-1">
                        {availableDecks.map((deck) => (
                          <label key={deck.id} className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedDecks.includes(deck.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDecks([...selectedDecks, deck.id]);
                                } else {
                                  setSelectedDecks(selectedDecks.filter(id => id !== deck.id));
                                }
                              }}
                              className="rounded border-neutral-300"
                            />
                            <span className="text-sm text-neutral-900 dark:text-neutral-100">🎴 {deck.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Target Card Count for Deck/Combo tasks */}
                {(contextualType === 'deck' || contextualType === 'combo') && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Target Cards to Review
                    </label>
                    <input
                      type="number"
                      placeholder="20"
                      value={targetCardCount}
                      onChange={(e) => setTargetCardCount(parseInt(e.target.value) || 20)}
                      className="input w-full"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="input w-full"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      placeholder="30"
                      value={newTask.estimated_duration}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 30 }))}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Due Date & Time
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hasDueDate"
                        checked={!!newTask.due_date}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Set to tomorrow at 12:00 PM if no date is set
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            const dateStr = tomorrow.toISOString().split('T')[0];
                            setNewTask(prev => ({ 
                              ...prev, 
                              due_date: `${dateStr}T12:00` 
                            }));
                          } else {
                            setNewTask(prev => ({ ...prev, due_date: '' }));
                          }
                        }}
                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="hasDueDate" className="text-sm text-neutral-700 dark:text-neutral-300">
                        Set due date
                      </label>
                    </div>
                    
                    {newTask.due_date && (
                      <div className="space-y-3">
                        {/* Quick presets */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date();
                              const time = newTask.due_date.split('T')[1];
                              setNewTask(prev => ({ 
                                ...prev, 
                                due_date: `${today.toISOString().split('T')[0]}T${time}` 
                              }));
                            }}
                            className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded transition-colors"
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              const time = newTask.due_date.split('T')[1];
                              setNewTask(prev => ({ 
                                ...prev, 
                                due_date: `${tomorrow.toISOString().split('T')[0]}T${time}` 
                              }));
                            }}
                            className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded transition-colors"
                          >
                            Tomorrow
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextWeek = new Date();
                              nextWeek.setDate(nextWeek.getDate() + 7);
                              const time = newTask.due_date.split('T')[1];
                              setNewTask(prev => ({ 
                                ...prev, 
                                due_date: `${nextWeek.toISOString().split('T')[0]}T${time}` 
                              }));
                            }}
                            className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded transition-colors"
                          >
                            Next Week
                          </button>
                        </div>
                        
                        {/* Date and time inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={newTask.due_date.split('T')[0]}
                              onChange={(e) => {
                                const date = e.target.value;
                                const time = newTask.due_date.split('T')[1];
                                setNewTask(prev => ({ 
                                  ...prev, 
                                  due_date: `${date}T${time}` 
                                }));
                              }}
                              className="input w-full text-sm"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                              Time
                            </label>
                            <input
                              type="time"
                              value={newTask.due_date.split('T')[1]}
                              onChange={(e) => {
                                const time = e.target.value;
                                const date = newTask.due_date.split('T')[0];
                                setNewTask(prev => ({ 
                                  ...prev, 
                                  due_date: `${date}T${time}` 
                                }));
                              }}
                              className="input w-full text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowCreateDialog(false);
                    setContextualType('generic');
                    setSelectedDocument('');
                    setSelectedDeck('');
                    setSelectedDocuments([]);
                    setSelectedDecks([]);
                    setTargetCardCount(20);
                  }}
                  className="bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={
                    contextualType === 'generic' ? !newTask.title.trim() :
                    contextualType === 'document' ? !selectedDocument :
                    contextualType === 'deck' ? !selectedDeck :
                    contextualType === 'combo' ? !selectedDocument || !selectedDeck :
                    contextualType === 'multi' ? (selectedDocuments.length === 0 && selectedDecks.length === 0) :
                    false
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:scale-105 transition-all duration-200"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && taskToStart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                {taskToStart.contextual_type === 'document' && <FileText className="w-5 h-5 text-blue-600" />}
                {taskToStart.contextual_type === 'deck' && <BookOpen className="w-5 h-5 text-purple-600" />}
                {taskToStart.contextual_type === 'combo' && <Link className="w-5 h-5 text-green-600" />}
                {taskToStart.contextual_type === 'multi' && <FileText className="w-5 h-5 text-orange-600" />}
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Start Task</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-neutral-600 dark:text-neutral-400">
                  {taskToStart.contextual_type === 'document' && (
                    <>Take me to <span className="font-medium text-blue-600">"{taskToStart.document_title || 'Document'}"</span> document?</>
                  )}
                  {taskToStart.contextual_type === 'deck' && (
                    <>Take me to <span className="font-medium text-purple-600">"{taskToStart.deck_name || 'Deck'}"</span> deck?</>
                  )}
                  {taskToStart.contextual_type === 'combo' && (
                    <div>
                      <p>Choose where to start your study flow:</p>
                      <div className="mt-4 space-y-3">
                        <button
                          onClick={() => handleConfirmStartTask('document')}
                          className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-all duration-200"
                        >
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div className="text-left">
                            <div className="font-medium text-blue-900 dark:text-blue-100">Study Document</div>
                            <div className="text-sm text-blue-600 dark:text-blue-400">{taskToStart.document_title || 'Document'}</div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleConfirmStartTask('deck')}
                          className="w-full flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg transition-all duration-200"
                        >
                          <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <div className="text-left">
                            <div className="font-medium text-purple-900 dark:text-purple-100">Review Deck</div>
                            <div className="text-sm text-purple-600 dark:text-purple-400">{taskToStart.deck_name || 'Deck'}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                  {taskToStart.contextual_type === 'multi' && (
                    <div>
                      <p>Choose where to start your multi-item task:</p>
                      <div className="mt-2 space-y-1 text-sm text-neutral-500">
                        {taskToStart.contextual_meta?.document_ids && taskToStart.contextual_meta.document_ids.length > 0 && (
                          <div>📄 {taskToStart.contextual_meta.document_ids.length} document(s)</div>
                        )}
                        {taskToStart.contextual_meta?.deck_ids && taskToStart.contextual_meta.deck_ids.length > 0 && (
                          <div>🎴 {taskToStart.contextual_meta.deck_ids.length} deck(s)</div>
                        )}
                      </div>
                    </div>
                  )}
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setTaskToStart(null);
                  }}
                  className="bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                
                {taskToStart.contextual_type === 'combo' ? (
                  // Combo tasks have buttons in the modal content, so just show Cancel
                  null
                ) : taskToStart.contextual_type === 'multi' ? (
                  <>
                    {(taskToStart.contextual_meta?.document_ids && taskToStart.contextual_meta.document_ids.length > 0) && (
                      <button
                        onClick={() => handleConfirmStartTask('document')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Go to Documents</span>
                      </button>
                    )}
                    {(taskToStart.contextual_meta?.deck_ids && taskToStart.contextual_meta.deck_ids.length > 0) && (
                      <button
                        onClick={() => handleConfirmStartTask('deck')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Go to Decks</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleConfirmStartTask(taskToStart.contextual_type === 'document' ? 'document' : 'deck')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 ${
                      taskToStart.contextual_type === 'document' ? 'bg-blue-600 hover:bg-blue-700' :
                      taskToStart.contextual_type === 'deck' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-neutral-600 hover:bg-neutral-700'
                    }`}
                  >
                    Yes, Go
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// TaskCard component (simplified version)
interface TaskCardProps {
  task: Task;
  onStartContextualTask: (task: Task) => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function TaskCard({ task, onStartContextualTask, onComplete, onDelete }: TaskCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    await onComplete(task.id);
    setIsCompleting(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await onDelete(task.id);
    }
  };

  const taskIcon = getTaskTypeIcon(task.task_type);
  const priorityColor = getPriorityColor(task.priority);

  return (
    <div
      className={`bg-white dark:bg-neutral-800 rounded-lg border transition-all duration-200 hover:shadow-sm group border-neutral-200 dark:border-neutral-700 ${
        isCompleting ? 'opacity-50 scale-95' : 'hover:scale-[1.01]'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${priorityColor}`}></div>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{task.title}</span>
            </div>
            {task.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{task.description}</p>
            )}
            <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center space-x-1">
                {taskIcon}
                <span>{task.task_type.replace('_', ' ')}</span>
              </span>
              {task.estimated_duration && (
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{task.estimated_duration}m</span>
                </span>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-1">
              {task.contextual_type && task.contextual_type !== 'generic' && (
                <button
                  onClick={() => onStartContextualTask(task)}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-200"
                  title="Start Task"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleComplete}
                className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200"
                title="Complete Task"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
