-- Migration 024: Create zestio_jobs table for enhancement/staging history
-- This table stores all AI processing jobs so users can view their library

CREATE TABLE IF NOT EXISTS public.zestio_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.zestio_users(id) ON DELETE CASCADE,
  
  -- Input
  input_url TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'enhance', -- enhance, staging, sky, object_removal, video, floorplan
  
  -- Output
  output_url TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- model used, settings, credits consumed, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zestio_jobs_user ON public.zestio_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zestio_jobs_type ON public.zestio_jobs(job_type);

-- RLS
ALTER TABLE public.zestio_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs" ON public.zestio_jobs
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create jobs" ON public.zestio_jobs
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own jobs" ON public.zestio_jobs
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Comments
COMMENT ON TABLE public.zestio_jobs IS 'AI processing job history — enhancements, staging, video, floor plans';
COMMENT ON COLUMN public.zestio_jobs.job_type IS 'Type of AI processing: enhance, staging, sky, object_removal, video, floorplan';
COMMENT ON COLUMN public.zestio_jobs.metadata IS 'Flexible JSON metadata: model used, settings, credits consumed, etc.';
