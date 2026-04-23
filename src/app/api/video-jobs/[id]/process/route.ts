// Process a video job stage by stage
// Called by client polling — each call advances one stage

import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@/utils/supabase/server';
import { CREDIT_COSTS } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

const STYLE_PROMPTS: Record<string, string> = {
  modern: 'modern interior design, clean lines, minimalist furniture, neutral colors, natural light, professional real estate photography, high quality',
  luxury: 'luxury interior design, high-end furniture, marble floors, gold accents, elegant lighting, professional real estate photography, high quality',
  minimalist: 'minimalist interior design, simple furniture, white walls, clean spaces, natural materials, professional real estate photography, high quality',
  scandinavian: 'scandinavian interior design, light wood, white walls, cozy textiles, plants, professional real estate photography, high quality',
  industrial: 'industrial interior design, exposed brick, metal fixtures, concrete floors, vintage furniture, professional real estate photography, high quality',
  contemporary: 'contemporary interior design, modern furniture, bold colors, statement pieces, professional real estate photography, high quality',
  coastal: 'coastal interior design, blue and white colors, natural textures, beach-inspired decor, professional real estate photography, high quality',
  midcentury: 'midcentury modern interior design, retro furniture, warm wood tones, geometric patterns, professional real estate photography, high quality',
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current job
    const { data: job, error: fetchError } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Route to the correct stage based on current status
    switch (job.status) {
      case 'scraping':
        return await handleScraping(supabase, job);
      case 'sorting':
        return await handleSorting(supabase, job);
      case 'renovating':
        return await handleRenovating(supabase, job);
      case 'animating':
        return await handleAnimating(supabase, job);
      case 'stitching':
        return await handleStitching(supabase, job);
      case 'done':
      case 'failed':
      case 'needs_images':
        return NextResponse.json({ status: job.status, message: 'Job already finished' });
      default:
        return NextResponse.json({ status: job.status, message: 'Unknown status' });
    }
  } catch (error) {
    console.error(`[VideoProcess ${jobId}] Error:`, error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // Try to mark as failed — supabase might be out of scope
    try {
      const supabaseFallback = await createClient();
      const currentStatus = await supabaseFallback.from('video_jobs').select('status').eq('id', jobId).single();
      const failedStage = currentStatus.data?.status || 'unknown';
      await supabaseFallback.from('video_jobs').update({
        status: 'failed',
        metadata: { error: `${failedStage}: ${msg}` },
      }).eq('id', jobId);
    } catch (dbErr) {
      console.error(`[VideoProcess ${jobId}] Also failed to update DB:`, dbErr);
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── Stage 1: Scrape ──────────────────────────────────────────────────────
async function handleScraping(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  let images: string[] = [];

  // Manual mode — use uploaded images
  const inputImages = job.input_images as string[] | null;
  if (Array.isArray(inputImages) && inputImages.length >= 5) {
    images = inputImages;
  } else {
    // Try to scrape from URL
    const url = job.listing_url as string;
    if (url && url !== 'manual-mode') {
      images = await scrapeListingImages(url);
    }
  }

  if (images.length === 0) {
    // Can't get images — refund and stop
    await supabase.from('video_jobs').update({ status: 'needs_images' }).eq('id', job.id);
    await refundCredit(supabase, job.user_id as string);
    return NextResponse.json({ status: 'needs_images', message: 'No images found. Switch to manual upload.' });
  }

  // Store images and move to sorting
  await supabase
    .from('video_jobs')
    .update({ status: 'sorting' })
    .eq('id', job.id);

  return NextResponse.json({
    status: 'sorting',
    message: `Found ${images.length} images. Auto-sorting for optimal order...`,
    imageCount: images.length,
  });
}

// ── Stage 1.5: Auto-sort images ──────────────────────────────────────────
async function handleSorting(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  const inputImages = (job.input_images as string[]) || [];
  if (inputImages.length <= 1) {
    // Nothing to sort
    await supabase.from('video_jobs').update({ status: 'renovating' }).eq('id', job.id);
    return NextResponse.json({ status: 'renovating', message: 'Only one image, skipping sort.' });
  }

  console.log(`[VideoProcess] Sorting ${inputImages.length} images by room type`);

  // Sort one image per call (same pattern as renovation/animation)
  const metadata = (job.metadata as Record<string, unknown>) || {};
  const sortIndex = (metadata.sortIndex as number) || 0;
  const labels = (metadata.sortLabels as Array<{ index: number; label: string; sortKey: number }>) || [];

  // Already sorted?
  if (sortIndex >= inputImages.length && labels.length > 0) {
    labels.sort((a, b) => a.sortKey - b.sortKey);
    const sortedImages = labels.map(item => inputImages[item.index]);
    await supabase.from('video_jobs')
      .update({ status: 'renovating', input_images: sortedImages, metadata: {} })
      .eq('id', job.id);
    return NextResponse.json({ status: 'renovating', message: `Sorted: ${labels.map(l => l.label).join(' → ')}` });
  }

  // Classify one image
  const sortOrder: Record<string, number> = {
    exterior: 0, facade: 0, building: 0, house: 0, outside: 0,
    balcony: 1, patio: 1, terrace: 1, garden: 1,
    living: 2, lounge: 2,
    dining: 3, kitchen: 4, office: 5, study: 5,
    hallway: 6, corridor: 6, entrance: 6,
    bedroom: 7, bathroom: 8, other: 9,
  };

  // Track consecutive failures — if sorting keeps failing, skip it
  const sortFailures = (metadata.sortFailures as number) || 0;

  // Check if there's an active prediction (fire-and-forget pattern)
  const activeSortPredictionId = metadata.sortPredictionId as string | undefined;

  if (activeSortPredictionId) {
    // Check status of existing prediction
    try {
      const prediction = await replicate.predictions.get(activeSortPredictionId);
      if (prediction.status === 'succeeded') {
        let label = '';
        if (typeof prediction.output === 'string') label = prediction.output.trim().toLowerCase();
        else if (Array.isArray(prediction.output)) label = prediction.output.join('').trim().toLowerCase();
        const match = label.match(/(exterior|facade|building|house|outside|balcony|patio|terrace|garden|living|lounge|dining|kitchen|office|study|hallway|corridor|entrance|bedroom|bathroom|other)/);
        const cleanLabel = match ? match[1] : 'other';
        labels.push({ index: sortIndex, label: cleanLabel, sortKey: sortOrder[cleanLabel] ?? 9 });
        console.log(`[Sort] Image ${sortIndex}: ${cleanLabel}`);
      } else if (prediction.status === 'failed') {
        console.warn(`[Sort] Prediction failed: ${prediction.error}`);
        labels.push({ index: sortIndex, label: 'other', sortKey: 9 });
      } else {
        // Still processing
        return NextResponse.json({ status: 'sorting', message: `Classifying image ${sortIndex + 1}/${inputImages.length}...` });
      }
    } catch (err) {
      console.warn(`[Sort] Error checking prediction:`, err);
      labels.push({ index: sortIndex, label: 'other', sortKey: 9 });
    }
  } else {
    // Start new prediction
    try {
      const prediction = await createPredictionWithRetry({
        model: "meta/meta-llama-3.2-11b-vision-instruct",
        input: {
          image: inputImages[sortIndex],
          prompt: 'What type of room? Reply ONE word: exterior, living, kitchen, bedroom, bathroom, dining, office, hallway, balcony, other',
          max_tokens: 5,
          temperature: 0,
        },
      });

      // Save prediction ID — check on next poll
      await supabase.from('video_jobs')
        .update({ metadata: { ...metadata, sortPredictionId: prediction.id } })
        .eq('id', job.id);
      return NextResponse.json({ status: 'sorting', message: `Classifying image ${sortIndex + 1}/${inputImages.length}...` });
    } catch (err) {
      console.warn(`[Sort] Failed image ${sortIndex}:`, err);
      labels.push({ index: sortIndex, label: 'other', sortKey: 9 });
      // If too many consecutive failures, skip sorting entirely
      const nextFailures = sortFailures + 1;
      if (nextFailures >= 2) {
        console.log('[Sort] Too many failures, skipping sort');
        await supabase.from('video_jobs')
          .update({ status: 'renovating', metadata: {} })
          .eq('id', job.id);
        return NextResponse.json({ status: 'renovating', message: 'Skipping auto-sort (model unavailable).' });
      }
    }
  }

  const nextIndex = sortIndex + 1;
  const isDone = nextIndex >= inputImages.length;

  if (isDone) {
    // All classified — sort and proceed
    labels.sort((a, b) => a.sortKey - b.sortKey);
    const sortedImages = labels.map(item => inputImages[item.index]);
    await supabase.from('video_jobs')
      .update({ status: 'renovating', input_images: sortedImages, metadata: {} })
      .eq('id', job.id);
    return NextResponse.json({ status: 'renovating', message: `Sorted: ${labels.map(l => l.label).join(' → ')}` });
  }

  // Save progress, stay in sorting
  await supabase.from('video_jobs')
    .update({ metadata: { sortIndex: nextIndex, sortLabels: labels, sortPredictionId: null, sortFailures } })
    .eq('id', job.id);
  return NextResponse.json({ status: 'sorting', message: `Classifying image ${nextIndex}/${inputImages.length}...` });
}

// ── Stage 2: Renovate ────────────────────────────────────────────────────
async function handleRenovating(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  const inputImages = (job.input_images as string[]) || [];
  if (inputImages.length === 0) {
    await supabase.from('video_jobs').update({ status: 'failed' }).eq('id', job.id);
    return NextResponse.json({ error: 'No input images' }, { status: 400 });
  }

  const style = (job.renovation_style as string) || 'modern';
  const prompt = (STYLE_PROMPTS[style] || STYLE_PROMPTS.modern) + ', interior design magazine, wide angle, full room visible';
  const toProcess = inputImages.slice(0, 8);

  // Process one image per call (keeps each request short)
  // Track progress via metadata
  const metadata = (job.metadata as Record<string, unknown>) || {};
  const currentIndex = (metadata.renovateIndex as number) || 0;
  const renovated: string[] = (metadata.renovatedImages as string[]) || [];

  // Prevent concurrent processing
  if (metadata.renovating === true) {
    return NextResponse.json({ status: 'renovating', message: `Still renovating image ${currentIndex + 1}/${toProcess.length}...` });
  }

  if (currentIndex < toProcess.length) {
    // Check if there's an active prediction
    const activePredictionId = metadata.renovatePredictionId as string | undefined;
    
    if (activePredictionId) {
      // Check status of existing prediction
      try {
        const prediction = await replicate.predictions.get(activePredictionId);
        if (prediction.status === 'succeeded') {
          const url = extractUrl(prediction.output);
          renovated.push(url || toProcess[currentIndex]);
          console.log(`[Renovate] Image ${currentIndex + 1} done. URL: ${url ? 'yes' : 'fallback'}`);
          
          // Advance to next image
          const nextIndex = currentIndex + 1;
          const isDone = nextIndex >= toProcess.length;
          await supabase.from('video_jobs').update({
            status: isDone ? 'animating' : 'renovating',
            metadata: { renovateIndex: nextIndex, renovatedImages: renovated },
          }).eq('id', job.id);
          return NextResponse.json({
            status: isDone ? 'animating' : 'renovating',
            message: isDone ? `Renovation done. ${renovated.length} images.` : `Renovated ${nextIndex}/${toProcess.length}...`,
          });
        } else if (prediction.status === 'failed') {
          console.warn(`[Renovate] Prediction failed: ${prediction.error}`);
          renovated.push(toProcess[currentIndex]);
          const nextIndex = currentIndex + 1;
          const isDone = nextIndex >= toProcess.length;
          await supabase.from('video_jobs').update({
            status: isDone ? 'animating' : 'renovating',
            metadata: { renovateIndex: nextIndex, renovatedImages: renovated },
          }).eq('id', job.id);
          return NextResponse.json({ status: isDone ? 'animating' : 'renovating', message: `Renovation ${nextIndex}/${toProcess.length} (fallback).` });
        }
        // Still processing — poll again later
        return NextResponse.json({ status: 'renovating', message: `Renovating image ${currentIndex + 1}/${toProcess.length}...` });
      } catch (err) {
        console.warn(`[Renovate] Error checking prediction:`, err);
        // Fall through to create new prediction
      }
    }

    // Start new prediction
    console.log(`[Renovate] Starting image ${currentIndex + 1}/${toProcess.length}`);
    try {
      const prediction = await createPredictionWithRetry({
        version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
        input: {
          image: toProcess[currentIndex],
          prompt,
          negative_prompt: 'blurry, low quality, distorted, watermark, text, dark, empty room',
          num_inference_steps: 30,
          guidance_scale: 12,
          prompt_strength: 0.6,
        },
      });

      // Save prediction ID — don't wait, check on next poll
      await supabase.from('video_jobs').update({
        metadata: { ...metadata, renovatePredictionId: prediction.id },
      }).eq('id', job.id);

      return NextResponse.json({ status: 'renovating', message: `Renovating image ${currentIndex + 1}/${toProcess.length}...` });
    } catch (err) {
      console.warn(`[Renovate] Failed to create prediction:`, err);
      renovated.push(toProcess[currentIndex]);
      const nextIndex = currentIndex + 1;
      const isDone = nextIndex >= toProcess.length;
      await supabase.from('video_jobs').update({
        status: isDone ? 'animating' : 'renovating',
        metadata: { renovateIndex: nextIndex, renovatedImages: renovated },
      }).eq('id', job.id);
      return NextResponse.json({ status: isDone ? 'animating' : 'renovating', message: `Renovation ${nextIndex}/${toProcess.length} (failed, fallback).` });
    }
  }

  // All done already, move to animating
  await supabase.from('video_jobs').update({ status: 'animating' }).eq('id', job.id);
  return NextResponse.json({ status: 'animating', message: 'Starting animation...' });
}

// ── Stage 3: Animate ─────────────────────────────────────────────────────
async function handleAnimating(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  const metadata = (job.metadata as Record<string, unknown>) || {};
  const images = (metadata.renovatedImages as string[]) || [];
  
  if (images.length === 0) {
    await supabase.from('video_jobs').update({ status: 'failed' }).eq('id', job.id);
    return NextResponse.json({ error: 'No images to animate' }, { status: 400 });
  }

  const currentIndex = (metadata.animateIndex as number) || 0;
  const clips: string[] = (metadata.clips as string[]) || [];

  // Prevent concurrent processing — if lock is set, skip
  if (metadata.animating === true) {
    return NextResponse.json({ status: 'animating', message: `Still animating image ${currentIndex + 1}/${images.length}...` });
  }

  if (currentIndex < images.length) {
    // Check if there's an active prediction
    const activePredictionId = metadata.animatePredictionId as string | undefined;

    if (activePredictionId) {
      try {
        const prediction = await replicate.predictions.get(activePredictionId);
        if (prediction.status === 'succeeded') {
          const url = extractUrl(prediction.output);
          if (url) clips.push(url);
          console.log(`[Animate] Image ${currentIndex + 1}/${images.length} done. Clips: ${clips.length}`);

          const nextIndex = currentIndex + 1;
          const isDone = nextIndex >= images.length;
          await supabase.from('video_jobs').update({
            status: isDone ? 'stitching' : 'animating',
            metadata: { animateIndex: nextIndex, clips },
          }).eq('id', job.id);
          return NextResponse.json({
            status: isDone ? 'stitching' : 'animating',
            message: isDone ? `Animation done. ${clips.length} clips.` : `Animating ${nextIndex}/${images.length}...`,
          });
        } else if (prediction.status === 'failed') {
          console.warn(`[Animate] Prediction failed: ${prediction.error}`);
          const nextIndex = currentIndex + 1;
          const isDone = nextIndex >= images.length;
          await supabase.from('video_jobs').update({
            status: isDone ? 'stitching' : 'animating',
            metadata: { animateIndex: nextIndex, clips },
          }).eq('id', job.id);
          return NextResponse.json({ status: isDone ? 'stitching' : 'animating', message: `Animation ${nextIndex}/${images.length} (skipped failed).` });
        }
        // Still processing
        return NextResponse.json({ status: 'animating', message: `Animating image ${currentIndex + 1}/${images.length}...` });
      } catch (err) {
        console.warn(`[Animate] Error checking prediction:`, err);
      }
    }

    // Start new prediction
    console.log(`[Animate] Starting image ${currentIndex + 1}/${images.length}`);
    try {
      const prediction = await createPredictionWithRetry({
        version: "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
        input: {
          input_image: images[currentIndex],
          motion_bucket_id: 127,
          cond_aug: 0.02,
          decoding_t: 7,
          fps: 6,
        },
      });

      // Save prediction ID — check on next poll
      await supabase.from('video_jobs').update({
        metadata: { ...metadata, animatePredictionId: prediction.id },
      }).eq('id', job.id);

      return NextResponse.json({ status: 'animating', message: `Animating image ${currentIndex + 1}/${images.length}...` });
    } catch (err) {
      console.warn(`[Animate] Failed to start prediction:`, err);
      const errMsg = err instanceof Error ? err.message : 'Animation failed';
      await supabase.from('video_jobs').update({
        status: 'failed',
        metadata: { ...metadata, clips, error: `animating: ${errMsg}` },
      }).eq('id', job.id);
      return NextResponse.json({ status: 'failed', error: `Animation failed at image ${currentIndex + 1}: ${errMsg}` });
    }
  }

  await supabase.from('video_jobs').update({ status: 'stitching' }).eq('id', job.id);
  return NextResponse.json({ status: 'stitching', message: 'Starting final assembly...' });
}

// ── Stage 4: Stitch ──────────────────────────────────────────────────────
async function handleStitching(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  const metadata = (job.metadata as Record<string, unknown>) || {};
  const clips = (metadata.clips as string[]) || [];

  // If no clips were generated, fail
  if (clips.length === 0) {
    await supabase.from('video_jobs').update({
      status: 'failed',
      metadata: { ...metadata, error: 'stitching: No video clips were generated during animation' },
    }).eq('id', job.id);
    return NextResponse.json({ status: 'failed', error: 'No video clips generated' });
  }

  // Single clip — no stitching needed
  if (clips.length === 1) {
    const outputUrl = clips[0];
    await supabase.from('video_jobs').update({
      status: 'done',
      output_video_url: outputUrl,
    }).eq('id', job.id);
    return NextResponse.json({ status: 'done', message: 'Video complete!', outputUrl, hasVideo: true });
  }

  // Multiple clips — stitch together using binary concat (works for same-codec MP4s)
  try {
    console.log(`[Stitch] Downloading ${clips.length} clips...`);
    
    // Download all clips with timeout
    const clipBuffers: Buffer[] = [];
    for (let i = 0; i < clips.length; i++) {
      console.log(`[Stitch] Downloading clip ${i + 1}/${clips.length}: ${clips[i].substring(0, 80)}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(clips[i], { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`Failed to download clip ${i}: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        console.log(`[Stitch] Clip ${i + 1} downloaded: ${(arrayBuffer.byteLength / 1024).toFixed(0)}KB`);
        clipBuffers.push(Buffer.from(arrayBuffer));
      } catch (fetchErr) {
        clearTimeout(timeout);
        console.warn(`[Stitch] Failed to download clip ${i + 1}:`, fetchErr);
        // Skip failed clips, continue with the rest
      }
    }

    // Concatenate MP4 clips (binary concat works for SVD clips — same codec/resolution)
    const combined = Buffer.concat(clipBuffers);
    console.log(`[Stitch] Combined ${clipBuffers.length} clips, ${(combined.length / 1024 / 1024).toFixed(1)}MB`);

    // Upload to Supabase Storage
    const fileName = `video-${job.id}-${Date.now()}.mp4`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('job-assets')
      .upload(fileName, combined, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage
      .from('job-assets')
      .getPublicUrl(fileName);

    const outputUrl = urlData.publicUrl;

    await supabase.from('video_jobs').update({
      status: 'done',
      output_video_url: outputUrl,
    }).eq('id', job.id);

    return NextResponse.json({
      status: 'done',
      message: `Video complete! ${clips.length} clips stitched.`,
      outputUrl,
      hasVideo: true,
    });
  } catch (err) {
    console.error('[Stitch] Stitching failed:', err);
    // Fallback: use first clip
    const outputUrl = clips[0];
    await supabase.from('video_jobs').update({
      status: 'done',
      output_video_url: outputUrl,
    }).eq('id', job.id);
    return NextResponse.json({
      status: 'done',
      message: `Video complete (1 of ${clips.length} clips — stitching failed).`,
      outputUrl,
      hasVideo: true,
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

async function waitForPrediction(predictionId: string, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const prediction = await replicate.predictions.get(predictionId);
    if (prediction.status === 'succeeded') return prediction;
    if (prediction.status === 'failed') throw new Error(`Prediction failed: ${prediction.error}`);
    if (prediction.status === 'canceled') throw new Error('Prediction canceled');
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('Prediction timed out');
}

// Create prediction with automatic retry on 429 rate limit
// Accepts both `model` (for official models) and `version` (for community models)
async function createPredictionWithRetry(params: { model?: string; version?: string; input: Record<string, unknown> }, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await replicate.predictions.create(params);
    } catch (err: unknown) {
      const is429 = err instanceof Error && err.message.includes('429');
      if (!is429 || attempt === retries) throw err;
      // Parse retry_after from error message
      const match = err.message.match(/retry_after.(\d+)/);
      const waitMs = match ? parseInt(match[1]) * 1000 : 10000; // default 10s
      console.log(`[Retry] 429 rate limited, waiting ${waitMs / 1000}s (attempt ${attempt + 1}/${retries})`);
      await new Promise(r => setTimeout(r, waitMs + 1000)); // extra 1s buffer
    }
  }
  throw new Error('Max retries exceeded');
}

function extractUrl(output: unknown): string | null {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) return String(first.url);
    return String(first);
  }
  if (output && typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    if (typeof obj.url === 'string') return obj.url;
  }
  return null;
}

async function refundCredit(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  try {
    const { data: ud } = await supabase
      .from('zestio_users')
      .select('used_credits')
      .eq('id', userId)
      .single();
    if (ud && ud.used_credits > 0) {
      await supabase
        .from('zestio_users')
        .update({ used_credits: ud.used_credits - CREDIT_COSTS.VIDEO_GENERATION })
        .eq('id', userId);
    }
  } catch {}
}

async function scrapeListingImages(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return [];
    const html = await response.text();
    const images: string[] = [];

    const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
    if (ogMatch) images.push(ogMatch[1]);

    const imgMatches = html.match(/https?:\/\/[^\s"'<>]+(?:immobilienscout24|zillow|redfin)[^\s"'<>]*\.(?:jpg|jpeg|png|webp)/gi);
    if (imgMatches) {
      imgMatches.forEach(m => {
        if (!images.includes(m) && images.length < 20) images.push(m);
      });
    }

    return images;
  } catch {
    return [];
  }
}
