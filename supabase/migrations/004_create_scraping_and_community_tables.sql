-- Create community_contributions table for user-submitted words
CREATE TABLE public.community_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  context TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create new_words table for scraped words
CREATE TABLE public.new_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  meaning TEXT,
  context TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  category TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scraping_sources table for managing data sources
CREATE TABLE public.scraping_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reddit', 'twitter', 'urban-dictionary', 'custom')),
  enabled BOOLEAN DEFAULT true,
  last_scraped TIMESTAMPTZ,
  success_rate DECIMAL(3,2) DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scraping_logs table for tracking scraping activities
CREATE TABLE public.scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT REFERENCES public.scraping_sources(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  words_found INTEGER DEFAULT 0,
  words_added INTEGER DEFAULT 0,
  words_filtered INTEGER DEFAULT 0,
  errors TEXT[],
  processing_time_ms INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);

-- Enable RLS for all tables
ALTER TABLE public.community_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_logs ENABLE ROW LEVEL SECURITY;

-- Policies for community_contributions
CREATE POLICY "community_contributions_select_own" ON public.community_contributions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = moderator_id OR user_id IS NULL);

CREATE POLICY "community_contributions_insert_own" ON public.community_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "community_contributions_update_moderator" ON public.community_contributions
  FOR UPDATE USING (auth.uid() = moderator_id);

-- Policies for new_words
CREATE POLICY "new_words_select_all" ON public.new_words
  FOR SELECT USING (true);

CREATE POLICY "new_words_insert_service" ON public.new_words
  FOR INSERT WITH CHECK (true);

CREATE POLICY "new_words_update_moderator" ON public.new_words
  FOR UPDATE USING (auth.uid() = moderator_id);

-- Policies for scraping_sources
CREATE POLICY "scraping_sources_select_all" ON public.scraping_sources
  FOR SELECT USING (true);

CREATE POLICY "scraping_sources_insert_admin" ON public.scraping_sources
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  ));

CREATE POLICY "scraping_sources_update_admin" ON public.scraping_sources
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role = 'admin'
  ));

-- Policies for scraping_logs
CREATE POLICY "scraping_logs_select_all" ON public.scraping_logs
  FOR SELECT USING (true);

CREATE POLICY "scraping_logs_insert_service" ON public.scraping_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_community_contributions_user_id ON public.community_contributions(user_id);
CREATE INDEX idx_community_contributions_status ON public.community_contributions(status);
CREATE INDEX idx_community_contributions_created_at ON public.community_contributions(created_at);
CREATE INDEX idx_community_contributions_moderator_id ON public.community_contributions(moderator_id);

CREATE INDEX idx_new_words_word ON public.new_words(word);
CREATE INDEX idx_new_words_status ON public.new_words(status);
CREATE INDEX idx_new_words_source ON public.new_words(source);
CREATE INDEX idx_new_words_created_at ON public.new_words(created_at);
CREATE INDEX idx_new_words_confidence ON public.new_words(confidence);

CREATE INDEX idx_scraping_sources_enabled ON public.scraping_sources(enabled);
CREATE INDEX idx_scraping_sources_type ON public.scraping_sources(type);
CREATE INDEX idx_scraping_sources_last_scraped ON public.scraping_sources(last_scraped);

CREATE INDEX idx_scraping_logs_source_id ON public.scraping_logs(source_id);
CREATE INDEX idx_scraping_logs_run_id ON public.scraping_logs(run_id);
CREATE INDEX idx_scraping_logs_status ON public.scraping_logs(status);
CREATE INDEX idx_scraping_logs_started_at ON public.scraping_logs(started_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_community_contributions_updated_at
  BEFORE UPDATE ON public.community_contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_new_words_updated_at
  BEFORE UPDATE ON public.new_words
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_scraping_sources_updated_at
  BEFORE UPDATE ON public.scraping_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get moderation queue statistics
CREATE OR REPLACE FUNCTION public.get_moderation_queue_stats()
RETURNS TABLE(
  total_pending_contributions BIGINT,
  total_pending_words BIGINT,
  oldest_pending_contribution TIMESTAMPTZ,
  oldest_pending_word TIMESTAMPTZ
)
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.community_contributions WHERE status = 'pending')::BIGINT,
    (SELECT COUNT(*) FROM public.new_words WHERE status = 'pending_review')::BIGINT,
    (SELECT MIN(created_at) FROM public.community_contributions WHERE status = 'pending'),
    (SELECT MIN(created_at) FROM public.new_words WHERE status = 'pending_review');
END;
$$;

-- Create function to get scraping performance metrics
CREATE OR REPLACE FUNCTION public.get_scraping_performance_metrics(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  source_id TEXT,
  source_name TEXT,
  total_runs BIGINT,
  successful_runs BIGINT,
  success_rate DECIMAL(5,2),
  avg_words_found DECIMAL(10,2),
  avg_words_added DECIMAL(10,2),
  avg_processing_time_ms DECIMAL(10,2)
)
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id as source_id,
    ss.name as source_name,
    COUNT(sl.id)::BIGINT as total_runs,
    COUNT(CASE WHEN sl.status = 'completed' THEN 1 END)::BIGINT as successful_runs,
    ROUND(
      (COUNT(CASE WHEN sl.status = 'completed' THEN 1 END)::DECIMAL / COUNT(sl.id)::DECIMAL) * 100, 2
    ) as success_rate,
    ROUND(AVG(sl.words_found), 2) as avg_words_found,
    ROUND(AVG(sl.words_added), 2) as avg_words_added,
    ROUND(AVG(sl.processing_time_ms), 2) as avg_processing_time_ms
  FROM public.scraping_sources ss
  LEFT JOIN public.scraping_logs sl ON ss.id = sl.source_id 
    AND sl.started_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY ss.id, ss.name
  ORDER BY ss.name;
END;
$$;

-- Insert default scraping sources
INSERT INTO public.scraping_sources (id, name, url, type, enabled, success_rate) VALUES
  ('reddit-teenagers', 'Reddit r/teenagers', 'https://www.reddit.com/r/teenagers', 'reddit', true, 0.8),
  ('urban-dictionary', 'Urban Dictionary', 'https://www.urbandictionary.com', 'urban-dictionary', true, 0.7),
  ('reddit-netherlands', 'Reddit r/Netherlands', 'https://www.reddit.com/r/Netherlands', 'reddit', true, 0.6),
  ('reddit-amsterdam', 'Reddit r/Amsterdam', 'https://www.reddit.com/r/Amsterdam', 'reddit', true, 0.6);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.community_contributions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.new_words TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.scraping_sources TO authenticated;
GRANT SELECT, INSERT ON public.scraping_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_moderation_queue_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scraping_performance_metrics(INTEGER) TO authenticated;

-- Create view for moderator dashboard
CREATE VIEW public.moderator_dashboard AS
SELECT 
  'community_contributions' as queue_type,
  COUNT(*) as pending_count,
  MIN(created_at) as oldest_item,
  'community' as source
FROM public.community_contributions 
WHERE status = 'pending'

UNION ALL

SELECT 
  'new_words' as queue_type,
  COUNT(*) as pending_count,
  MIN(created_at) as oldest_item,
  'scraping' as source
FROM public.new_words 
WHERE status = 'pending_review';

-- Grant access to moderator dashboard view
GRANT SELECT ON public.moderator_dashboard TO authenticated;
