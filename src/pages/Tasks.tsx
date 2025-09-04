import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  Calendar, 
  Archive, 
  Search,
  Filter,
  MoreVertical, 
  Check,
  Edit3,
  Trash2,
  ExternalLink,
  FileText,
  BookOpen,
  Link
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
  getTaskTypeIcon,
  formatDuration,
  getTimeOfDay,
  groupTasksByTimeOfDay
} from '../lib/tasks';
import { getDocuments } from '../lib/documents';
import { getDecks } from '../lib/decks';
import UnifiedSuggestions from '../components/tasks/UnifiedSuggestions';
import type { Task, CreateTaskForm, FlowStep } from '../types';

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'inbox' | 'upcoming' | 'completed'>('today');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [taskToStart, setTaskToStart] = useState<Task | null>(null);
  
  // Form state
  const [newTask, setNewTask] = useState<CreateTaskForm>({
    title: '',
    description: '',
    task_type: 'quick_task',
    priority: 'medium',
    estimated_duration: 30,
    tags: []
  });

  // Contextual task state
  const [contextualType, setContextualType] = useState<'generic' | 'document' | 'deck' | 'combo'>('generic');
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [targetCardCount, setTargetCardCount] = useState<number>(20);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [availableDecks, setAvailableDecks] = useState<any[]>([]);

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  // Load available documents and decks when dialog opens
  useEffect(() => {
    if (showCreateDialog) {
      loadAvailableItems();
    }
  }, [showCreateDialog]);



  const loadAvailableItems = async () => {
    try {
      // Load documents
      const documentsResult = await getDocuments();
      if (documentsResult.data) {
        setAvailableDocuments(documentsResult.data);
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
      
      let result;
      switch (activeTab) {
        case 'today':
          result = await getTodaysTasks();
          break;
        case 'inbox':
          // Get pending tasks without due dates (inbox)
          result = await getTasks({ status: 'pending' });
          if (result.data) {
            result.data = result.data.filter(task => !task.due_date);
          }
          break;
        case 'upcoming':
          // Get pending tasks with future due dates
          result = await getTasks({ status: 'pending' });
          if (result.data) {
            const now = new Date();
            result.data = result.data.filter(task => 
              task.due_date && new Date(task.due_date) > now
            );
          }
          break;
        case 'completed':
          result = await getTasks({ status: 'completed' });
          if (result.data) {
            // Only show completed tasks from the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            result.data = result.data.filter(task => 
              task.completed_at && new Date(task.completed_at) >= sevenDaysAgo
            );
          }
          break;
        default:
          result = await getTodaysTasks();
      }
      
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

  const handleStartContextualTask = (task: Task) => {
    if (!task.contextual_type || task.contextual_type === 'generic') return;
    setTaskToStart(task);
    setShowConfirmDialog(true);
  };

  const handleConfirmStartTask = () => {
    if (!taskToStart) return;

    switch (taskToStart.contextual_type) {
      case 'document':
        if (taskToStart.linked_id) {
          navigate(`/documents?doc=${taskToStart.linked_id}`);
        }
        break;
      case 'deck':
        if (taskToStart.linked_id) {
          navigate(`/flashcards?deck=${taskToStart.linked_id}`);
        }
        break;
      case 'combo':
        if (taskToStart.linked_id) {
          // For combo tasks, start with the document first
          navigate(`/documents?doc=${taskToStart.linked_id}`);
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
          notes: newTask.notes
        };
        console.log('Creating contextual task with data:', contextualData);
        result = await createContextualTask(contextualData);
      }
      
      if (result.error) {
        console.error('Task creation error:', result.error);
        setError(result.error);
        return;
      }

      // Add new task to the list with animation
      if (result.data) {
        setTasks(prev => [result.data, ...prev]);
        
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
        setTargetCardCount(20);
        setShowCreateDialog(false);
        setShowQuickAdd(false);
        setQuickAddText('');
      }
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;

    const taskData: CreateTaskForm = {
      title: quickAddText.trim(),
      task_type: 'quick_task',
      priority: 'medium',
      estimated_duration: 15
    };

    try {
      const { data, error } = await createTask(taskData);
      
      if (error) {
        setError(error);
        return;
      }

      if (data) {
        setTasks(prev => [data, ...prev]);
        setQuickAddText('');
        setShowQuickAdd(false);
      }
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await completeTask(taskId);
      
      if (error) {
        setError(error);
        return;
      }

      // Update task in state with completion animation
    setTasks(prev => prev.map(task => 
      task.id === taskId 
          ? { ...task, status: 'completed' as const, completed_at: new Date().toISOString() }
        : task
    ));

      // Remove completed task after animation
      setTimeout(() => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }, 1000);
    } catch (err) {
      setError('Failed to complete task');
    }
  };



  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await deleteTask(taskId);
      
      if (error) {
        setError(error);
        return;
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleTabChange = (tabId: 'today' | 'inbox' | 'upcoming' | 'completed') => {
    setActiveTab(tabId);
  };

  const getTabInfo = () => {
    switch (activeTab) {
      case 'today':
        return { title: "Today's Tasks", subtitle: `${tasks.length} tasks planned • ${currentTimeOfDay} focus time` };
      case 'inbox':
        return { title: "Inbox", subtitle: `${tasks.length} unscheduled tasks` };
      case 'upcoming':
        return { title: "Upcoming Tasks", subtitle: `${tasks.length} future tasks` };
      case 'completed':
        return { title: "Completed Tasks", subtitle: `${tasks.length} completed in the last 7 days` };
      default:
        return { title: "Tasks", subtitle: "" };
    }
  };

  const groupedTasks = groupTasksByTimeOfDay(tasks);
  const currentTimeOfDay = getTimeOfDay();
  const tabInfo = getTabInfo();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-neutral-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-neutral-50">
      {/* Tasks Sidebar */}
      <div className="w-80 bg-white border-r border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-700 flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-neutral-600" />
              <span>Tasks</span>
            </h3>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-700 transition-all duration-200"
              title="New Task"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-neutral-500">
            <div className="flex items-center space-x-1">
              <CheckSquare className="w-3 h-3" />
              <span>{tasks.length} tasks</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{tasks.filter(t => t.status === 'in_progress').length} active</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-3">
          <nav className="space-y-1">
            {[
              { id: 'today' as const, label: 'Today', icon: Calendar },
              { id: 'inbox' as const, label: 'Inbox', icon: Archive },
              { id: 'upcoming' as const, label: 'Upcoming', icon: Clock },
              { id: 'completed' as const, label: 'Completed', icon: Check }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-neutral-100 text-neutral-900 border border-neutral-200' 
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 p-4">
      <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-medium text-neutral-900">
                  {tabInfo.title}
                </h1>
                <p className="text-sm text-neutral-500">
                  {tabInfo.subtitle}
                </p>
              </div>
              <div className="text-sm text-neutral-400">
                Hi, Anton 👋
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowQuickAdd(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Quick Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Unified Suggestions Bar */}
        <div className="bg-neutral-50 border-b border-neutral-200 p-4">
          <UnifiedSuggestions onTaskCreated={loadTasks} />
        </div>

        {/* Task Lists */}
        <div className="flex-1 p-6 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No tasks yet</h3>
              <p className="text-neutral-500 mb-4">
                Create your first task to get started with your day
              </p>
        <button
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:scale-105 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
                <span>Create First Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Morning Tasks */}
              {groupedTasks.morning.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-600 flex items-center space-x-2">
                    <span>🌅</span>
                    <span>Morning</span>
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.morning.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onStartContextualTask={handleStartContextualTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Afternoon Tasks */}
              {groupedTasks.afternoon.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-600 flex items-center space-x-2">
                    <span>☀️</span>
                    <span>Afternoon</span>
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.afternoon.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onStartContextualTask={handleStartContextualTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Evening Tasks */}
              {groupedTasks.evening.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-600 flex items-center space-x-2">
                    <span>🌙</span>
                    <span>Evening</span>
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.evening.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onStartContextualTask={handleStartContextualTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Time Tasks */}
              {groupedTasks.noTime.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-600 flex items-center space-x-2">
                    <span>📝</span>
                    <span>No Specific Time</span>
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.noTime.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onStartContextualTask={handleStartContextualTask}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Add Bar */}
        {showQuickAdd && (
          <div className="bg-white border-t border-neutral-200 p-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Type your task..."
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
                className="flex-1 input"
                autoFocus
              />
                            <button
                onClick={handleQuickAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-all duration-200"
              >
                Add
              </button>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              >
                Cancel
        </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-medium">Create New Task</h3>
              </div>
            
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Task Title *
                </label>
                <input
                  type="text"
                    placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="input w-full"
                    autoFocus
                />
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
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

              {/* NEW: Contextual Task Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                </select>
              </div>

              {/* Document Selection */}
              {contextualType === 'document' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Document
                  </label>
                  <select
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Choose a document...</option>
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Deck
                  </label>
                  <select
                    value={selectedDeck}
                    onChange={(e) => setSelectedDeck(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Choose a deck...</option>
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
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Select Document
                    </label>
                    <select
                      value={selectedDocument}
                      onChange={(e) => setSelectedDocument(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Choose a document...</option>
                      {availableDocuments.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          📄 {doc.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Select Deck
                    </label>
                    <select
                      value={selectedDeck}
                      onChange={(e) => setSelectedDeck(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Choose a deck...</option>
                      {availableDecks.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                          🎴 {deck.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Target Card Count for Deck/Combo tasks */}
              {(contextualType === 'deck' || contextualType === 'combo') && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Target Cards to Review
                  </label>
                  <input
                    type="number"
                    placeholder="20"
                    value={targetCardCount}
                    onChange={(e) => setTargetCardCount(parseInt(e.target.value) || 20)}
                    className="input w-full"
                    min="1"
                    max="100"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="Add more details..."
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="input w-full h-20 resize-none"
                  />
              </div>
            </div>
            
                            <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                {taskToStart.contextual_type === 'document' && <FileText className="w-5 h-5 text-blue-600" />}
                {taskToStart.contextual_type === 'deck' && <BookOpen className="w-5 h-5 text-purple-600" />}
                {taskToStart.contextual_type === 'combo' && <Link className="w-5 h-5 text-green-600" />}
                <h3 className="text-lg font-medium">Start Task</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-neutral-600">
                  {taskToStart.contextual_type === 'document' && (
                    <>Take me to <span className="font-medium text-blue-600">"{taskToStart.document_title || 'Document'}"</span> document?</>
                  )}
                  {taskToStart.contextual_type === 'deck' && (
                    <>Take me to <span className="font-medium text-purple-600">"{taskToStart.deck_name || 'Deck'}"</span> deck?</>
                  )}
                  {taskToStart.contextual_type === 'combo' && (
                    <>Start the study flow: <span className="font-medium text-green-600">"{taskToStart.document_title || 'Document'}"</span> → <span className="font-medium text-green-600">"{taskToStart.deck_name || 'Deck'}"</span>?</>
                  )}
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setTaskToStart(null);
                  }}
                  className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStartTask}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 ${
                    taskToStart.contextual_type === 'document' ? 'bg-blue-600 hover:bg-blue-700' :
                    taskToStart.contextual_type === 'deck' ? 'bg-purple-600 hover:bg-purple-700' :
                    taskToStart.contextual_type === 'combo' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-neutral-600 hover:bg-neutral-700'
                  }`}
                >
                  Yes, Go
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
            </div>
  );
}

// Task Card Component with Micro Animations
interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onStartContextualTask: (task: Task) => void;
}

function TaskCard({ 
  task, 
  onComplete, 
  onDelete, 
  onStartContextualTask
}: TaskCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    await onComplete(task.id);
  };

  const priorityColors = getPriorityColor(task.priority);
  const taskIcon = getTaskTypeIcon(task.task_type);

  return (
    <div
      className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-sm group border-neutral-200 ${
        isCompleting ? 'opacity-50 scale-95' : 'hover:scale-[1.01]'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-3">
                  <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm">{taskIcon}</span>
              <h4 className="font-medium text-neutral-900 text-sm">{task.title}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                        {task.priority}
                      </span>
            </div>

            {/* Contextual Indicators */}
            {(task.contextual_type && task.contextual_type !== 'generic') && (
              <div className="flex items-center space-x-2 mb-2">
                {task.contextual_type === 'document' && (
                  <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    <span>📄</span>
                    <span>{task.document_title || 'Document'}</span>
                  </div>
                )}
                {task.contextual_type === 'deck' && (
                  <div className="flex items-center space-x-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    <span>🎴</span>
                    <span>{task.deck_name || 'Deck'}</span>
                    {task.target_card_count && (
                      <span className="text-purple-500">({task.target_card_count} cards)</span>
                    )}
                  </div>
                )}
                {task.contextual_type === 'combo' && (
                  <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    <span>🔗</span>
                    <span>Study → Review</span>
                    {task.document_title && (
                      <span className="text-green-500">• {task.document_title}</span>
                    )}
                    {task.deck_name && (
                      <span className="text-green-500">• {task.deck_name}</span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-3 text-xs text-neutral-500">
              {task.estimated_duration && (
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(task.estimated_duration)}</span>
                </span>
              )}
              {task.due_date && (
                <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                  <span>{new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                      )}
                    </div>


            </div>

          {/* Action Buttons */}
          <div className={`flex items-center space-x-1 transition-all duration-200 ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Start Button for Contextual Tasks */}
            {task.contextual_type && task.contextual_type !== 'generic' && (
              <button
                onClick={() => onStartContextualTask(task)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  task.contextual_type === 'document' ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' :
                  task.contextual_type === 'deck' ? 'bg-purple-100 hover:bg-purple-200 text-purple-700' :
                  task.contextual_type === 'combo' ? 'bg-green-100 hover:bg-green-200 text-green-700' :
                  'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
                title="Start Task"
              >
                <div className="flex items-center space-x-1">
                  {task.contextual_type === 'document' && <FileText className="w-3 h-3" />}
                  {task.contextual_type === 'deck' && <BookOpen className="w-3 h-3" />}
                  {task.contextual_type === 'combo' && <Link className="w-3 h-3" />}
                  <span>Start Task</span>
                </div>
              </button>
            )}
            
            <button
              onClick={handleComplete}
              className="p-1.5 hover:bg-green-100 rounded text-green-600 hover:text-green-700 transition-all duration-200"
              title="Complete Task"
            >
              <Check className="w-3 h-3" />
            </button>
            
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 hover:bg-red-100 rounded text-red-600 hover:text-red-700 transition-all duration-200"
              title="Delete Task"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}