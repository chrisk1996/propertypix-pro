// Video Jobs API — Inline Processing (no Redis/BullMQ required)
// POST /api/video-jobs - Create and process video job
// GET /api/video-jobs - List user's video jobs

import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@/utils/supabase/server';
import { detectPlatform } from '@/lib/video-pipeline-queue';

export const dynamic = 'force-dynamic';
import { authenticateRequest } from '@/lib/api-auth';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

// Style prompts for AI renovation
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

// POST - Create and immediately process video job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      listing_url,
      manual_images,
      renovation_style = 'modern',
      music_genre = 'cinematic'
    } = body;

    const isManualMode = Array.isArray(manual_images) && manual_images.length >= 5;
    if (!listing_url && !isManualMode) {
      return NextResponse.json(
        { error: 'Either listing_url or manual_images (min 5) is required' },
        { status: 400 }
      );
    }

    let normalizedUrl = listing_url || '';
    if (normalizedUrl && normalizedUrl !== 'manual-mode') {
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      try { new URL(normalizedUrl); } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    }

    // Check credits
    const { data: userData } = await supabase
      .from('zestio_users')
      .select('credits, used_credits')
      .eq('id', user.id)
      .single();

    const hasUnlimited = userData?.credits === -1;
    if (!hasUnlimited && ((userData?.credits ?? 0) - (userData?.used_credits ?? 0)) < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('video_jobs')
      .insert({
        user_id: user.id,
        listing_url: normalizedUrl || 'manual-mode',
        renovation_style,
        music_genre,
        status: 'scraping',
        credits_used: 1,
        input_images: isManualMode ? manual_images : null,
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    // Deduct credit
    if (!hasUnlimited) {
      try {
        await supabase.rpc('deduct_credits', { p_user_id: user.id, p_amount: 1 });
      } catch {
        await supabase
          .from('zestio_users')
          .update({
            credits: Math.max(0, (userData?.credits ?? 0) - 1),
            used_credits: (userData?.used_credits ?? 0) + 1,
          })
          .eq('id', user.id);
      }
    }

    // Return job ID immediately, then process in background
    // Use waitUntil pattern: return response, then continue processing
    const jobId = job.id;

    // Start processing asynchronously (fire and forget from HTTP perspective)
    // We return the job ID and the client polls for status
    processVideoJob(jobId, {
      userId: user.id,
      listingUrl: normalizedUrl,
      style: renovation_style,
      musicGenre: music_genre,
      inputImages: isManualMode ? manual_images : undefined,
      isManualMode,
    }).catch(err => {
      console.error(`[VideoJob ${jobId}] Pipeline failed:`, err);
    });

    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: 'scraping',
      message: 'Video job created and processing started',
    });
  } catch (error) {
    console.error('Video job creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create video job' },
      { status: 500 }
    );
  }
}

