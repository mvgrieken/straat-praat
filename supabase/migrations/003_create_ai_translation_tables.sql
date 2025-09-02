-- Create translation_history table for AI translations
CREATE TABLE public.translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  target_language TEXT NOT NULL CHECK (target_language IN ('formal', 'slang')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  ai_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create translation_feedback table for user feedback
CREATE TABLE public.translation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  original_text TEXT NOT NULL,
  translation TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('correct', 'incorrect', 'partially_correct')),
  user_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for translation tables
ALTER TABLE public.translation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for translation_history
CREATE POLICY "translation_history_select_own" ON public.translation_history
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "translation_history_insert_own" ON public.translation_history
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policies for translation_feedback
CREATE POLICY "translation_feedback_select_own" ON public.translation_feedback
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "translation_feedback_insert_own" ON public.translation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for performance
CREATE INDEX idx_translation_history_user_id ON public.translation_history(user_id);
CREATE INDEX idx_translation_history_created_at ON public.translation_history(created_at);
CREATE INDEX idx_translation_feedback_user_id ON public.translation_feedback(user_id);
CREATE INDEX idx_translation_feedback_created_at ON public.translation_feedback(created_at);

-- Create function to clean old translation history (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_translations()
RETURNS INTEGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.translation_history 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Create function to get translation statistics
CREATE OR REPLACE FUNCTION public.get_translation_stats(user_id UUID DEFAULT NULL)
RETURNS TABLE(
  total_translations BIGINT,
  avg_confidence DECIMAL(3,2),
  most_common_target TEXT,
  recent_activity BOOLEAN
)
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_translations,
    AVG(confidence)::DECIMAL(3,2) as avg_confidence,
    MODE() WITHIN GROUP (ORDER BY target_language) as most_common_target,
    MAX(created_at) > NOW() - INTERVAL '7 days' as recent_activity
  FROM public.translation_history
  WHERE (get_translation_stats.user_id IS NULL OR translation_history.user_id = get_translation_stats.user_id);
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT ON public.translation_history TO authenticated;
GRANT SELECT, INSERT ON public.translation_feedback TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_translations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_translation_stats(UUID) TO authenticated;

-- Create trigger to automatically clean old translations
CREATE OR REPLACE FUNCTION public.auto_cleanup_translations()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  -- Clean up old translations every 1000 new records
  IF (SELECT COUNT(*) FROM public.translation_history) % 1000 = 0 THEN
    PERFORM public.cleanup_old_translations();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_cleanup_translations
  AFTER INSERT ON public.translation_history
  FOR EACH ROW EXECUTE FUNCTION public.auto_cleanup_translations();
