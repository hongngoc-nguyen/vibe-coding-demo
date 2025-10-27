-- Migration: Search Assistant Feature
-- Description: Creates tables for user search queries and responses from Google Search and Google AI Mode
-- Date: 2025-10-27

-- ============================================
-- Table: user_search_queries
-- Stores user prompts for search assistant
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_search_queries (
  query_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  query_status TEXT DEFAULT 'pending' CHECK (query_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_search_queries_user_id ON public.user_search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_queries_created_at ON public.user_search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_search_queries_status ON public.user_search_queries(query_status);

-- Add comments
COMMENT ON TABLE public.user_search_queries IS 'Stores user search prompts submitted through the Search Assistant feature';
COMMENT ON COLUMN public.user_search_queries.user_id IS 'Clerk user ID';
COMMENT ON COLUMN public.user_search_queries.prompt_text IS 'The search query/prompt entered by the user';
COMMENT ON COLUMN public.user_search_queries.query_status IS 'Status: pending, processing, completed, or failed';

-- ============================================
-- Table: search_responses
-- Stores responses from Google Search and Google AI Mode
-- ============================================
CREATE TABLE IF NOT EXISTS public.search_responses (
  response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID NOT NULL REFERENCES public.user_search_queries(query_id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('google_search', 'google_ai_mode')),
  response_data JSONB NOT NULL,
  response_status TEXT DEFAULT 'success' CHECK (response_status IN ('success', 'failed')),
  execution_time INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_responses_query_id ON public.search_responses(query_id);
CREATE INDEX IF NOT EXISTS idx_search_responses_source_type ON public.search_responses(source_type);
CREATE INDEX IF NOT EXISTS idx_search_responses_created_at ON public.search_responses(created_at DESC);

-- Add comments
COMMENT ON TABLE public.search_responses IS 'Stores responses from Google Search and Google AI Mode n8n workflows';
COMMENT ON COLUMN public.search_responses.source_type IS 'Either google_search or google_ai_mode';
COMMENT ON COLUMN public.search_responses.response_data IS 'JSONB field storing the raw response from n8n workflow';
COMMENT ON COLUMN public.search_responses.execution_time IS 'Execution time in milliseconds';

-- ============================================
-- Helper Function: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_user_search_queries_updated_at ON public.user_search_queries;
CREATE TRIGGER update_user_search_queries_updated_at
  BEFORE UPDATE ON public.user_search_queries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.user_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_responses ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for n8n workflows)
CREATE POLICY "Service role full access to queries"
  ON public.user_search_queries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to responses"
  ON public.search_responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view their own queries
CREATE POLICY "Users can view own queries"
  ON public.user_search_queries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Authenticated users can insert their own queries
CREATE POLICY "Users can insert own queries"
  ON public.user_search_queries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Authenticated users can update their own queries
CREATE POLICY "Users can update own queries"
  ON public.user_search_queries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Authenticated users can view responses for their queries
CREATE POLICY "Users can view own responses"
  ON public.search_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_search_queries
      WHERE user_search_queries.query_id = search_responses.query_id
      AND user_search_queries.user_id = auth.uid()::text
    )
  );

-- ============================================
-- Grant permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.user_search_queries TO anon, authenticated, service_role;
GRANT ALL ON public.search_responses TO anon, authenticated, service_role;
