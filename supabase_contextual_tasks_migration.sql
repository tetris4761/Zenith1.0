-- Contextual Tasks Migration - Phase 1.1
-- This migration extends the existing tasks system to support contextual linking
-- WITHOUT breaking any existing functionality

-- 1. Add new columns to existing tasks table
-- These columns will be NULL for existing tasks, maintaining backward compatibility

-- Add contextual task type (different from existing task_type)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS contextual_type TEXT DEFAULT 'generic' 
    CHECK (contextual_type IN ('generic', 'document', 'deck', 'combo'));

-- Add target card count for deck-related tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS target_card_count INTEGER;

-- Add flow steps for combo tasks (JSON array of steps)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS flow_steps JSONB;

-- Add suggestion score for ranking suggested tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS suggested_score NUMERIC;

-- Add task source to track how tasks were created
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_source TEXT DEFAULT 'manual' 
    CHECK (task_source IN ('manual', 'suggested', 'auto'));

-- Add metadata for additional contextual information
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS contextual_meta JSONB;

-- 2. Create indexes for new columns for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_contextual_type ON public.tasks(contextual_type);
CREATE INDEX IF NOT EXISTS idx_tasks_task_source ON public.tasks(task_source);
CREATE INDEX IF NOT EXISTS idx_tasks_suggested_score ON public.tasks(suggested_score);

-- 3. Update existing tasks to have proper contextual_type
-- All existing tasks will be 'generic' by default
UPDATE public.tasks 
SET contextual_type = 'generic' 
WHERE contextual_type IS NULL;

