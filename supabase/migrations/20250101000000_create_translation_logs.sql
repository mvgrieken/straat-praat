-- Create translation_logs table for AI translation tracking
CREATE TABLE IF NOT EXISTS public.translation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  translation TEXT NOT NULL,
  target_language TEXT NOT NULL CHECK (target_language IN ('formal', 'slang')),
  source TEXT NOT NULL CHECK (source IN ('ai', 'database', 'fallback')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  model TEXT,
  usage_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_translation_logs_user_id ON public.translation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_translation_logs_created_at ON public.translation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_translation_logs_source ON public.translation_logs(source);

-- Enable RLS
ALTER TABLE public.translation_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own translation logs" ON public.translation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own translation logs" ON public.translation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_translation_logs_updated_at 
  BEFORE UPDATE ON public.translation_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
