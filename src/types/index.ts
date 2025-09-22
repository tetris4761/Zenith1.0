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

// Task Management System
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  task_type: 'quick_task' | 'study_session' | 'recurring_plan';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Time management
  due_date?: string;
  estimated_duration?: number; // in minutes
  actual_duration?: number; // in minutes
  
  // Context linking (legacy)
  linked_type?: 'folder' | 'document' | 'deck' | 'none';
  linked_id?: string;
  
  // NEW: Contextual task system
  contextual_type?: 'generic' | 'document' | 'deck' | 'combo' | 'multi';
  target_card_count?: number; // for deck-related tasks
  flow_steps?: Array<'doc' | 'create_cards' | 'review'>; // for combo tasks
  suggested_score?: number; // for ranking suggested tasks
  task_source?: 'manual' | 'suggested' | 'auto'; // how task was created
  contextual_meta?: Record<string, any>; // additional contextual data
  
  // Recurring tasks
  recurring_pattern?: 'daily' | 'weekly' | 'custom';
  recurring_days?: number[]; // array of day numbers (0=Sunday, 1=Monday, etc.)
  recurring_interval?: number; // every N days/weeks
  
  // Metadata
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Joined data (from contextual queries)
  document_title?: string;
  document_content?: string;
  deck_name?: string;
  deck_description?: string;
}

export interface TaskSession {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  duration?: number; // in minutes
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  notes?: string;
}

// NEW: Contextual Task Types
export type ContextualTaskType = 'generic' | 'document' | 'deck' | 'combo' | 'multi';
export type TaskSource = 'manual' | 'suggested' | 'auto';
export type FlowStep = 'doc' | 'create_cards' | 'review';

// NEW: Contextual Task Creation Form
export interface CreateContextualTaskForm {
  title?: string; // auto-generated if not provided
  description?: string;
  contextual_type: ContextualTaskType;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_duration?: number;
  
  // Context linking
  linked_type?: 'document' | 'deck' | 'none';
  linked_id?: string;
  
  // Contextual-specific fields
  target_card_count?: number; // for deck tasks
  flow_steps?: FlowStep[]; // for combo tasks
  suggested_score?: number;
  task_source?: TaskSource;
  contextual_meta?: Record<string, any>;
  
  // Metadata
  tags?: string[];
  notes?: string;
}

// NEW: Suggested Task (from SRS/Document analysis)
export interface SuggestedTask {
  id: string;
  title: string;
  contextual_type: ContextualTaskType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_duration?: number;
  linked_type?: 'document' | 'deck';
  linked_id?: string;
  target_card_count?: number;
  suggested_score: number;
  deck_name?: string;
  document_title?: string;
  reason: string; // why this task was suggested
}

// Legacy task management (keeping for backward compatibility)
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
  task_type: 'quick_task' | 'study_session' | 'recurring_plan';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_duration?: number;
  linked_type?: 'folder' | 'document' | 'deck' | 'none';
  linked_id?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateFlashcardForm {
  front: string;
  back: string;
  highlight_id?: string;
  deck_id?: string;
}

// Navigation
export type NavigationItem = 'dashboard' | 'documents' | 'flashcards' | 'tasks' | 'focus' | 'calendar' | 'analytics';

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