// ── Inline Video Pipeline ────────────────────────────────────────────────
async function processVideoJob(
  jobId: string,
  config: {
    userId: string;
    listingUrl: string;
    style: string;
    musicGenre: string;
    inputImages?: string[];
    isManualMode: boolean;
  }
) {
  const supabase = await createClient();

  try {
    // Stage 1: Get images
    let images: string[];

    if (config.isManualMode && config.inputImages?.length) {
      images = config.inputImages;
      console.log(`[VideoJob ${jobId}] Using ${images.length} manual images`);
    } else if (config.listingUrl && config.listingUrl !== 'manual-mode') {
      // Try to scrape images from listing URL
      await updateStatus(supabase, jobId, 'scraping');
      images = await scrapeListingImages(config.listingUrl);
      console.log(`[VideoJob ${jobId}] Scraped ${images.length} images`);
    } else {
      throw new Error('No images available — provide listing URL or upload images');
    }

    if (images.length === 0) {
      // Can't scrape images — set status to indicate manual upload needed
      await supabase
        .from('video_jobs')
        .update({ status: 'needs_images' })
        .eq('id', jobId);
      console.log(`[VideoJob ${jobId}] No images scraped. Job set to needs_images.`);
      // Refund credit
      try {
        const { data: ud } = await supabase
          .from('zestio_users')
          .select('used_credits')
          .eq('id', config.userId)
          .single();
        if (ud && ud.used_credits > 0) {
          await supabase
            .from('zestio_users')
            .update({ used_credits: ud.used_credits - 1 })
            .eq('id', config.userId);
        }
      } catch {}
      return;
    }

    // Stage 2: AI Renovation (optional — enhance images)
    await updateStatus(supabase, jobId, 'renovating');
    const prompt = STYLE_PROMPTS[config.style] || STYLE_PROMPTS.modern;
    
    const renovatedImages: string[] = [];
    // Process up to 8 images to keep costs reasonable
    const imagesToProcess = images.slice(0, 8);

    for (let i = 0; i < imagesToProcess.length; i++) {
      try {
        console.log(`[VideoJob ${jobId}] Renovating image ${i + 1}/${imagesToProcess.length}`);
        const prediction = await replicate.predictions.create({
          model: "adirik/interior-design",
          input: {
            image: imagesToProcess[i],
            prompt: prompt + ', interior design magazine, wide angle, full room visible',
            negative_prompt: 'blurry, low quality, distorted, watermark, text, dark, empty room',
            num_inference_steps: 30,
            guidance_scale: 12,
            prompt_strength: 0.6,
          },
        });

        const result = await waitForReplicatePrediction(prediction.id);
        const outputUrl = extractUrl(result.output);
        if (outputUrl) {
          renovatedImages.push(outputUrl);
        }
      } catch (err) {
        console.warn(`[VideoJob ${jobId}] Renovation failed for image ${i}, using original`);
        renovatedImages.push(imagesToProcess[i]);
      }
    }

    console.log(`[VideoJob ${jobId}] Renovated ${renovatedImages.length}/${imagesToProcess.length} images`);

    // Stage 3: Animate images into video clips using Replicate image-to-video
    await updateStatus(supabase, jobId, 'animating');
    const clipUrls: string[] = [];

    for (let i = 0; i < renovatedImages.length; i++) {
      try {
        console.log(`[VideoJob ${jobId}] Animating clip ${i + 1}/${renovatedImages.length}`);
        
        // Use stable-video-diffusion for short clips
        const prediction = await replicate.predictions.create({
          version: "stability-ai/stable-video-diffusion",
          input: {
            input_image: renovatedImages[i],
            motion_bucket_id: 127,
            cond_aug: 0.02,
            decoding_t: 7,
            fps: 6,
          },
        });

        const result = await waitForReplicatePrediction(prediction.id, 180000); // 3 min timeout
        const clipUrl = extractUrl(result.output);
        if (clipUrl) {
          clipUrls.push(clipUrl);
        }
      } catch (err) {
        console.warn(`[VideoJob ${jobId}] Animation failed for image ${i}:`, err);
        // Continue with remaining images
      }

      // Rate limit between requests
      if (i < renovatedImages.length - 1) {
        await sleep(2000);
      }
    }

    console.log(`[VideoJob ${jobId}] Generated ${clipUrls.length} clips`);

    if (clipUrls.length === 0) {
      // Fallback: just use the renovated images as a slideshow
      // Store first image as thumbnail
      await supabase
        .from('video_jobs')
        .update({
          status: 'stitching',
          thumbnail_url: renovatedImages[0],
        })
        .eq('id', jobId);
      
      // For now, mark as done with first image as output (video stitching needs FFmpeg)
      await supabase
        .from('video_jobs')
        .update({
          status: 'done',
          output_video_url: null,
        })
        .eq('id', jobId);

      console.log(`[VideoJob ${jobId}] Completed with ${renovatedImages.length} images (no video stitching yet)`);
      return;
    }

    // Stage 4: Stitch — for now, store clips and mark done
    // Full video stitching with FFmpeg/Modal would go here
    await updateStatus(supabase, jobId, 'stitching');

    await supabase
      .from('video_jobs')
      .update({
        status: 'done',
        output_video_url: clipUrls[0],
      })
      .eq('id', jobId);

    console.log(`[VideoJob ${jobId}] Completed with ${clipUrls.length} clips`);

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[VideoJob ${jobId}] Failed:`, msg);
    await supabase
      .from('video_jobs')
      .update({ status: 'failed' })
      .eq('id', jobId);

    // Refund credit
    try {
      const { data: ud } = await supabase
        .from('zestio_users')
        .select('used_credits')
        .eq('id', config.userId)
        .single();
      if (ud && ud.used_credits > 0) {
        await supabase
          .from('zestio_users')
          .update({ used_credits: ud.used_credits - 1 })
          .eq('id', config.userId);
      }
    } catch {}
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

async function updateStatus(supabase: Awaited<ReturnType<typeof createClient>>, jobId: string, status: string) {
  await supabase.from('video_jobs').update({ status }).eq('id', jobId);
}

async function waitForReplicatePrediction(predictionId: string, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const prediction = await replicate.predictions.get(predictionId);
    if (prediction.status === 'succeeded') return prediction;
    if (prediction.status === 'failed') throw new Error(`Prediction failed: ${prediction.error}`);
    if (prediction.status === 'canceled') throw new Error('Prediction canceled');
    await sleep(3000);
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Scrape images from listing URL
async function scrapeListingImages(url: string): Promise<string[]> {
  // For ImmoScout24 and similar portals, we'd need Apify or a headless browser
  // For now, try fetching the page and extracting og:image meta tags
  try {
    console.log(`[Scrape] Fetching ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return [];

    const html = await response.text();
    const images: string[] = [];

    // Extract og:image
    const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
    if (ogMatch) images.push(ogMatch[1]);

    // Extract meta images
    const metaImages = html.match(/property="og:image:?(?:url)?]?"\s+content="([^"]+)"/g);
    if (metaImages) {
      metaImages.forEach(m => {
        const url = m.match(/content="([^"]+)"/)?.[1];
        if (url && !images.includes(url)) images.push(url);
      });
    }

    // Extract large image src attributes (common patterns for property images)
    const imgMatches = html.match(/https?:\/\/[^\s"'<>]+(?:immobilienscout24|zillow|redfin)[^\s"'<>]*\.(?:jpg|jpeg|png|webp)/gi);
    if (imgMatches) {
      imgMatches.forEach(m => {
        if (!images.includes(m) && images.length < 20) images.push(m);
      });
    }

    console.log(`[Scrape] Found ${images.length} images from ${url}`);
    return images;
  } catch (err) {
    console.warn(`[Scrape] Failed to fetch ${url}:`, err);
    return [];
  }
}

// GET - List user's video jobs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const status = searchParams.get('status');

    let query = supabase
      .from('video_jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error: fetchError, count } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({
      jobs,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Video jobs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video jobs' },
      { status: 500 }
    );
  }
}
