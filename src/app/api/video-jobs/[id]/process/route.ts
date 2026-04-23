// Process a video job stage by stage
// Called by client polling — each call advances one stage

import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@/utils/supabase/server';

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
    const currentStatus = await supabase.from('video_jobs').select('status').eq('id', jobId).single();
    const failedStage = currentStatus.data?.status || 'unknown';
    await supabase.from('video_jobs').update({
      status: 'failed',
      metadata: { error: `${failedStage}: ${msg}` },
    }).eq('id', jobId);
    return NextResponse.json({ error: msg, failedStage }, { status: 500 });
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

  // Store images and move to renovating
  await supabase
    .from('video_jobs')
    .update({ status: 'renovating' })
    .eq('id', job.id);

  return NextResponse.json({
    status: 'renovating',
    message: `Found ${images.length} images. Starting renovation.`,
    imageCount: images.length,
  });
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

  if (currentIndex < toProcess.length) {
    console.log(`[VideoProcess] Renovating image ${currentIndex + 1}/${toProcess.length}`);
    try {
      const prediction = await replicate.predictions.create({
        model: "adirik/interior-design",
        input: {
          image: toProcess[currentIndex],
          prompt,
          negative_prompt: 'blurry, low quality, distorted, watermark, text, dark, empty room',
          num_inference_steps: 30,
          guidance_scale: 12,
          prompt_strength: 0.6,
        },
      });

      const result = await waitForPrediction(prediction.id);
      const url = extractUrl(result.output);
      if (url) {
        renovated.push(url);
      } else {
        // Fallback to original
        renovated.push(toProcess[currentIndex]);
      }
    } catch (err) {
      console.warn(`[VideoProcess] Renovation failed for image ${currentIndex}:`, err);
      renovated.push(toProcess[currentIndex]);
    }

    // Save progress
    const nextIndex = currentIndex + 1;
    const isDone = nextIndex >= toProcess.length;

    await supabase
      .from('video_jobs')
      .update({
        status: isDone ? 'animating' : 'renovating',
        metadata: {
          ...metadata,
          renovateIndex: nextIndex,
          renovatedImages: renovated,
        },
      })
      .eq('id', job.id);

    return NextResponse.json({
      status: isDone ? 'animating' : 'renovating',
      message: isDone
        ? `Renovation complete. ${renovated.length} images ready.`
        : `Renovated ${nextIndex}/${toProcess.length} images...`,
      progress: nextIndex / toProcess.length,
    });
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

  if (currentIndex < images.length) {
    console.log(`[VideoProcess] Animating image ${currentIndex + 1}/${images.length}`);
    try {
      const prediction = await replicate.predictions.create({
        model: "stability-ai/stable-video-diffusion",
        input: {
          input_image: images[currentIndex],
          motion_bucket_id: 127,
          cond_aug: 0.02,
          decoding_t: 7,
          fps: 6,
        },
      });

      const result = await waitForPrediction(prediction.id, 180000);
      const url = extractUrl(result.output);
      if (url) clips.push(url);
    } catch (err) {
      console.warn(`[VideoProcess] Animation failed for image ${currentIndex}:`, err);
      // Hard fail on animation error
      const errMsg = err instanceof Error ? err.message : 'Animation failed';
      await supabase.from('video_jobs').update({
        status: 'failed',
        metadata: { ...metadata, animateIndex: nextIndex, clips, error: `animating: ${errMsg}` },
      }).eq('id', job.id);
      return NextResponse.json({ status: 'failed', error: `Animation failed at image ${currentIndex + 1}: ${errMsg}` });
    }

    const nextIndex = currentIndex + 1;
    const isDone = nextIndex >= images.length;

    await supabase
      .from('video_jobs')
      .update({
        status: isDone ? 'stitching' : 'animating',
        metadata: { ...metadata, animateIndex: nextIndex, clips },
      })
      .eq('id', job.id);

    return NextResponse.json({
      status: isDone ? 'stitching' : 'animating',
      message: isDone
        ? `Animation complete. ${clips.length} clips ready.`
        : `Animating ${nextIndex}/${images.length}...`,
      progress: nextIndex / images.length,
    });
  }

  await supabase.from('video_jobs').update({ status: 'stitching' }).eq('id', job.id);
  return NextResponse.json({ status: 'stitching', message: 'Starting final assembly...' });
}

// ── Stage 4: Stitch ──────────────────────────────────────────────────────
async function handleStitching(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  const metadata = (job.metadata as Record<string, unknown>) || {};
  const clips = (metadata.clips as string[]) || [];
  const images = (metadata.renovatedImages as string[]) || [];

  // If no clips were generated, fail
  if (clips.length === 0) {
    await supabase.from('video_jobs').update({
      status: 'failed',
      metadata: { ...metadata, error: 'stitching: No video clips were generated during animation' },
    }).eq('id', job.id);
    return NextResponse.json({ status: 'failed', error: 'No video clips generated' });
  }

  const outputUrl = clips[0];

  await supabase
    .from('video_jobs')
    .update({
      status: 'done',
      output_video_url: outputUrl,
    })
    .eq('id', job.id);

  return NextResponse.json({
    status: 'done',
    message: `Video complete! ${clips.length} clips generated.`,
    outputUrl,
    hasVideo: true,
  });
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
        .update({ used_credits: ud.used_credits - 1 })
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
