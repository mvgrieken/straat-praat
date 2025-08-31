-- Create words table for slang words
CREATE TABLE public.words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  example TEXT,
  category TEXT DEFAULT 'general',
  difficulty TEXT DEFAULT 'medium',
  origin TEXT,
  usage_frequency INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create word_of_the_day table
CREATE TABLE public.word_of_the_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID REFERENCES public.words(id) ON DELETE CASCADE,
  date DATE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id UUID REFERENCES public.words(id) ON DELETE CASCADE,
  learned_at TIMESTAMPTZ DEFAULT NOW(),
  quiz_score INTEGER DEFAULT 0,
  times_reviewed INTEGER DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT false,
  UNIQUE(user_id, word_id)
);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID REFERENCES public.words(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  wrong_answers TEXT[] NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  difficulty TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_sessions table
CREATE TABLE public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER, -- in seconds
  difficulty TEXT DEFAULT 'medium',
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT,
  points_reward INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  requirements JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create search_history table
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_term TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_of_the_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Policies for words (public read, admin write)
CREATE POLICY "words_select_all" ON public.words
  FOR SELECT USING (true);

CREATE POLICY "words_insert_admin" ON public.words
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users WHERE email IN (
      SELECT email FROM public.admin_users
    )
  ));

-- Policies for word_of_the_day (public read)
CREATE POLICY "word_of_the_day_select_all" ON public.word_of_the_day
  FOR SELECT USING (true);

-- Policies for user_progress (user owns their progress)
CREATE POLICY "user_progress_select_own" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_progress_insert_own" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_update_own" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for quiz_questions (public read, admin write)
CREATE POLICY "quiz_questions_select_all" ON public.quiz_questions
  FOR SELECT USING (is_active = true);

-- Policies for quiz_sessions (user owns their sessions)
CREATE POLICY "quiz_sessions_select_own" ON public.quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quiz_sessions_insert_own" ON public.quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for achievements (public read)
CREATE POLICY "achievements_select_all" ON public.achievements
  FOR SELECT USING (is_active = true);

-- Policies for user_achievements (user owns their achievements)
CREATE POLICY "user_achievements_select_own" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_achievements_insert_own" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for search_history (user owns their history)
CREATE POLICY "search_history_select_own" ON public.search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "search_history_insert_own" ON public.search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_words_category ON public.words(category);
CREATE INDEX idx_words_difficulty ON public.words(difficulty);
CREATE INDEX idx_words_active ON public.words(is_active);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_word_id ON public.user_progress(word_id);
CREATE INDEX idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_completed_at ON public.quiz_sessions(completed_at);
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_searched_at ON public.search_history(searched_at);

-- Add updated_at triggers
CREATE TRIGGER words_updated_at
  BEFORE UPDATE ON public.words
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some sample words
INSERT INTO public.words (word, definition, example, category, difficulty) VALUES
('Bruh', 'Uitdrukking van verbazing of ongeloof', 'Bruh, dat kan niet waar zijn!', 'general', 'easy'),
('Slay', 'Iets heel goed doen', 'Ze slayed die presentatie!', 'general', 'medium'),
('Cap', 'Lieg of overdrijf', 'Dat is cap, dat geloof ik niet', 'general', 'medium'),
('No cap', 'Echt waar, geen grap', 'No cap, dat was echt cool', 'general', 'medium'),
('Sus', 'Verdacht', 'Die situatie is heel sus', 'general', 'easy'),
('Based', 'Cool, goed', 'Die mening is based', 'general', 'medium'),
('W', 'Win, succes', 'Dat is een W!', 'gaming', 'easy'),
('L', 'Loss, verlies', 'Dat was een L', 'gaming', 'easy'),
('Facts', 'Eens, waar', 'Facts, dat klopt helemaal', 'general', 'easy'),
('Vibe', 'Sfeer, stemming', 'Goede vibe hier', 'general', 'easy');

-- Insert sample achievements
INSERT INTO public.achievements (name, description, icon, points_reward, category) VALUES
('Eerste Stap', 'Leer je eerste woord', '🎯', 10, 'learning'),
('Streak Starter', 'Behoud een streak van 3 dagen', '🔥', 25, 'streak'),
('Quiz Master', 'Behaal een perfecte score in een quiz', '🏆', 50, 'quiz'),
('Woord Verzamelaar', 'Leer 50 woorden', '📚', 100, 'learning'),
('Dagelijkse Leerling', 'Log 7 dagen achter elkaar in', '📅', 75, 'streak');
