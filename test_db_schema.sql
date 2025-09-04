-- Test script to check if the new contextual task columns exist
-- Run this in Supabase SQL Editor to verify the migration worked

-- Check if new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
AND column_name IN ('contextual_type', 'target_card_count', 'flow_steps', 'suggested_score', 'task_source', 'contextual_meta')
ORDER BY column_name;

-- Check if the RPC function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_contextual_task';

-- Test inserting a simple contextual task
INSERT INTO public.tasks (
  user_id,
  title,
  description,
  task_type,
  contextual_type,
  status,
  priority,
  linked_type,
  linked_id,
  target_card_count,
  task_source,
  tags
) VALUES (
  auth.uid(),
  'Test Contextual Task',
  'Testing the new contextual task system',
  'study_session',
  'document',
  'pending',
  'medium',
  'document',
  null, -- You can replace with an actual document ID
  20,
  'manual',
  ARRAY['test']
) RETURNING id, title, contextual_type, target_card_count;
