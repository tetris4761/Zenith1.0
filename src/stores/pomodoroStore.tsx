import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getSupabaseClient } from '../lib/supabase';

export type PomodoroMode = 'work' | 'short-break' | 'long-break';

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export interface PomodoroSession {
  id: string;
  mode: PomodoroMode;
  isRunning: boolean;
  endAt: number | null;
  remaining: number;
  completedPomodoros: number;
  taskId?: string;
  documentId?: string;
  note?: string;
}

export interface PomodoroStats {
  totalFocusTime: number;
  currentStreak: number;
  longestStreak: number;
  sessionsCompleted: number;
}

export interface PomodoroState {
  session: PomodoroSession;
  settings: PomodoroSettings;
  stats: PomodoroStats;
  isLeader: boolean;
  
  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: PomodoroMode) => void;
  updateSettings: (newSettings: Partial<PomodoroSettings>) => void;
  bindToTask: (taskId: string) => void;
  bindToDocument: (documentId: string) => void;
  setNote: (note: string) => void;
  
  // Computed helpers
  getProgressPercentage: () => number;
  getModeColor: () => string;
  getModeIconName: () => string;
  getTimeLeft: () => number;
  
  // Internal actions
  _setLeader: (isLeader: boolean) => void;
  _updateSession: (session: PomodoroSession) => void;
  _updateStats: (stats: PomodoroStats) => void;
  _updateSettings: (settings: PomodoroSettings) => void;
}

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

const defaultSession: PomodoroSession = {
  id: '',
  mode: 'work',
  isRunning: false,
  endAt: null,
  remaining: 25 * 60,
  completedPomodoros: 0,
};

const defaultStats: PomodoroStats = {
  totalFocusTime: 0,
  currentStreak: 0,
  longestStreak: 0,
  sessionsCompleted: 0,
};

export const usePomodoroStore = create<PomodoroState>()(
  subscribeWithSelector((set, get) => ({
    session: defaultSession,
    settings: defaultSettings,
    stats: defaultStats,
    isLeader: false,

    startTimer: () => {
      const { session, settings } = get();
      const duration = session.mode === 'work' 
        ? settings.workDuration 
        : session.mode === 'short-break' 
        ? settings.shortBreakDuration 
        : settings.longBreakDuration;
      
      const endAt = Date.now() + (duration * 60 * 1000);
      
      set({
        session: {
          ...session,
          isRunning: true,
          endAt,
        }
      });
      
      // Save to localStorage
      localStorage.setItem('pomodoro-session', JSON.stringify({
        ...session,
        isRunning: true,
        endAt,
      }));
    },

    pauseTimer: () => {
      const { session } = get();
      const timeLeft = session.endAt ? Math.max(0, Math.floor((session.endAt - Date.now()) / 1000)) : session.remaining;
      
      set({
        session: {
          ...session,
          isRunning: false,
          endAt: null,
          remaining: timeLeft,
        }
      });
      
      // Save to localStorage
      localStorage.setItem('pomodoro-session', JSON.stringify({
        ...session,
        isRunning: false,
        endAt: null,
        remaining: timeLeft,
      }));
    },

    resetTimer: () => {
      const { session, settings } = get();
      const duration = session.mode === 'work' 
        ? settings.workDuration 
        : session.mode === 'short-break' 
        ? settings.shortBreakDuration 
        : settings.longBreakDuration;
      
      set({
        session: {
          ...session,
          isRunning: false,
          endAt: null,
          remaining: duration * 60,
        }
      });
      
      // Save to localStorage
      localStorage.setItem('pomodoro-session', JSON.stringify({
        ...session,
        isRunning: false,
        endAt: null,
        remaining: duration * 60,
      }));
    },

    switchMode: (mode: PomodoroMode) => {
      const { settings } = get();
      const duration = mode === 'work' 
        ? settings.workDuration 
        : mode === 'short-break' 
        ? settings.shortBreakDuration 
        : settings.longBreakDuration;
      
      set({
        session: {
          ...get().session,
          mode,
          isRunning: false,
          endAt: null,
          remaining: duration * 60,
        }
      });
      
      // Save to localStorage
      localStorage.setItem('pomodoro-session', JSON.stringify({
        ...get().session,
        mode,
        isRunning: false,
        endAt: null,
        remaining: duration * 60,
      }));
    },

    updateSettings: (newSettings: Partial<PomodoroSettings>) => {
      const updatedSettings = { ...get().settings, ...newSettings };
      set({ settings: updatedSettings });
      
      // Save to localStorage
      localStorage.setItem('pomodoro-settings', JSON.stringify(updatedSettings));
    },

    bindToTask: (taskId: string) => {
      const { session } = get();
      set({
        session: {
          ...session,
          taskId,
        }
      });
    },

    bindToDocument: (documentId: string) => {
      const { session } = get();
      set({
        session: {
          ...session,
          documentId,
        }
      });
    },

    setNote: (note: string) => {
      const { session } = get();
      set({
        session: {
          ...session,
          note,
        }
      });
    },

    getProgressPercentage: () => {
      const { session, settings } = get();
      const duration = session.mode === 'work' 
        ? settings.workDuration 
        : session.mode === 'short-break' 
        ? settings.shortBreakDuration 
        : settings.longBreakDuration;
      
      const totalSeconds = duration * 60;
      const remaining = session.isRunning && session.endAt 
        ? Math.max(0, Math.floor((session.endAt - Date.now()) / 1000))
        : session.remaining;
      
      return Math.max(0, Math.min(100, ((totalSeconds - remaining) / totalSeconds) * 100));
    },

    getModeColor: () => {
      const { session } = get();
      switch (session.mode) {
        case 'work':
          return 'text-red-600';
        case 'short-break':
          return 'text-green-600';
        case 'long-break':
          return 'text-blue-600';
        default:
          return 'text-neutral-600';
      }
    },

    getModeIconName: () => {
      const { session } = get();
      switch (session.mode) {
        case 'work':
          return 'Target';
        case 'short-break':
          return 'Coffee';
        case 'long-break':
          return 'Coffee';
        default:
          return 'Clock';
      }
    },

    getTimeLeft: () => {
      const { session } = get();
      return session.isRunning && session.endAt 
        ? Math.max(0, Math.floor((session.endAt - Date.now()) / 1000))
        : session.remaining;
    },

    // Internal actions
    _setLeader: (isLeader: boolean) => set({ isLeader }),
    _updateSession: (session: PomodoroSession) => set({ session }),
    _updateStats: (stats: PomodoroStats) => set({ stats }),
    _updateSettings: (settings: PomodoroSettings) => set({ settings }),
  }))
);

// Load settings from localStorage on initialization
if (typeof window !== 'undefined') {
  const storedSettings = localStorage.getItem('pomodoro-settings');
  if (storedSettings) {
    try {
      const settings = JSON.parse(storedSettings);
      usePomodoroStore.getState()._updateSettings(settings);
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }
  
  const storedSession = localStorage.getItem('pomodoro-session');
  if (storedSession) {
    try {
      const session = JSON.parse(storedSession);
      usePomodoroStore.getState()._updateSession(session);
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
    }
  }
}