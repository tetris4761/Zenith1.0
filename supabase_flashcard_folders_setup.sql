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

-- 2. Update decks table to reference folders instead of parent_id
ALTER TABLE public.decks DROP COLUMN IF EXISTS parent_id;
ALTER TABLE public.decks ADD COLUMN folder_id UUID REFERENCES public.flashcard_folders(id) ON DELETE CASCADE;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcard_folders_user_id ON public.flashcard_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_folders_parent_id ON public.flashcard_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_decks_folder_id ON public.decks(folder_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.flashcard_folders ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for flashcard_folders
CREATE POLICY "Users can view their own flashcard folders" ON public.flashcard_folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcard folders" ON public.flashcard_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcard folders" ON public.flashcard_folders
    FOR UPDATE USING (auth.uid() = user_id);

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
CREATE TRIGGER update_flashcard_folders_updated_at BEFORE UPDATE ON public.flashcard_folders
    FOR EACH ROW EXECUTE FUNCTION update_flashcard_folders_updated_at();

-- 8. Insert some default folders for testing (optional)
-- Uncomment these lines if you want default folders

/*
INSERT INTO public.flashcard_folders (name, user_id) VALUES
('Study', 'YOUR_USER_ID_HERE'),
('Work', 'YOUR_USER_ID_HERE'),
('Personal', 'YOUR_USER_ID_HERE');

INSERT INTO public.flashcard_folders (name, parent_id, user_id) VALUES
('Language', (SELECT id FROM public.flashcard_folders WHERE name = 'Study'), 'YOUR_USER_ID_HERE'),
('Science', (SELECT id FROM public.flashcard_folders WHERE name = 'Study'), 'YOUR_USER_ID_HERE');
*/
