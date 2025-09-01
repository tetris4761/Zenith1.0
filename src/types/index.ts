// User and Authentication
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// Document Management
export interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  folder_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_accessed: string;
}

export interface Highlight {
  id: string;
  document_id: string;
  user_id: string;
  text: string;
  start_offset: number;
  end_offset: number;
  note?: string;
  created_at: string;
}

// Spaced Repetition System
export interface Flashcard {
  id: string;
  highlight_id: string;
  user_id: string;
  front: string;
  back: string;
  deck_id?: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  flashcard_id: string;
  user_id: string;
  quality: 1 | 2 | 3 | 4 | 5; // Again, Hard, Good, Easy, Perfect
  review_time: string;
  created_at: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  folder_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Task Management
export interface Board {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  name: string;
  board_id: string;
  order: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  column_id: string;
  user_id: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  highlight_id?: string;
  document_id?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// Focus Timer
export interface PomodoroSession {
  id: string;
  user_id: string;
  duration: number; // in minutes
  completed: boolean;
  started_at: string;
  ended_at?: string;
  created_at: string;
}

export interface PomodoroSettings {
  id: string;
  user_id: string;
  work_duration: number; // in minutes
  short_break_duration: number;
  long_break_duration: number;
  long_break_interval: number;
  auto_start_breaks: boolean;
  auto_start_pomodoros: boolean;
  created_at: string;
  updated_at: string;
}

// Analytics
export interface StudyStats {
  total_cards_reviewed: number;
  total_focus_time: number; // in minutes
  current_streak: number;
  longest_streak: number;
  cards_due_today: number;
  tasks_completed_today: number;
}

// API Responses
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  full_name: string;
}

export interface CreateDocumentForm {
  title: string;
  content: string;
  folder_id?: string;
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  column_id: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  highlight_id?: string;
}

export interface CreateFlashcardForm {
  front: string;
  back: string;
  highlight_id?: string;
  deck_id?: string;
}

// Navigation
export type NavigationItem = 'dashboard' | 'documents' | 'review' | 'tasks' | 'focus' | 'calendar' | 'analytics';

// Component Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

// Utility Types
export type WithId<T> = T & { id: string };
export type WithTimestamps<T> = T & { created_at: string; updated_at: string };
export type WithUserId<T> = T & { user_id: string };
