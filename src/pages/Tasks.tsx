import React, { useState } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Calendar,
  FileText,
  Flag,
  Clock
} from 'lucide-react';
import { cn, getPriorityColor, formatDate } from '../lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  columnId: string;
  order: number;
}

interface Column {
  id: string;
  name: string;
  color: string;
}

const columns: Column[] = [
  { id: 'todo', name: 'To Do', color: 'bg-neutral-100' },
  { id: 'in-progress', name: 'In Progress', color: 'bg-blue-100' },
  { id: 'done', name: 'Done', color: 'bg-green-100' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Write essay outline',
      description: 'Create a detailed outline for the literature essay',
      priority: 'high',
      dueDate: '2024-04-20',
      columnId: 'todo',
      order: 0,
    },
    {
      id: '2',
      title: 'Read Chapter 5',
      description: 'Complete reading assignment for Biology',
      priority: 'medium',
      dueDate: '2024-04-22',
      columnId: 'in-progress',
      order: 0,
    },
    {
      id: '3',
      title: 'Review math problems',
      description: 'Go through calculus practice problems',
      priority: 'low',
      dueDate: '2024-04-25',
      columnId: 'done',
      order: 0,
    },
  ]);

  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    columnId: 'todo',
  });

  const handleCreateTask = () => {
    if (newTask.title.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
        columnId: newTask.columnId,
        order: tasks.filter(t => t.columnId === newTask.columnId).length,
      };
      
      setTasks(prev => [...prev, task]);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        columnId: 'todo',
      });
      setShowNewTask(false);
    }
  };

  const handleMoveTask = (taskId: string, newColumnId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, columnId: newColumnId, order: tasks.filter(t => t.columnId === newColumnId).length }
        : task
    ));
  };

  const getTasksForColumn = (columnId: string) => {
    return tasks
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Tasks</h1>
        <button
          onClick={() => setShowNewTask(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  rows={3}
                  placeholder="Task description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowNewTask(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="btn-primary flex-1"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className={cn("p-4 rounded-lg", column.color)}>
              <h3 className="font-semibold text-neutral-900">{column.name}</h3>
              <p className="text-sm text-neutral-600">
                {getTasksForColumn(column.id).length} tasks
              </p>
            </div>
            
            <div className="space-y-3">
              {getTasksForColumn(column.id).map((task) => (
                <div
                  key={task.id}
                  className="card cursor-move hover:shadow-md transition-shadow duration-200"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', task.id);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData('text/plain');
                    if (taskId !== task.id) {
                      handleMoveTask(taskId, column.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-neutral-900">{task.title}</h4>
                    <button className="p-1 hover:bg-neutral-100 rounded">
                      <MoreVertical className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-neutral-600 mb-3">{task.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full border",
                        getPriorityColor(task.priority)
                      )}>
                        {task.priority}
                      </span>
                      
                      {task.dueDate && (
                        <div className="flex items-center space-x-1 text-xs text-neutral-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Drop Zone */}
              <div
                className="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center text-neutral-500 hover:border-neutral-400 transition-colors duration-200"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('text/plain');
                  handleMoveTask(taskId, column.id);
                }}
              >
                Drop task here
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
