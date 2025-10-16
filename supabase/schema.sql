-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Create competitors table
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_name TEXT UNIQUE NOT NULL,
  industry_category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prompts table
CREATE TABLE public.prompts (
  prompt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_text TEXT NOT NULL,
  prompt_cluster TEXT NOT NULL,
  prompt_sequence_count INTEGER DEFAULT 0,
  added_date TIMESTAMPTZ DEFAULT NOW(),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create responses table
CREATE TABLE public.responses (
  response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES public.prompts(prompt_id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ChatGPT', 'Google AI', 'Microsoft Copilot')),
  response_date TIMESTAMPTZ DEFAULT NOW(),
  execution_time INTEGER, -- milliseconds
  response_length INTEGER, -- word count
  response_status TEXT DEFAULT 'Success' CHECK (response_status IN ('Success', 'Failed')),
  full_response_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create brand_mentions table
CREATE TABLE public.brand_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID REFERENCES public.responses(response_id) ON DELETE CASCADE,
  brand_mentioned BOOLEAN DEFAULT FALSE,
  mention_count INTEGER,
  mention_text TEXT,
  brand_citation BOOLEAN DEFAULT FALSE,
  cited_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create competitor_mentions table
CREATE TABLE public.competitor_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID REFERENCES public.responses(response_id) ON DELETE CASCADE,
  competitors_mentioned BOOLEAN DEFAULT FALSE,
  competitor_name TEXT,
  mention_text TEXT,
  cited_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create external_mentions table
CREATE TABLE public.external_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID REFERENCES public.responses(response_id) ON DELETE CASCADE,
  external_mentioned BOOLEAN DEFAULT FALSE,
  external_name TEXT,
  cited_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_responses_prompt_id ON public.responses(prompt_id);
CREATE INDEX idx_responses_platform ON public.responses(platform);
CREATE INDEX idx_responses_response_date ON public.responses(response_date);
CREATE INDEX idx_brand_mentions_response_id ON public.brand_mentions(response_id);
CREATE INDEX idx_competitor_mentions_response_id ON public.competitor_mentions(response_id);
CREATE INDEX idx_external_mentions_response_id ON public.external_mentions(response_id);

-- Create views for easier data access
CREATE OR REPLACE VIEW public.brand_performance AS
SELECT
  DATE_TRUNC('week', r.response_date) as week,
  COUNT(DISTINCT CASE WHEN bm.brand_mentioned THEN r.response_id END) as brand_mentions,
  SUM(bm.mention_count) as total_mention_count,
  COUNT(DISTINCT CASE WHEN bm.brand_citation THEN r.response_id END) as citations,
  r.platform
FROM public.responses r
LEFT JOIN public.brand_mentions bm ON r.response_id = bm.response_id
GROUP BY DATE_TRUNC('week', r.response_date), r.platform;

CREATE OR REPLACE VIEW public.competitive_analysis AS
SELECT
  DATE_TRUNC('week', r.response_date) as week,
  cm.competitor_name,
  COUNT(DISTINCT r.response_id) as mention_count,
  r.platform
FROM public.responses r
INNER JOIN public.competitor_mentions cm ON r.response_id = cm.response_id
WHERE cm.competitors_mentioned = TRUE
GROUP BY DATE_TRUNC('week', r.response_date), cm.competitor_name, r.platform;

-- RLS Policies (to be enabled after authentication setup)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_mentions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view all data" ON public.competitors
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all prompts" ON public.prompts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all responses" ON public.responses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all brand mentions" ON public.brand_mentions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all competitor mentions" ON public.competitor_mentions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all external mentions" ON public.external_mentions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin policies for data management
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample competitors
INSERT INTO public.competitors (competitor_name, industry_category) VALUES
  ('Passthrough', 'Legal Tech'),
  ('Subscribe', 'Legal Tech'),
  ('Clio', 'Legal Tech'),
  ('LawPay', 'Legal Tech'),
  ('MyCase', 'Legal Tech');