-- 4. Create function to get contextual tasks with document/deck information
CREATE OR REPLACE FUNCTION get_contextual_tasks(
    p_contextual_type TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    task_type TEXT,
    contextual_type TEXT,
    status TEXT,
    priority TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER,
    linked_type TEXT,
    linked_id UUID,
    target_card_count INTEGER,
    flow_steps JSONB,
    suggested_score NUMERIC,
    task_source TEXT,
    contextual_meta JSONB,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    -- Joined document information
    document_title TEXT,
    document_content TEXT,
    -- Joined deck information  
    deck_name TEXT,
    deck_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.task_type,
        t.contextual_type,
        t.status,
        t.priority,
        t.due_date,
        t.estimated_duration,
        t.linked_type,
        t.linked_id,
        t.target_card_count,
        t.flow_steps,
        t.suggested_score,
        t.task_source,
        t.contextual_meta,
        t.tags,
        t.notes,
        t.created_at,
        t.updated_at,
        -- Document information
        d.title as document_title,
        d.content as document_content,
        -- Deck information
        deck.name as deck_name,
        deck.description as deck_description
    FROM public.tasks t
    LEFT JOIN public.documents d ON (t.linked_type = 'document' AND t.linked_id = d.id)
    LEFT JOIN public.decks deck ON (t.linked_type = 'deck' AND t.linked_id = deck.id)
    WHERE t.user_id = auth.uid()
    AND (p_contextual_type IS NULL OR t.contextual_type = p_contextual_type)
    AND (p_status IS NULL OR t.status = p_status)
    ORDER BY 
        COALESCE(t.suggested_score, 0) DESC,
        CASE t.priority 
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        t.due_date ASC,
        t.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to create contextual tasks
CREATE OR REPLACE FUNCTION create_contextual_task(
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_contextual_type TEXT DEFAULT 'generic',
    p_priority TEXT DEFAULT 'medium',
    p_due_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_estimated_duration INTEGER DEFAULT NULL,
    p_linked_type TEXT DEFAULT 'none',
    p_linked_id UUID DEFAULT NULL,
    p_target_card_count INTEGER DEFAULT NULL,
    p_flow_steps JSONB DEFAULT NULL,
    p_suggested_score NUMERIC DEFAULT NULL,
    p_task_source TEXT DEFAULT 'manual',
    p_contextual_meta JSONB DEFAULT NULL,
    p_tags TEXT[] DEFAULT '{}',
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_task_id UUID;
    task_type_value TEXT;
BEGIN
    -- Determine task_type based on contextual_type
    CASE p_contextual_type
        WHEN 'document' THEN task_type_value := 'study_session';
        WHEN 'deck' THEN task_type_value := 'study_session';
        WHEN 'combo' THEN task_type_value := 'study_session';
        ELSE task_type_value := 'quick_task';
    END CASE;

    -- Insert the new task
    INSERT INTO public.tasks (
        user_id,
        title,
        description,
        task_type,
        contextual_type,
        status,
        priority,
        due_date,
        estimated_duration,
        linked_type,
        linked_id,
        target_card_count,
        flow_steps,
        suggested_score,
        task_source,
        contextual_meta,
        tags,
        notes
    ) VALUES (
        auth.uid(),
        p_title,
        p_description,
        task_type_value,
        p_contextual_type,
        'pending',
        p_priority,
        p_due_date,
        p_estimated_duration,
        p_linked_type,
        p_linked_id,
        p_target_card_count,
        p_flow_steps,
        p_suggested_score,
        p_task_source,
        p_contextual_meta,
        p_tags,
        p_notes
    ) RETURNING id INTO new_task_id;

    RETURN new_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to get suggested tasks based on SRS data
CREATE OR REPLACE FUNCTION get_suggested_tasks()
RETURNS TABLE (
    id UUID,
    title TEXT,
    contextual_type TEXT,
    priority TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER,
    linked_type TEXT,
    linked_id UUID,
    target_card_count INTEGER,
    suggested_score NUMERIC,
    deck_name TEXT,
    document_title TEXT,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Deck suggestions based on overdue cards
    SELECT 
        gen_random_uuid() as id,
        'Review ' || d.name || ' (' || COUNT(f.id) || ' cards)' as title,
        'deck'::TEXT as contextual_type,
        CASE 
            WHEN COUNT(f.id) > 20 THEN 'high'::TEXT
            WHEN COUNT(f.id) > 10 THEN 'medium'::TEXT
            ELSE 'low'::TEXT
        END as priority,
        NOW() as due_date,
        GREATEST(15, COUNT(f.id) * 2) as estimated_duration,
        'deck'::TEXT as linked_type,
        d.id as linked_id,
        LEAST(COUNT(f.id), 20) as target_card_count,
        COUNT(f.id)::NUMERIC as suggested_score,
        d.name as deck_name,
        NULL::TEXT as document_title,
        'Overdue cards: ' || COUNT(f.id) as reason
    FROM public.decks d
    JOIN public.flashcards f ON f.deck_id = d.id
    WHERE d.user_id = auth.uid()
    AND f.next_review <= NOW()
    AND NOT EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.linked_type = 'deck' 
        AND t.linked_id = d.id 
        AND t.status IN ('pending', 'in_progress')
        AND t.due_date::date = CURRENT_DATE
    )
    GROUP BY d.id, d.name
    HAVING COUNT(f.id) > 0
    
    UNION ALL
    
    -- Document suggestions based on recent edits
    SELECT 
        gen_random_uuid() as id,
        'Study ' || d.title as title,
        'document'::TEXT as contextual_type,
        'medium'::TEXT as priority,
        NOW() as due_date,
        25 as estimated_duration,
        'document'::TEXT as linked_type,
        d.id as linked_id,
        NULL::INTEGER as target_card_count,
        EXTRACT(EPOCH FROM (NOW() - d.updated_at)) / 3600 as suggested_score,
        NULL::TEXT as deck_name,
        d.title as document_title,
        'Last edited ' || EXTRACT(EPOCH FROM (NOW() - d.updated_at)) / 3600 || ' hours ago' as reason
    FROM public.documents d
    WHERE d.user_id = auth.uid()
    AND d.updated_at > NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.linked_type = 'document' 
        AND t.linked_id = d.id 
        AND t.status IN ('pending', 'in_progress')
        AND t.due_date::date = CURRENT_DATE
    )
    ORDER BY suggested_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Drop and recreate the existing get_todays_tasks function to include new columns
DROP FUNCTION IF EXISTS get_todays_tasks();

CREATE OR REPLACE FUNCTION get_todays_tasks()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    task_type TEXT,
    contextual_type TEXT,
    status TEXT,
    priority TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER,
    linked_type TEXT,
    linked_id UUID,
    target_card_count INTEGER,
    flow_steps JSONB,
    suggested_score NUMERIC,
    task_source TEXT,
    contextual_meta JSONB,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    document_title TEXT,
    deck_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.task_type,
        t.contextual_type,
        t.status,
        t.priority,
        t.due_date,
        t.estimated_duration,
        t.linked_type,
        t.linked_id,
        t.target_card_count,
        t.flow_steps,
        t.suggested_score,
        t.task_source,
        t.contextual_meta,
        t.tags,
        t.notes,
        t.created_at,
        t.updated_at,
        d.title as document_title,
        deck.name as deck_name
    FROM public.tasks t
    LEFT JOIN public.documents d ON (t.linked_type = 'document' AND t.linked_id = d.id)
    LEFT JOIN public.decks deck ON (t.linked_type = 'deck' AND t.linked_id = deck.id)
    WHERE t.user_id = auth.uid()
    AND (
        t.due_date::date = CURRENT_DATE
        OR (t.due_date IS NULL AND t.status = 'pending')
        OR t.status = 'in_progress'
    )
    ORDER BY 
        COALESCE(t.suggested_score, 0) DESC,
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

-- 8. Verify the migration
SELECT 'Contextual tasks migration completed successfully!' as status;

-- 9. Show current task count and new column info
SELECT 
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN contextual_type = 'generic' THEN 1 END) as generic_tasks,
    COUNT(CASE WHEN contextual_type IS NOT NULL THEN 1 END) as contextual_tasks
FROM public.tasks;
