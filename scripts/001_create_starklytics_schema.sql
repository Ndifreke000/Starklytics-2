-- Starklytics Database Schema
-- Core tables for analytics platform

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'analyst', 'user')),
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queries table for saved SQL queries
CREATE TABLE IF NOT EXISTS public.queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sql_query TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboards table
CREATE TABLE IF NOT EXISTS public.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard widgets
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  query_id UUID REFERENCES public.queries(id) ON DELETE SET NULL,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('table', 'chart', 'counter', 'pivot')),
  title TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  position JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bounties table
CREATE TABLE IF NOT EXISTS public.bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  reward_amount DECIMAL(18, 6) NOT NULL,
  reward_token TEXT DEFAULT 'STRK',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bounty submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  analyst_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_id UUID REFERENCES public.queries(id) ON DELETE SET NULL,
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE SET NULL,
  submission_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for queries
CREATE POLICY "queries_select_own_or_public" ON public.queries FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "queries_insert_own" ON public.queries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "queries_update_own" ON public.queries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "queries_delete_own" ON public.queries FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dashboards
CREATE POLICY "dashboards_select_own_or_public" ON public.dashboards FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "dashboards_insert_own" ON public.dashboards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dashboards_update_own" ON public.dashboards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "dashboards_delete_own" ON public.dashboards FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dashboard_widgets
CREATE POLICY "widgets_select_via_dashboard" ON public.dashboard_widgets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.dashboards d 
    WHERE d.id = dashboard_id AND (d.user_id = auth.uid() OR d.is_public = true)
  )
);
CREATE POLICY "widgets_insert_own_dashboard" ON public.dashboard_widgets FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dashboards d 
    WHERE d.id = dashboard_id AND d.user_id = auth.uid()
  )
);
CREATE POLICY "widgets_update_own_dashboard" ON public.dashboard_widgets FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.dashboards d 
    WHERE d.id = dashboard_id AND d.user_id = auth.uid()
  )
);
CREATE POLICY "widgets_delete_own_dashboard" ON public.dashboard_widgets FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.dashboards d 
    WHERE d.id = dashboard_id AND d.user_id = auth.uid()
  )
);

-- RLS Policies for bounties (all users can view, only admins can create)
CREATE POLICY "bounties_select_all" ON public.bounties FOR SELECT TO authenticated USING (true);
CREATE POLICY "bounties_insert_admin" ON public.bounties FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
CREATE POLICY "bounties_update_creator" ON public.bounties FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "bounties_delete_creator" ON public.bounties FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for submissions
CREATE POLICY "submissions_select_own_or_bounty_creator" ON public.submissions FOR SELECT USING (
  auth.uid() = analyst_id OR 
  EXISTS (
    SELECT 1 FROM public.bounties b 
    WHERE b.id = bounty_id AND b.creator_id = auth.uid()
  )
);
CREATE POLICY "submissions_insert_own" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = analyst_id);
CREATE POLICY "submissions_update_own" ON public.submissions FOR UPDATE USING (auth.uid() = analyst_id);
CREATE POLICY "submissions_delete_own" ON public.submissions FOR DELETE USING (auth.uid() = analyst_id);
