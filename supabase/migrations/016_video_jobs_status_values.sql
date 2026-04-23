-- Add 'sorting' and 'needs_images' to video_jobs status CHECK constraint

ALTER TABLE video_jobs DROP CONSTRAINT IF EXISTS video_jobs_status_check;
ALTER TABLE video_jobs ADD CONSTRAINT video_jobs_status_check 
  CHECK (status IN ('queued', 'scraping', 'sorting', 'renovating', 'animating', 'stitching', 'done', 'failed', 'needs_images'));
