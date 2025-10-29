-- Migration: Change response_data from JSONB to TEXT
-- Description: Allows n8n workflows to return pre-formatted text instead of JSON
-- Date: 2025-10-29

-- ============================================
-- Step 1: Add new TEXT column
-- ============================================
ALTER TABLE public.search_responses
ADD COLUMN response_data_text TEXT;

-- ============================================
-- Step 2: Migrate existing JSONB data to TEXT
-- ============================================
-- Convert existing JSONB to pretty-printed TEXT
UPDATE public.search_responses
SET response_data_text = response_data::text
WHERE response_data IS NOT NULL;

-- ============================================
-- Step 3: Drop old JSONB column and rename
-- ============================================
ALTER TABLE public.search_responses
DROP COLUMN response_data;

ALTER TABLE public.search_responses
RENAME COLUMN response_data_text TO response_data;

-- ============================================
-- Step 4: Update column constraints
-- ============================================
-- Make response_data NOT NULL for new records
-- (Allow NULL for existing records that might not have been migrated)
ALTER TABLE public.search_responses
ALTER COLUMN response_data SET DEFAULT '';

-- ============================================
-- Step 5: Update comments
-- ============================================
COMMENT ON COLUMN public.search_responses.response_data IS 'TEXT field storing formatted response from n8n workflow (previously JSONB)';

-- ============================================
-- Verification query (run after migration)
-- ============================================
-- SELECT response_id, source_type,
--        pg_typeof(response_data) as data_type,
--        length(response_data) as text_length
-- FROM public.search_responses
-- LIMIT 5;
