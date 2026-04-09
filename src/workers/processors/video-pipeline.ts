// Video Pipeline Processor
// Handles the 4-stage property renovation video generation pipeline:
// 1. Scrape - Extract listing photos from property portals
// 2. Renovate - AI-powered virtual renovation of each image
// 3. Animate - Convert static images to video clips
// 4. Stitch - Combine clips with music and effects into final video

import { Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import {
  VideoPipelineJob,
  VideoPlatform,
  APIFY_ACTORS,
} from '../../lib/video-pipeline-queue';

// Initialize Supabase client for workers (service role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const MAX_CONCURRENT_RENOVATIONS = 5;
const STORAGE_BUCKET = 'job-assets';

// Types for job assets
interface JobAsset {
  id?: string;
  job_id: string;
  type: 'original_photo' | 'renovated_image' | 'animated_clip' | 'music_track';
  storage_path: string;
  order_index?: number;
  room_label?: string;
  metadata?: Record<string, unknown>;
}

// Main processor function
export async function processVideoPipeline(
  job: Job<VideoPipelineJob>
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  const { jobId, userId, listingUrl, renovationStyle, musicGenre } = job.data;

  console.log(`[VideoPipeline] Starting job ${jobId} for user ${userId}`);
  console.log(`[VideoPipeline] URL: ${listingUrl}, Style: ${renovationStyle}`);

  try {
    // Stage 1: Scrape listing photos
    await updateJobStatus(jobId, 'scraping');
    job.log('Starting scrape stage');
    const images = await scrapeListing(listingUrl, jobId, userId);
    job.log(`Scraped ${images.length} images`);

    if (images.length === 0) {
      throw new Error('No images found in listing');
    }

    // Stage 2: AI Renovation
    await updateJobStatus(jobId, 'renovating');
    job.log('Starting renovation stage');
    const renovatedImages = await renovateImages(images, jobId, userId, renovationStyle);
    job.log(`Renovated ${renovatedImages.length} images`);

    // Stage 3: Animate clips
    await updateJobStatus(jobId, 'animating');
    job.log('Starting animation stage');
    const clips = await animateClips(renovatedImages, jobId, userId);
    job.log(`Generated ${clips.length} clips`);

    // Stage 4: Stitch final video
    await updateJobStatus(jobId, 'stitching');
    job.log('Starting stitching stage');
    const videoUrl = await stitchVideo(clips, jobId, userId, musicGenre);
    job.log(`Final video: ${videoUrl}`);

    // Complete
    await updateJobStatus(jobId, 'done', videoUrl);
    await updateJobMetadata(jobId, {
      totalImages: images.length,
      totalClips: clips.length,
      renovationStyle,
      musicGenre,
    });

    console.log(`[VideoPipeline] Job ${jobId} completed successfully`);
    return { success: true, videoUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[VideoPipeline] Job ${jobId} failed:`, errorMessage);
    await updateJobStatus(jobId, 'failed', undefined, errorMessage);
    // Refund credit on failure
    await refundCredit(userId, jobId);
    throw error;
  }
}

// Update job status in database
async function updateJobStatus(
  jobId: string,
  status: string,
  videoUrl?: string,
  error?: string
): Promise<void> {
  const update: Record<string, unknown> = { status };

  if (videoUrl) {
    update.output_video_url = videoUrl;
  }
  if (error) {
    update.error_message = error;
  }
  if (status === 'done') {
    update.completed_at = new Date().toISOString();
  }

  const { error: dbError } = await supabase
    .from('video_jobs')
    .update(update)
    .eq('id', jobId);

  if (dbError) {
    console.error(`[VideoPipeline] Failed to update job status:`, dbError);
  }
}

// Update job metadata
async function updateJobMetadata(
  jobId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.rpc('update_video_job_metadata', {
    job_id: jobId,
    new_metadata: metadata,
  });

  if (error) {
    // Fallback: try direct update
    await supabase
      .from('video_jobs')
      .update({ metadata })
      .eq('id', jobId);
  }
}

// Stage 1: Scrape listing photos using Apify
async function scrapeListing(
  url: string,
  jobId: string,
  userId: string
): Promise<string[]> {
  console.log(`[VideoPipeline:Scrape] Starting scrape for ${url}`);

  // Detect platform
  const platform = detectPlatformFromUrl(url);

  if (platform === 'other') {
    // For unknown platforms, try generic scraping or manual upload
    console.warn(`[VideoPipeline:Scrape] Unknown platform for ${url}`);
    // Return empty - user would need to upload manually
    return [];
  }

  const actorId = APIFY_ACTORS[platform];
  console.log(`[VideoPipeline:Scrape] Using Apify actor: ${actorId}`);

  // TODO: Implement Apify scraping
  // 1. Call Apify API to start actor run
  // 2. Poll for completion
  // 3. Download images to Supabase Storage
  // 4. Insert video_job_assets rows

  try {
    // Placeholder: In production, call Apify API
    // const apifyResponse = await callApifyActor(actorId, { startUrls: [url] });
    // const imageUrls = apifyResponse.images || [];

    // For now, return empty array - implementation requires Apify API token
    console.log(`[VideoPipeline:Scrape] Apify integration pending - APIFY_API_TOKEN required`);

    // Create placeholder asset record
    await supabase.from('video_job_assets').insert({
      job_id: jobId,
      type: 'original_photo',
      storage_path: `jobs/${jobId}/originals/.placeholder`,
      order_index: 0,
      metadata: { url, platform, status: 'pending_apify_integration' },
    } as JobAsset);

    return [];
  } catch (error) {
    console.error(`[VideoPipeline:Scrape] Error:`, error);
    throw error;
  }
}

// Stage 2: AI Renovation using Replicate ControlNet or Calico AI
async function renovateImages(
  imagePaths: string[],
  jobId: string,
  userId: string,
  style: string
): Promise<string[]> {
  console.log(`[VideoPipeline:Renovate] Renovating ${imagePaths.length} images with style: ${style}`);

  if (imagePaths.length === 0) {
    console.log(`[VideoPipeline:Renovate] No images to renovate`);
    return [];
  }

  const renovatedPaths: string[] = [];

  // Process images in parallel (max 5 concurrent)
  // TODO: Implement actual AI renovation
  // 1. For each image, call Replicate ControlNet or Calico AI
  // 2. Use style prompt based on renovation style
  // 3. Store in: jobs/{jobId}/renovated/
  // 4. Insert video_job_assets rows

  const stylePrompts: Record<string, string> = {
    modern: 'modern interior design, clean lines, minimalist furniture, neutral colors, natural light',
    luxury: 'luxury interior design, high-end furniture, marble floors, gold accents, elegant lighting',
    minimalist: 'minimalist interior design, simple furniture, white walls, clean spaces, natural materials',
    scandinavian: 'scandinavian interior design, light wood, white walls, cozy textiles, plants',
    industrial: 'industrial interior design, exposed brick, metal fixtures, concrete floors, vintage furniture',
    contemporary: 'contemporary interior design, modern furniture, bold colors, statement pieces',
    coastal: 'coastal interior design, blue and white colors, natural textures, beach-inspired decor',
    midcentury: 'midcentury modern interior design, retro furniture, warm wood tones, geometric patterns',
  };

  const prompt = stylePrompts[style] || stylePrompts.modern;
  console.log(`[VideoPipeline:Renovate] Using prompt: ${prompt}`);

  // Placeholder: In production, process each image
  for (let i = 0; i < imagePaths.length; i++) {
    const originalPath = imagePaths[i];

    // TODO: Call Replicate API
    // const result = await replicate.run('controlnet-model', {
    //   input: { image: originalPath, prompt }
    // });

    // Create placeholder asset record
    await supabase.from('video_job_assets').insert({
      job_id: jobId,
      type: 'renovated_image',
      storage_path: `jobs/${jobId}/renovated/${i}.jpg`,
      order_index: i,
      metadata: { original_path: originalPath, style, prompt, status: 'pending_replicate_integration' },
    } as JobAsset);

    renovatedPaths.push(`jobs/${jobId}/renovated/${i}.jpg`);
  }

  console.log(`[VideoPipeline:Renovate] Renovated ${renovatedPaths.length} images`);
  return renovatedPaths;
}

// Stage 3: Animate images to video clips using Runway Gen-3 or Kling
async function animateClips(
  imagePaths: string[],
  jobId: string,
  userId: string
): Promise<string[]> {
  console.log(`[VideoPipeline:Animate] Creating clips from ${imagePaths.length} images`);

  if (imagePaths.length === 0) {
    console.log(`[VideoPipeline:Animate] No images to animate`);
    return [];
  }

  const clipPaths: string[] = [];

  // Process images sequentially (rate limits on video generation APIs)
  // TODO: Implement Runway/Kling animation
  // 1. For each image, call Runway Gen-3 or Kling API
  // 2. Apply Ken Burns zoom/pan effect
  // 3. Store in: jobs/{jobId}/clips/
  // 4. Insert video_job_assets rows

  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];

    // TODO: Call Runway API
    // const result = await runwayApi.generateVideo({
    //   image: imagePath,
    //   motion: 'zoom_in',
    //   duration: 4
    // });

    // Create placeholder asset record
    await supabase.from('video_job_assets').insert({
      job_id: jobId,
      type: 'animated_clip',
      storage_path: `jobs/${jobId}/clips/${i}.mp4`,
      order_index: i,
      metadata: {
        source_image: imagePath,
        duration: 4,
        motion: 'ken_burns_zoom',
        status: 'pending_runway_integration'
      },
    } as JobAsset);

    clipPaths.push(`jobs/${jobId}/clips/${i}.mp4`);

    // Rate limiting - wait between requests
    if (i < imagePaths.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`[VideoPipeline:Animate] Generated ${clipPaths.length} clips`);
  return clipPaths;
}

// Stage 4: Stitch final video with FFmpeg
async function stitchVideo(
  clipPaths: string[],
  jobId: string,
  userId: string,
  musicGenre: string
): Promise<string> {
  console.log(`[VideoPipeline:Stitch] Stitching ${clipPaths.length} clips with ${musicGenre} music`);

  if (clipPaths.length === 0) {
    throw new Error('No clips to stitch');
  }

  // TODO: Implement FFmpeg stitching via Modal serverless
  // 1. Call Modal serverless function
  // 2. Ken Burns zoom + crossfade transitions
  // 3. Add music track based on genre
  // 4. Add agent contact card overlay
  // 5. Store: jobs/{jobId}/output.mp4
  // 6. Generate thumbnail

  const outputUrl = `jobs/${jobId}/output.mp4`;
  const thumbnailUrl = `jobs/${jobId}/thumbnail.jpg`;

  // Music track mapping
  const musicTracks: Record<string, string> = {
    cinematic: 'cinematic_epic.mp3',
    uplifting: 'uplifting_corporate.mp3',
    ambient: 'ambient_relaxing.mp3',
    acoustic: 'acoustic_guitar.mp3',
    electronic: 'electronic_modern.mp3',
    jazz: 'smooth_jazz.mp3',
    classical: 'classical_piano.mp3',
  };

  const musicFile = musicTracks[musicGenre] || musicTracks.cinematic;
  console.log(`[VideoPipeline:Stitch] Using music: ${musicFile}`);

  // Update job with output URLs
  await supabase
    .from('video_jobs')
    .update({
      output_video_url: outputUrl,
      thumbnail_url: thumbnailUrl,
    })
    .eq('id', jobId);

  console.log(`[VideoPipeline:Stitch] Final video: ${outputUrl}`);
  return outputUrl;
}

// Refund credit on failure
async function refundCredit(userId: string, jobId: string): Promise<void> {
  try {
    // Check if credit_transactions table exists and insert refund
    const { error } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: 1,
      reason: 'video_generation_refund',
      reference_id: jobId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`[VideoPipeline] Failed to refund credit:`, error);
      // Try alternative approach - update enhancement_credits
      const { data: credits } = await supabase
        .from('enhancement_credits')
        .select('credits_used')
        .eq('user_id', userId)
        .single();

      if (credits && credits.credits_used > 0) {
        await supabase
          .from('enhancement_credits')
          .update({ credits_used: credits.credits_used - 1 })
          .eq('user_id', userId);
        console.log(`[VideoPipeline] Refunded 1 credit to user ${userId}`);
      }
    } else {
      console.log(`[VideoPipeline] Refunded 1 credit to user ${userId}`);
    }
  } catch (error) {
    console.error(`[VideoPipeline] Error refunding credit:`, error);
  }
}

// Helper: Detect platform from URL
function detectPlatformFromUrl(url: string): VideoPlatform {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('zillow.com')) return 'zillow';
  if (urlLower.includes('immobilienscout24.de')) return 'immobilienscout24';
  if (urlLower.includes('redfin.com')) return 'redfin';
  if (urlLower.includes('rightmove.co.uk')) return 'rightmove';
  return 'other';
}

// Helper: Upload file to Supabase Storage
async function uploadToStorage(
  bucket: string,
  path: string,
  data: Buffer | Blob,
  contentType?: string
): Promise<string> {
  const { data: uploadData, error } = await supabase.storage
    .from(bucket)
    .upload(path, data, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload to storage: ${error.message}`);
  }

  return uploadData.path;
}

// Helper: Download file from URL
async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
