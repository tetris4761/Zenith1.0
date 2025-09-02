-- Tasks System Database Setup
-- This script creates the necessary tables for the tasks system

-- 1. Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL CHECK (task_type IN ('quick_task', 'study_session', 'recurring_plan')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Time management
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes (for completed tasks)
    
    -- Context linking
    linked_type TEXT CHECK (linked_type IN ('folder', 'document', 'deck', 'none')),
    linked_id UUID, -- references the linked item
    
    -- Recurring tasks
    recurring_pattern TEXT, -- 'daily', 'weekly', 'custom'
    recurring_days INTEGER[], -- array of day numbers (0=Sunday, 1=Monday, etc.)
    recurring_interval INTEGER DEFAULT 1, -- every N days/weeks
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create task_sessions table for study sessions
CREATE TABLE IF NOT EXISTS public.task_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in minutes
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    notes TEXT
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_linked ON public.tasks(linked_type, linked_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_task_sessions_task_id ON public.task_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_sessions_user_id ON public.task_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_sessions_started_at ON public.task_sessions(started_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_sessions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for task_sessions
CREATE POLICY "Users can view their own task sessions" ON public.task_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task sessions" ON public.task_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task sessions" ON public.task_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task sessions" ON public.task_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_tasks_updated_at();

-- 9. Create function to handle task completion
CREATE OR REPLACE FUNCTION complete_task(task_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.tasks 
    SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = task_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to get today's tasks
CREATE OR REPLACE FUNCTION get_todays_tasks()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    task_type TEXT,
    status TEXT,
    priority TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER,
    linked_type TEXT,
    linked_id UUID,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.task_type,
        t.status,
        t.priority,
        t.due_date,
        t.estimated_duration,
        t.linked_type,
        t.linked_id,
        t.tags,
        t.notes,
        t.created_at,
        t.updated_at
    FROM public.tasks t
    WHERE t.user_id = auth.uid()
    AND (
        t.due_date::date = CURRENT_DATE
        OR (t.due_date IS NULL AND t.status = 'pending')
        OR t.status = 'in_progress'
    )
    ORDER BY 
        CASE t.priority 
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        t.due_date ASC,
        t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Insert some sample data (optional - for testing)
-- Uncomment the following lines if you want sample data
/*
INSERT INTO public.tasks (user_id, title, description, task_type, priority, due_date, estimated_duration, linked_type, linked_id, tags)
VALUES 
    (auth.uid(), 'Review Biochemistry Notes', 'Go through chapter 5-7 notes', 'study_session', 'high', NOW() + INTERVAL '2 hours', 45, 'document', NULL, ARRAY['study', 'biochem']),
    (auth.uid(), 'Complete Problem Set 3', 'Math homework due tomorrow', 'quick_task', 'medium', NOW() + INTERVAL '1 day', 30, 'document', NULL, ARRAY['homework', 'math']),
    (auth.uid(), 'Flashcard Review Session', 'Review all cards in Chemistry deck', 'study_session', 'high', NOW() + INTERVAL '1 hour', 30, 'deck', NULL, ARRAY['flashcards', 'chemistry']);
*/

-- 12. Verify the setup
SELECT 'Tasks system setup completed successfully!' as status;
