import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  Calendar, 
  Archive, 
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  Check,
  Edit3,
  Trash2,
  Star,
  Zap,
  Target,
  RotateCcw
} from 'lucide-react';
import { 
  createTask, 
  getTodaysTasks, 
  updateTask, 
  deleteTask, 
  completeTask,
  startTaskSession,
  endTaskSession,
  getPriorityColor,
  getTaskTypeIcon,
  formatDuration,
  getTimeOfDay,
  groupTasksByTimeOfDay
} from '../lib/tasks';
import SRSSuggestions from '../components/tasks/SRSSuggestions';
import SmartSuggestions from '../components/tasks/SmartSuggestions';
import type { Task, CreateTaskForm } from '../types';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Form state
  const [newTask, setNewTask] = useState<CreateTaskForm>({
    title: '',
    description: '',
    task_type: 'quick_task',
    priority: 'medium',
    estimated_duration: 30,
    tags: []
  });

  useEffect(() => {
    loadTasks();
  }, []);

  // Update session duration every second when active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000 / 60);
        setSessionDuration(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, sessionStartTime]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await getTodaysTasks();
      
      if (error) {
        setError(error);
        return;
      }

      setTasks(data || []);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const { data, error } = await createTask(newTask);
      
      if (error) {
        setError(error);
        return;
      }

      // Add new task to the list with animation
      if (data) {
        setTasks(prev => [data, ...prev]);
        
        // Reset form
        setNewTask({
          title: '',
          description: '',
          task_type: 'quick_task',
          priority: 'medium',
          estimated_duration: 30,
          tags: []
        });
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

  const handleStartSession = async (taskId: string) => {
    try {
      const { data, error } = await startTaskSession(taskId);
      
      if (error) {
        setError(error);
        return;
      }

      setActiveSession(taskId);
      setSessionStartTime(new Date());
      setSessionDuration(0);
    } catch (err) {
      setError('Failed to start session');
    }
  };

  const handleEndSession = async (taskId: string) => {
    try {
      if (activeSession) {
        const { error } = await endTaskSession(activeSession, sessionDuration);
        
        if (error) {
          setError(error);
          return;
        }
      }

      setActiveSession(null);
      setSessionStartTime(null);
      setSessionDuration(0);
      
      // Complete the task
      await handleCompleteTask(taskId);
    } catch (err) {
      setError('Failed to end session');
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

  const groupedTasks = groupTasksByTimeOfDay(tasks);
  const currentTimeOfDay = getTimeOfDay();

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
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-neutral-200">
        <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-green-600" />
              <span>Tasks</span>
            </h3>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-105"
              title="New Task"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-neutral-600">
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
              { id: 'today', label: 'Today', icon: Calendar, active: true },
              { id: 'inbox', label: 'Inbox', icon: Archive },
              { id: 'upcoming', label: 'Upcoming', icon: Clock },
              { id: 'completed', label: 'Completed', icon: Check }
            ].map((item) => (
              <button
                key={item.id}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  item.active 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* SRS Suggestions */}
        <div className="p-3 border-t border-neutral-200">
          <SRSSuggestions onTaskCreated={loadTasks} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
                Today's Tasks
              </h1>
              <p className="text-neutral-600">
                {tasks.length} tasks planned • {currentTimeOfDay} focus time
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowQuickAdd(true)}
                className="btn-primary flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Quick Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Smart Suggestions Bar */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 p-4">
          <SmartSuggestions onTaskCreated={loadTasks} />
        </div>

        {/* Task Lists */}
        <div className="flex-1 p-6 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No tasks yet</h3>
              <p className="text-neutral-500 mb-4">
                Create your first task to get started with your day
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="btn-primary hover:scale-105 transition-transform duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Task
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Morning Tasks */}
              {groupedTasks.morning.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide flex items-center space-x-2">
                    <span>🌅</span>
                    <span>Morning (9:00 - 12:00)</span>
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.morning.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onStartSession={handleStartSession}
                        onEndSession={handleEndSession}
                        onDelete={handleDeleteTask}
                        isActive={activeSession === task.id}
                        sessionDuration={sessionDuration}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Afternoon Tasks */}
              {groupedTasks.afternoon.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide flex items-center space-x-2">
                    <span>☀️</span>
                    <span>Afternoon (12:00 - 17:00)</span>
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.afternoon.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onStartSession={handleStartSession}
                        onEndSession={handleEndSession}
                        onDelete={handleDeleteTask}
                        isActive={activeSession === task.id}
                        sessionDuration={sessionDuration}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Evening Tasks */}
              {groupedTasks.evening.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide flex items-center space-x-2">
                    <span>🌙</span>
                    <span>Evening (17:00 - 22:00)</span>
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.evening.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onStartSession={handleStartSession}
                        onEndSession={handleEndSession}
                        onDelete={handleDeleteTask}
                        isActive={activeSession === task.id}
                        sessionDuration={sessionDuration}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Time Tasks */}
              {groupedTasks.noTime.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide flex items-center space-x-2">
                    <span>📝</span>
                    <span>No Specific Time</span>
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.noTime.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onStartSession={handleStartSession}
                        onEndSession={handleEndSession}
                        onDelete={handleDeleteTask}
                        isActive={activeSession === task.id}
                        sessionDuration={sessionDuration}
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
                className="btn-primary hover:scale-105 transition-transform duration-200"
              >
                Add
              </button>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="btn-secondary"
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
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title.trim()}
                  className="btn-primary disabled:opacity-50 hover:scale-105 transition-transform duration-200"
                >
                  Create Task
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
  onStartSession: (taskId: string) => void;
  onEndSession: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  isActive: boolean;
  sessionDuration: number;
}

function TaskCard({ 
  task, 
  onComplete, 
  onStartSession, 
  onEndSession, 
  onDelete, 
  isActive, 
  sessionDuration 
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
      className={`bg-white rounded-lg border transition-all duration-300 hover:shadow-md group ${
        isActive ? 'border-green-300 bg-green-50 shadow-lg' : 'border-neutral-200'
      } ${isCompleting ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{taskIcon}</span>
              <h4 className="font-medium text-neutral-900">{task.title}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors}`}>
                {task.priority}
              </span>
            </div>
            
            {task.description && (
              <p className="text-sm text-neutral-600 mb-2">{task.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-xs text-neutral-500">
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

            {/* Active Session Timer */}
            {isActive && (
              <div className="mt-3 p-2 bg-green-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Session Active</span>
                  <span className="text-sm text-green-600">{formatDuration(sessionDuration)}</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-1 mt-2">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((sessionDuration / (task.estimated_duration || 30)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center space-x-1 transition-all duration-200 ${
            showActions || isActive ? 'opacity-100' : 'opacity-0'
          }`}>
            {task.task_type === 'study_session' && !isActive && (
              <button
                onClick={() => onStartSession(task.id)}
                className="p-2 hover:bg-green-100 rounded-lg text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-110"
                title="Start Session"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            
            {isActive && (
              <button
                onClick={() => onEndSession(task.id)}
                className="p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110"
                title="End Session"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            
            {!isActive && (
              <button
                onClick={handleComplete}
                className="p-2 hover:bg-green-100 rounded-lg text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-110"
                title="Complete Task"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}