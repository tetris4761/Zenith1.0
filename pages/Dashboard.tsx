import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Target, 
  CheckCircle,
  TrendingUp,
  Play,
  ListTodo
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();

  // Mock data - in real app this would come from API
  const stats = {
    cardsDue: 27,
    focusTime: 25,
    activeTasks: [
      { id: 1, title: 'Write outline for essay', dueDate: 'Today' },
      { id: 2, title: 'Read Chapter 5', dueDate: 'Tomorrow' },
      { id: 3, title: 'Review notes for Biology', dueDate: 'Ouv' },
    ],
    streak: 5,
    streakProgress: 0.7,
  };

  const handleStartReview = () => {
    navigate('/review');
  };

  const handleStartTimer = () => {
    navigate('/focus');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900">Welcome back</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards Due Widget */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Cards Due</h3>
            <CheckCircle className="w-6 h-6 text-accent-600" />
          </div>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-neutral-900 mb-2">{stats.cardsDue}</div>
            <p className="text-neutral-600">flashcards due today</p>
          </div>
          <button
            onClick={handleStartReview}
            className="w-full btn-accent flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Start Review</span>
          </button>
        </div>

        {/* Focus Timer Widget */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Focus Timer</h3>
            <Clock className="w-6 h-6 text-primary-600" />
          </div>
          <div className="text-center mb-4">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - 0.75)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-neutral-900">{stats.focusTime}:00</span>
              </div>
            </div>
            <p className="text-neutral-600">Pomodoro session</p>
          </div>
          <button
            onClick={handleStartTimer}
            className="w-full btn-accent flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Start Timer</span>
          </button>
        </div>

        {/* Active Tasks Widget */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Active Tasks</h3>
            <ListTodo className="w-6 h-6 text-primary-600" />
          </div>
          <div className="space-y-3">
            {stats.activeTasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-3">
                <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{task.title}</p>
                  <p className="text-xs text-neutral-500">{task.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Widget */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Calendar</h3>
            <CalendarIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div className="text-center mb-4">
            <div className="flex items-center justify-between mb-3">
              <button className="p-1 hover:bg-neutral-100 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-medium">April 2024</span>
              <button className="p-1 hover:bg-neutral-100 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="p-1 text-neutral-500">{day}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => (
                <div
                  key={i + 1}
                  className={cn(
                    'p-1 rounded cursor-pointer',
                    i + 1 === 18 ? 'bg-primary-600 text-white' : 'hover:bg-neutral-100'
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="mt-3 text-left">
              <p className="text-sm font-medium text-neutral-900">3:00pm</p>
              <p className="text-sm text-neutral-600">Review History</p>
            </div>
          </div>
        </div>

        {/* Streak Widget */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Streak</h3>
            <TrendingUp className="w-6 h-6 text-accent-600" />
          </div>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-neutral-900 mb-2">{stats.streak} days</div>
            <p className="text-neutral-600">current study streak</p>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.streakProgress * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
