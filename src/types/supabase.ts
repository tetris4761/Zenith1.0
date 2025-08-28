export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          avatar_url: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          avatar_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          avatar_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          content: string
          folder_id: string | null
          user_id: string
          created_at: string
          updated_at: string
          last_accessed: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          folder_id?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
          last_accessed?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          folder_id?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
          last_accessed?: string
        }
      }
      folders: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      highlights: {
        Row: {
          id: string
          document_id: string
          user_id: string
          text: string
          start_offset: number
          end_offset: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          text: string
          start_offset: number
          end_offset: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          text?: string
          start_offset?: number
          end_offset?: number
          note?: string | null
          created_at?: string
        }
      }
      flashcards: {
        Row: {
          id: string
          highlight_id: string
          user_id: string
          front: string
          back: string
          deck_id: string | null
          ease_factor: number
          interval: number
          repetitions: number
          next_review: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          highlight_id: string
          user_id: string
          front: string
          back: string
          deck_id?: string | null
          ease_factor?: number
          interval?: number
          repetitions?: number
          next_review?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          highlight_id?: string
          user_id?: string
          front?: string
          back?: string
          deck_id?: string | null
          ease_factor?: number
          interval?: number
          repetitions?: number
          next_review?: string
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          flashcard_id: string
          user_id: string
          quality: number
          review_time: string
          created_at: string
        }
        Insert: {
          id?: string
          flashcard_id: string
          user_id: string
          quality: number
          review_time?: string
          created_at?: string
        }
        Update: {
          id?: string
          flashcard_id?: string
          user_id?: string
          quality?: number
          review_time?: string
          created_at?: string
        }
      }
      decks: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      columns: {
        Row: {
          id: string
          name: string
          board_id: string
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          board_id: string
          order: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          board_id?: string
          order?: number
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          column_id: string
          user_id: string
          priority: string
          due_date: string | null
          highlight_id: string | null
          document_id: string | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          column_id: string
          user_id: string
          priority?: string
          due_date?: string | null
          highlight_id?: string | null
          document_id?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          column_id?: string
          user_id?: string
          priority?: string
          due_date?: string | null
          highlight_id?: string | null
          document_id?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      pomodoro_sessions: {
        Row: {
          id: string
          user_id: string
          duration: number
          completed: boolean
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          duration: number
          completed?: boolean
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          duration?: number
          completed?: boolean
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
      }
      pomodoro_settings: {
        Row: {
          id: string
          user_id: string
          work_duration: number
          short_break_duration: number
          long_break_duration: number
          long_break_interval: number
          auto_start_breaks: boolean
          auto_start_pomodoros: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          work_duration?: number
          short_break_duration?: number
          long_break_duration?: number
          long_break_interval?: number
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          work_duration?: number
          short_break_duration?: number
          long_break_duration?: number
          long_break_interval?: number
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
