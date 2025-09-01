-- Flashcard Folder System Database Setup for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create flashcard_folders table (similar to documents folders)
CREATE TABLE IF NOT EXISTS public.flashcard_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES public.flashcard_folders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Check and update decks table structure
-- First, check if parent_id column exists and handle it properly
DO $$ 
BEGIN
    -- Check if parent_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'decks' AND column_name = 'parent_id'
    ) THEN
        -- Drop the parent_id column if it exists
        ALTER TABLE public.decks DROP COLUMN parent_id;
    END IF;
    
    -- Check if folder_id column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'decks' AND column_name = 'folder_id'
    ) THEN
        -- Add folder_id column if it doesn't exist
        ALTER TABLE public.decks ADD COLUMN folder_id UUID REFERENCES public.flashcard_folders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcard_folders_user_id ON public.flashcard_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_folders_parent_id ON public.flashcard_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_decks_folder_id ON public.decks(folder_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.flashcard_folders ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for flashcard_folders
DROP POLICY IF EXISTS "Users can view their own flashcard folders" ON public.flashcard_folders;
CREATE POLICY "Users can view their own flashcard folders" ON public.flashcard_folders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own flashcard folders" ON public.flashcard_folders;
CREATE POLICY "Users can insert their own flashcard folders" ON public.flashcard_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own flashcard folders" ON public.flashcard_folders;
CREATE POLICY "Users can update their own flashcard folders" ON public.flashcard_folders
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own flashcard folders" ON public.flashcard_folders;
CREATE POLICY "Users can delete their own flashcard folders" ON public.flashcard_folders
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_flashcard_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_flashcard_folders_updated_at ON public.flashcard_folders;
CREATE TRIGGER update_flashcard_folders_updated_at BEFORE UPDATE ON public.flashcard_folders
    FOR EACH ROW EXECUTE FUNCTION update_flashcard_folders_updated_at();

-- 8. Verify the structure
-- This will show you the current table structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('decks', 'flashcard_folders')
ORDER BY table_name, ordinal_position;
