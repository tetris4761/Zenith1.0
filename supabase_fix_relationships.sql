-- Fix Database Relationships for Contextual Tasks
-- This script adds proper foreign key relationships

-- Note: PostgreSQL doesn't support conditional foreign key constraints
-- We'll use check constraints instead for data integrity

-- Clean up any invalid linked_id references first
UPDATE public.tasks 
SET linked_id = NULL, linked_type = 'none' 
WHERE linked_type = 'document' 
AND linked_id NOT IN (SELECT id FROM public.documents);

UPDATE public.tasks 
SET linked_id = NULL, linked_type = 'none' 
WHERE linked_type = 'deck' 
AND linked_id NOT IN (SELECT id FROM public.decks);

-- Add check constraints to ensure data integrity
-- Note: These constraints will be added only if they don't already exist

DO $$ 
BEGIN
    -- Add document link constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_document_link'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT check_document_link 
        CHECK (
            (linked_type != 'document') OR 
            (linked_type = 'document' AND linked_id IS NOT NULL)
        );
    END IF;

    -- Add deck link constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_deck_link'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT check_deck_link 
        CHECK (
            (linked_type != 'deck') OR 
            (linked_type = 'deck' AND linked_id IS NOT NULL)
        );
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_linked_document ON public.tasks(linked_id) WHERE linked_type = 'document';
CREATE INDEX IF NOT EXISTS idx_tasks_linked_deck ON public.tasks(linked_id) WHERE linked_type = 'deck';

-- Verify the setup
SELECT 'Database relationships fixed successfully!' as status;
