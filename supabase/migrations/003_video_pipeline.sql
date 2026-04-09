-- ============================================
-- Video Pipeline Extension
-- Property Renovation Video Generation Pipeline
-- ============================================

-- Video Jobs (main job tracking)
CREATE TABLE IF NOT EXISTS video_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    listing_url TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('zillow', 'immobilienscout24', 'redfin', 'rightmove', 'other')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'scraping', 'renovating', 'animating', 'stitching', 'done', 'failed')),
    renovation_style TEXT DEFAULT 'modern',
    music_genre TEXT DEFAULT 'cinematic',
    error_message TEXT,
    output_video_url TEXT,
    thumbnail_url TEXT,
    metadata JSONB, -- listing data (address, price, rooms, etc.)
    credits_used INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Video Job Assets (images, clips, etc.)
CREATE TABLE IF NOT EXISTS video_job_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES video_jobs(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('original_photo', 'renovated_image', 'animated_clip', 'music_track')),
    storage_path TEXT NOT NULL,
    order_index INT, -- sequence in final video
    room_label TEXT, -- e.g. 'Living Room', 'Kitchen'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_job_assets ENABLE ROW LEVEL SECURITY;

-- Policies for video_jobs
CREATE POLICY "Users can view their own video jobs" ON video_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video jobs" ON video_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video jobs" ON video_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for video_job_assets
CREATE POLICY "Users can view their own video job assets" ON video_job_assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM video_jobs
            WHERE video_jobs.id = video_job_assets.job_id
            AND video_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own video job assets" ON video_job_assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM video_jobs
            WHERE video_jobs.id = video_job_assets.job_id
            AND video_jobs.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_jobs_user_id ON video_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON video_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_job_assets_job_id ON video_job_assets(job_id);
CREATE INDEX IF NOT EXISTS idx_video_job_assets_type ON video_job_assets(type);

-- Comments
COMMENT ON TABLE video_jobs IS 'Video generation jobs for property renovation videos';
COMMENT ON TABLE video_job_assets IS 'Assets (images, clips, tracks) associated with video jobs';
COMMENT ON COLUMN video_jobs.listing_url IS 'URL of the property listing to scrape';
COMMENT ON COLUMN video_jobs.platform IS 'Platform detected from listing URL';
COMMENT ON COLUMN video_jobs.renovation_style IS 'Style preset for AI renovation (modern, luxury, minimalist, etc.)';
COMMENT ON COLUMN video_jobs.music_genre IS 'Music style for final video';
COMMENT ON COLUMN video_job_assets.type IS 'Type of asset: original_photo, renovated_image, animated_clip, music_track';
COMMENT ON COLUMN video_job_assets.order_index IS 'Sequence order in final video composition';
COMMENT ON COLUMN video_job_assets.room_label IS 'Label for the room shown (e.g., Living Room, Kitchen)';
