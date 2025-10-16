import React, { useState } from 'react';
import { Play, Pause, RotateCcw, ExternalLink, Target, Coffee, Clock } from 'lucide-react';
import { usePomodoroStore } from '../stores/pomodoroStore';
import { formatTime } from '../lib/utils';
import { cn } from '../lib/utils';

export function PomodoroMiniControl() {
  const {
    session,
    getTimeLeft,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    getProgressPercentage,
    getModeColor,
    getModeIconName,
  } = usePomodoroStore();

  const [showModeSelector, setShowModeSelector] = useState(false);

  const renderModeIcon = () => {
    const iconName = getModeIconName();
    switch (iconName) {
      case 'Target':
        return <Target className="w-4 h-4" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4" />;
      case 'Clock':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getModeLabel = () => {
    switch (session.mode) {
      case 'work':
        return 'Work';
      case 'short-break':
        return 'Break';
      case 'long-break':
        return 'Long Break';
      default:
        return 'Timer';
    }
  };

  const handlePopOut = () => {
    const popup = window.open(
      '/focus-popup',
      'PomodoroTimer',
      'width=300,height=150,resizable=yes,scrollbars=no'
    );
    if (!popup) {
      alert('Popup blocked. Please allow popups for this site.');
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Mode indicator with progress ring */}
      <div className="relative">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-200 flex items-center justify-center">
          <div className={cn('w-4 h-4', getModeColor())}>
            {renderModeIcon()}
          </div>
        </div>
        {session.isRunning && (
          <div className="absolute inset-0 rounded-full border-2 border-transparent"
               style={{
                 background: `conic-gradient(from 0deg, #3b82f6 0%, #3b82f6 ${getProgressPercentage()}%, transparent ${getProgressPercentage()}%)`,
                 mask: 'radial-gradient(circle, transparent 60%, black 60%)',
                 WebkitMask: 'radial-gradient(circle, transparent 60%, black 60%)',
               }}
          />
        )}
      </div>

      {/* Time display */}
      <div className="text-center">
        <div className="text-lg font-mono font-semibold text-neutral-900">
          {Math.floor(getTimeLeft() / 60)}:{(getTimeLeft() % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-neutral-500">{getModeLabel()}</div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-1">
        {!session.isRunning ? (
          <button
            onClick={startTimer}
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
            title="Start timer"
          >
            <Play className="w-4 h-4 text-green-600" />
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
            title="Pause timer"
          >
            <Pause className="w-4 h-4 text-orange-600" />
          </button>
        )}
        
        <button
          onClick={resetTimer}
          className="p-1 rounded hover:bg-neutral-100 transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4 text-neutral-600" />
        </button>

        {/* Mode selector */}
        <div className="relative">
          <button
            onClick={() => setShowModeSelector(!showModeSelector)}
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
            title="Switch mode"
          >
            <div className={cn('w-4 h-4', getModeColor())}>
              {renderModeIcon()}
            </div>
          </button>
          
          {showModeSelector && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  switchMode('work');
                  setShowModeSelector(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-lg',
                  session.mode === 'work' ? 'bg-red-50 text-red-700' : 'text-neutral-700'
                )}
              >
                <Target className="w-4 h-4 inline mr-2" />
                Work
              </button>
              <button
                onClick={() => {
                  switchMode('short-break');
                  setShowModeSelector(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-neutral-50',
                  session.mode === 'short-break' ? 'bg-green-50 text-green-700' : 'text-neutral-700'
                )}
              >
                <Coffee className="w-4 h-4 inline mr-2" />
                Short Break
              </button>
              <button
                onClick={() => {
                  switchMode('long-break');
                  setShowModeSelector(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 last:rounded-b-lg',
                  session.mode === 'long-break' ? 'bg-blue-50 text-blue-700' : 'text-neutral-700'
                )}
              >
                <Coffee className="w-4 h-4 inline mr-2" />
                Long Break
              </button>
            </div>
          )}
        </div>

        {/* Pop out button (placeholder for Phase 3) */}
        <button
          onClick={handlePopOut}
          className="p-1 rounded hover:bg-neutral-100 transition-colors"
          title="Pop out timer"
        >
          <ExternalLink className="w-4 h-4 text-neutral-600" />
        </button>
      </div>
    </div>
  );
}