-- PropertyPix Pro Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users Table (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Subscriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id),
  UNIQUE(stripe_subscription_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions table
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- Enhancement Credits Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.enhancement_credits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  credits_total INTEGER NOT NULL DEFAULT 5,
  credits_used INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.enhancement_credits ENABLE ROW LEVEL SECURITY;

-- Policies for enhancement_credits table
CREATE POLICY "Users can view their own credits"
  ON public.enhancement_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.enhancement_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to increment credits used
CREATE OR REPLACE FUNCTION public.increment_credits_used(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.enhancement_credits
  SET 
    credits_used = credits_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS VOID AS $$
BEGIN
  UPDATE public.enhancement_credits
  SET 
    credits_used = 0,
    period_start = NOW(),
    period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE period_end < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create credits on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.enhancement_credits (user_id, credits_total)
  VALUES (NEW.id, 
    CASE 
      WHEN NEW.subscription_tier = 'enterprise' THEN -1 -- unlimited
      WHEN NEW.subscription_tier = 'pro' THEN 100
      ELSE 5 -- free tier
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created ON public.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- ============================================
-- Enhancement History Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.enhancement_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  enhancement_type TEXT NOT NULL CHECK (enhancement_type IN ('auto', 'sky', 'staging', 'object_removal')),
  original_image_url TEXT NOT NULL,
  enhanced_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.enhancement_history ENABLE ROW LEVEL SECURITY;

-- Policies for enhancement_history table
CREATE POLICY "Users can view their own history"
  ON public.enhancement_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON public.enhancement_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Storage Buckets
-- ============================================
-- Create storage buckets (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-uploads', 'user-uploads', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('enhancement-results', 'enhancement-results', true);

-- Job Assets bucket for video pipeline
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-assets', 'job-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for job assets (users can access their own assets)
CREATE POLICY "Users can access their own job assets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'job-assets'
    AND EXISTS (
      SELECT 1 FROM video_jobs vj
      WHERE vj.id::text = (storage.foldername(name))[1]
      AND vj.user_id = auth.uid()
    )
  );

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.enhancement_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON public.enhancement_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON public.enhancement_history(created_at DESC);
