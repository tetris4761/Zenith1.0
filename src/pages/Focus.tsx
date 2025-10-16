import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings,
  Clock,
  Target,
  Coffee,
  TrendingUp
} from 'lucide-react';
import { formatTime } from '../lib/utils';
import { cn } from '../lib/utils';
import { usePomodoroStore } from '../stores/pomodoroStore';

export default function Focus() {
  const {
    session,
    settings,
    stats,
    getTimeLeft,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    updateSettings,
    getProgressPercentage,
    getModeColor,
    getModeIconName,
  } = usePomodoroStore();

  const [showSettings, setShowSettings] = useState(false);

  const getModeLabel = () => {
    switch (session.mode) {
      case 'work':
        return 'Focus Time';
      case 'short-break':
        return 'Short Break';
      case 'long-break':
        return 'Long Break';
      default:
        return 'Timer';
    }
  };

  const renderModeIcon = () => {
    const iconName = getModeIconName();
    switch (iconName) {
      case 'Target':
        return <Target className="w-6 h-6" />;
      case 'Coffee':
        return <Coffee className="w-6 h-6" />;
      case 'Clock':
        return <Clock className="w-6 h-6" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Focus Timer</h1>
        <p className="text-neutral-600">Stay focused and productive with the Pomodoro technique</p>
      </div>

      {/* Timer Display */}
      <div className="card max-w-md mx-auto">
        <div className="text-center">
          {/* Mode Indicator */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className={getModeColor()}>
              {renderModeIcon()}
            </div>
            <span className="text-lg font-medium text-neutral-900">
              {getModeLabel()}
            </span>
          </div>

          {/* Timer Circle */}
          <div className="relative w-64 h-64 mx-auto mb-8">
            <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
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
                stroke={session.mode === 'work' ? '#ef4444' : session.mode === 'short-break' ? '#22c55e' : '#3b82f6'}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-neutral-900">
                {Math.floor(getTimeLeft() / 60)}:{(getTimeLeft() % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-neutral-500 mt-2">
                {Math.floor(getProgressPercentage())}% complete
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {!session.isRunning ? (
              <button
                onClick={startTimer}
                className="btn-accent flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="btn-secondary flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}
            
            <button
              onClick={resetTimer}
              className="btn-secondary flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex space-x-2">
            <button
              onClick={() => switchMode('work')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                session.mode === 'work'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              Work
            </button>
            <button
              onClick={() => switchMode('short-break')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                session.mode === 'short-break'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              Short Break
            </button>
            <button
              onClick={() => switchMode('long-break')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                session.mode === 'long-break'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              Long Break
            </button>
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-neutral-900 mb-2">{session.completedPomodoros}</div>
          <div className="text-sm text-neutral-600">Pomodoros Completed</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-neutral-900 mb-2">
            {formatTime(stats.totalFocusTime)}
          </div>
          <div className="text-sm text-neutral-600">Total Focus Time</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-neutral-900 mb-2">{stats.currentStreak}</div>
          <div className="text-sm text-neutral-600">Current Streak</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-neutral-900 mb-2">{stats.longestStreak}</div>
          <div className="text-sm text-neutral-600">Longest Streak</div>
        </div>
      </div>

      {/* Settings Button */}
      <div className="text-center">
        <button
          onClick={() => setShowSettings(true)}
          className="btn-secondary flex items-center space-x-2 mx-auto"
        >
          <Settings className="w-4 h-4" />
          <span>Timer Settings</span>
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Timer Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Work Duration (minutes)
                </label>
                <input
                  type="number"
                  value={settings.workDuration}
                  onChange={(e) => updateSettings({ workDuration: parseInt(e.target.value) || 25 })}
                  className="input"
                  min="1"
                  max="60"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Short Break Duration (minutes)
                </label>
                <input
                  type="number"
                  value={settings.shortBreakDuration}
                  onChange={(e) => updateSettings({ shortBreakDuration: parseInt(e.target.value) || 5 })}
                  className="input"
                  min="1"
                  max="30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Long Break Duration (minutes)
                </label>
                <input
                  type="number"
                  value={settings.longBreakDuration}
                  onChange={(e) => updateSettings({ longBreakDuration: parseInt(e.target.value) || 15 })}
                  className="input"
                  min="1"
                  max="60"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Long Break Interval
                </label>
                <input
                  type="number"
                  value={settings.longBreakInterval}
                  onChange={(e) => updateSettings({ longBreakInterval: parseInt(e.target.value) || 4 })}
                  className="input"
                  min="1"
                  max="10"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoStartBreaks"
                  checked={settings.autoStartBreaks}
                  onChange={(e) => updateSettings({ autoStartBreaks: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="autoStartBreaks" className="text-sm text-neutral-700">
                  Auto-start breaks
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoStartPomodoros"
                  checked={settings.autoStartPomodoros}
                  onChange={(e) => updateSettings({ autoStartPomodoros: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="autoStartPomodoros" className="text-sm text-neutral-700">
                  Auto-start pomodoros
                </label>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full btn-primary"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}