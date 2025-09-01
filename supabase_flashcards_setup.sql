-- Flashcard System Database Setup for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create decks table
CREATE TABLE IF NOT EXISTS public.decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.decks(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    deck_id UUID REFERENCES public.decks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ease_factor DECIMAL(3,2) DEFAULT 2.5 NOT NULL,
    interval INTEGER DEFAULT 1 NOT NULL,
    repetitions INTEGER DEFAULT 0 NOT NULL,
    next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quality INTEGER CHECK (quality >= 1 AND quality <= 5) NOT NULL,
    review_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON public.decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_parent_id ON public.decks(parent_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(next_review);
CREATE INDEX IF NOT EXISTS idx_reviews_flashcard_id ON public.reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for decks
CREATE POLICY "Users can view their own decks" ON public.decks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks" ON public.decks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks" ON public.decks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks" ON public.decks
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS policies for flashcards
CREATE POLICY "Users can view their own flashcards" ON public.flashcards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards" ON public.flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" ON public.flashcards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" ON public.flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Create RLS policies for reviews
CREATE POLICY "Users can view their own reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create triggers for updated_at
CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON public.decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON public.flashcards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert some sample data (optional - for testing)
-- Uncomment these lines if you want sample data

/*
INSERT INTO public.decks (name, description, user_id) VALUES
('Language Learning', 'Study different languages', 'YOUR_USER_ID_HERE'),
('Science', 'Biology, Chemistry, Physics', 'YOUR_USER_ID_HERE'),
('Mathematics', 'Algebra, Calculus, Statistics', 'YOUR_USER_ID_HERE');

INSERT INTO public.decks (name, description, parent_id, user_id) VALUES
('French', 'French language basics', (SELECT id FROM public.decks WHERE name = 'Language Learning'), 'YOUR_USER_ID_HERE'),
('Biology', 'Life sciences', (SELECT id FROM public.decks WHERE name = 'Science'), 'YOUR_USER_ID_HERE');

INSERT INTO public.flashcards (front, back, deck_id, user_id) VALUES
('What is the capital of France?', 'Paris', (SELECT id FROM public.decks WHERE name = 'French'), 'YOUR_USER_ID_HERE'),
('What is the chemical symbol for gold?', 'Au', (SELECT id FROM public.decks WHERE name = 'Biology'), 'YOUR_USER_ID_HERE');
*/
