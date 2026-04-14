-- Migration: Create storage buckets for PropertyPix
-- Required for: image uploads, staging, video assets

-- Create the images bucket (for staging uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create the user-uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create the job-assets bucket (for video pipeline)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-assets',
  'job-assets',
  false, -- Private, use signed URLs
  104857600, -- 100MB limit for videos
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Create the enhancement-results bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'enhancement-results',
  'enhancement-results',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for user-uploads bucket
CREATE POLICY "Anyone can view user-uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-uploads');

CREATE POLICY "Authenticated users can upload to user-uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for enhancement-results bucket
CREATE POLICY "Anyone can view enhancement-results" ON storage.objects
  FOR SELECT USING (bucket_id = 'enhancement-results');

CREATE POLICY "Authenticated users can upload to enhancement-results" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'enhancement-results' AND auth.role() = 'authenticated');

-- Storage policies for job-assets bucket (private, use signed URLs)
CREATE POLICY "Users can view their own job assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'job-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can manage job assets" ON storage.objects
  FOR ALL USING (bucket_id = 'job-assets' AND auth.role() = 'service_role');
