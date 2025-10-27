-- Quick Migration Script for Search Assistant
-- Copy and paste this into Supabase SQL Editor
-- This is the same content as migrations/004_search_assistant.sql

-- ============================================
-- Table: user_search_queries
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_search_queries (
  query_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  query_status TEXT DEFAULT 'pending' CHECK (query_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_search_queries_user_id ON public.user_search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_queries_created_at ON public.user_search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_search_queries_status ON public.user_search_queries(query_status);

-- ============================================
-- Table: search_responses
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

CREATE INDEX IF NOT EXISTS idx_search_responses_query_id ON public.search_responses(query_id);
CREATE INDEX IF NOT EXISTS idx_search_responses_source_type ON public.search_responses(source_type);
CREATE INDEX IF NOT EXISTS idx_search_responses_created_at ON public.search_responses(created_at DESC);

-- ============================================
-- Helper Function: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_search_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_search_queries_updated_at ON public.user_search_queries;
CREATE TRIGGER update_user_search_queries_updated_at
  BEFORE UPDATE ON public.user_search_queries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_search_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE public.user_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_responses ENABLE ROW LEVEL SECURITY;

-- Service role full access
DROP POLICY IF EXISTS "Service role full access to search queries" ON public.user_search_queries;
CREATE POLICY "Service role full access to search queries"
  ON public.user_search_queries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to search responses" ON public.search_responses;
CREATE POLICY "Service role full access to search responses"
  ON public.search_responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User policies
DROP POLICY IF EXISTS "Users can view own search queries" ON public.user_search_queries;
CREATE POLICY "Users can view own search queries"
  ON public.user_search_queries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert own search queries" ON public.user_search_queries;
CREATE POLICY "Users can insert own search queries"
  ON public.user_search_queries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own search queries" ON public.user_search_queries;
CREATE POLICY "Users can update own search queries"
  ON public.user_search_queries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view own search responses" ON public.search_responses;
CREATE POLICY "Users can view own search responses"
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
-- Verification Queries
-- ============================================

-- Run these after migration to verify:

-- 1. Check tables exist
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('user_search_queries', 'search_responses');

-- 2. Check indexes
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('user_search_queries', 'search_responses');

-- 3. Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('user_search_queries', 'search_responses');

-- 4. Check policies
-- SELECT schemaname, tablename, policyname FROM pg_policies
-- WHERE tablename IN ('user_search_queries', 'search_responses');
