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

// ── Sort categories (spec-aligned) ────────────────────────────────────────
const SORT_CATEGORIES = [
  'exterior_front', 'exterior_garden',
  'living_room', 'kitchen', 'dining',
  'bedroom', 'bathroom', 'detail',
] as const;

const SORT_ORDER: Record<string, number> = {
  exterior_front: 0, exterior_garden: 1,
  living_room: 2, kitchen: 3, dining: 4,
  bedroom: 5, bathroom: 6, detail: 7,
  other: 8,
};

const MAX_PER_CATEGORY: Record<string, number> = {
  exterior_front: 2, exterior_garden: 1,
  living_room: 2, kitchen: 2, dining: 1,
  bedroom: 2, bathroom: 1, detail: 1,
  other: 1,
};

const MAX_SORTED_IMAGES = 12;

// Map freeform/legacy labels → spec categories
const LABEL_MAP: Record<string, string> = {
  exterior: 'exterior_front', facade: 'exterior_front', building: 'exterior_front',
  house: 'exterior_front', outside: 'exterior_front',
  garden: 'exterior_garden', yard: 'exterior_garden', patio: 'exterior_garden',
  balcony: 'exterior_garden', terrace: 'exterior_garden',
  living: 'living_room', lounge: 'living_room', living_room: 'living_room',
  kitchen: 'kitchen',
  dining: 'dining', dining_room: 'dining',
  bedroom: 'bedroom',
  bathroom: 'bathroom',
  office: 'detail', study: 'detail', hallway: 'detail',
  corridor: 'detail', entrance: 'detail',
};

// Motion prompts per category (spec-aligned)
const MOTION_PROMPTS: Record<string, string> = {
  exterior_front: 'smooth slow dolly zoom in, luxury real estate, golden hour, cinematic',
  exterior_garden: 'gentle aerial drift across garden, wide establishing shot, cinematic',
  living_room: 'slow pan left to right, warm interior lighting, cinematic property tour',
  kitchen: 'slow tilt up revealing kitchen, modern interior, crisp lighting',
  dining: 'gentle push forward toward dining table, warm ambient light',
  bedroom: 'slow push in toward window, soft morning light, luxury bedroom',
  bathroom: 'gentle pan across bathroom, spa-like atmosphere, clean whites',
  detail: 'macro slow zoom in, architectural detail, shallow depth of field',
};
// Asset URLs — Supabase Storage (public bucket)
const ASSETS_BASE = 'https://dsotmgpvrstegxqgxkdh.supabase.co/storage/v1/object/public/assets';

// Music tracks — auto-select by listing price/style
const MUSIC_TRACKS: Record<string, string> = {
  cinematic: `${ASSETS_BASE}/music/ambient_cinematic.mp3`,
  upbeat: `${ASSETS_BASE}/music/upbeat_modern.mp3`,
  ambient: `${ASSETS_BASE}/music/soft_ambient.mp3`,
  // Genre overrides from user selection
  uplifting: `${ASSETS_BASE}/music/upbeat_modern.mp3`,
  acoustic: `${ASSETS_BASE}/music/soft_ambient.mp3`,
  electronic: `${ASSETS_BASE}/music/upbeat_modern.mp3`,
  jazz: `${ASSETS_BASE}/music/soft_ambient.mp3`,
  classical: `${ASSETS_BASE}/music/ambient_cinematic.mp3`,
};

// Branding
const WATERMARK_LOGO_URL = `${ASSETS_BASE}/brand/watermark.png`;

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
      case 'twilighting':
        return await handleTwilighting(supabase, job);
      case 'enhancing':
        return await handleEnhancing(supabase, job);
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
// ── Apify actor registry ─────────────────────────────────────────────────
// Format: username~actor-name (Apify API uses tilde, not slash)
const APIFY_ACTORS: Record<string, { actorId: string; imageField: string; inputKey: string; inputFormat: 'urlObjects' | 'plainString' }> = {
  'immobilienscout24.de': { actorId: 'rigelbytes~immobilienscout24-scraper', imageField: 'images', inputKey: 'link', inputFormat: 'plainString' },
  'immowelt.de': { actorId: 'rigelbytes~immowelt-scraper', imageField: 'images', inputKey: 'link', inputFormat: 'plainString' },
  'zillow.com': { actorId: 'maxcopell~zillow-detail-scraper', imageField: 'photos', inputKey: 'startUrls', inputFormat: 'urlObjects' },
  'rightmove.co.uk': { actorId: 'dhrungin~rightmove-scraper', imageField: 'images', inputKey: 'startUrls', inputFormat: 'urlObjects' },
  'idealista.com': { actorId: 'tri_angle~idealista-scraper', imageField: 'images', inputKey: 'startUrls', inputFormat: 'urlObjects' },
};

function getApifyActor(url: string) {
  for (const [domain, config] of Object.entries(APIFY_ACTORS)) {
    if (url.includes(domain)) return config;
  }
  return null; // fallback to basic scraper
}

async function handleScraping(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  let images: string[] = [];
  const metadata = (job.metadata as Record<string, unknown>) || {};

  // Manual mode — use uploaded images
  const inputImages = job.input_images as string[] | null;
  if (Array.isArray(inputImages) && inputImages.length >= 1) {
    images = inputImages;
  } else {
    const url = job.listing_url as string;
    if (!url || url === 'manual-mode') {
      await supabase.from('video_jobs').update({ status: 'needs_images' }).eq('id', job.id);
      await refundCredit(supabase, job.user_id as string);
      return NextResponse.json({ status: 'needs_images', message: 'No images found. Switch to manual upload.' });
    }

    // Check if Apify run is in progress
    const apifyRunId = metadata.apifyRunId as string | undefined;
    if (apifyRunId) {
      // Poll Apify run status
      images = await pollApifyRun(apifyRunId, getApifyActor(url)?.imageField || 'images');
      if (images.length === 0) {
        // Still running or failed — check if run is still going
        const status = await getApifyRunStatus(apifyRunId);
        if (status === 'RUNNING' || status === 'READY') {
          return NextResponse.json({ status: 'scraping', message: 'Extracting images from listing...' });
        }
        // Run finished with no images — try basic scraper as fallback
        console.log('[Scrape] Apify returned no images, trying basic scraper');
        images = await scrapeListingImages(url);
      }
    } else {
      // Try Apify first (if matching actor exists)
      const actor = getApifyActor(url);
      if (actor && process.env.APIFY_API_TOKEN) {
        try {
          const runId = await startApifyRun(actor.actorId, url, actor.inputKey, actor.inputFormat);
          await supabase.from('video_jobs').update({
            metadata: { ...metadata, apifyRunId: runId },
          }).eq('id', job.id);
          return NextResponse.json({ status: 'scraping', message: 'Extracting images via Apify...' });
        } catch (err) {
          console.warn('[Scrape] Apify failed, trying basic scraper:', err);
        }
      }
      // Fallback: basic scraper
      images = await scrapeListingImages(url);
    }
  }

  if (images.length === 0) {
    await supabase.from('video_jobs').update({ status: 'needs_images' }).eq('id', job.id);
    await refundCredit(supabase, job.user_id as string);
    return NextResponse.json({ status: 'needs_images', message: 'No images found. Switch to manual upload.' });
  }

  // Store images and move to sorting
  await supabase.from('video_jobs').update({
    status: 'sorting',
    input_images: images.slice(0, 30),
    metadata: { ...metadata, apifyRunId: undefined },
  }).eq('id', job.id);

  return NextResponse.json({
    status: 'sorting',
    message: `Found ${images.length} images. Auto-sorting...`,
    imageCount: images.length,
  });
}

// ── Stage 2: Sort — LLaVA classification + walkthrough ordering + dedup ─
async function handleSorting(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  const inputImages = (job.input_images as string[]) || [];
  if (inputImages.length <= 1) {
    const singleLabel = inputImages.length === 1 ? [{ index: 0, label: 'other', sortKey: 8 }] : [];
    await supabase.from('video_jobs').update({ status: 'twilighting', metadata: { sortLabels: singleLabel } }).eq('id', job.id);
    return NextResponse.json({ status: 'twilighting', message: 'Only one image, skipping sort.' });
  }

  console.log(`[Sort] Classifying ${inputImages.length} images with LLaVA`);

  const metadata = (job.metadata as Record<string, unknown>) || {};
  const sortIndex = (metadata.sortIndex as number) || 0;
  const labels = (metadata.sortLabels as Array<{ index: number; label: string; sortKey: number }>) || [];

  // Already classified all?
  if (sortIndex >= inputImages.length && labels.length > 0) {
    const result = finalizeSort(labels, inputImages);
    await supabase.from('video_jobs').update({
      status: 'twilighting',
      input_images: result.sortedImages,
      metadata: { ...metadata, sortLabels: result.labels, sortIndex: 0, sortPredictionId: null },
    }).eq('id', job.id);
    return NextResponse.json({ status: 'twilighting', message: `Sorted: ${result.labels.map(l => l.label).join(' → ')}` });
  }

  // Check active prediction
  const activeSortPredictionId = metadata.sortPredictionId as string | undefined;
  if (activeSortPredictionId) {
    try {
      const prediction = await replicate.predictions.get(activeSortPredictionId);
      if (prediction.status === 'succeeded') {
        let raw = '';
        if (typeof prediction.output === 'string') raw = prediction.output.trim().toLowerCase();
        else if (Array.isArray(prediction.output)) raw = prediction.output.join('').trim().toLowerCase();
        const match = raw.match(/\b([a-z_]+)\b/);
        const rawLabel = match ? match[1] : 'other';
        const category = LABEL_MAP[rawLabel] || ((SORT_CATEGORIES as readonly string[]).includes(rawLabel) ? rawLabel : 'other');
        labels.push({ index: sortIndex, label: category, sortKey: SORT_ORDER[category] ?? 8 });
        console.log(`[Sort] Image ${sortIndex}: ${rawLabel} → ${category}`);
      } else if (prediction.status === 'failed') {
        console.warn(`[Sort] Prediction failed: ${prediction.error}`);
        labels.push({ index: sortIndex, label: 'other', sortKey: 8 });
      } else {
        return NextResponse.json({ status: 'sorting', message: `Classifying image ${sortIndex + 1}/${inputImages.length}...` });
      }
    } catch (err) {
      console.warn(`[Sort] Error checking prediction:`, err);
      labels.push({ index: sortIndex, label: 'other', sortKey: 8 });
    }
  } else {
    // Start new prediction
    try {
      const prediction = await createPredictionWithRetry({
        version: "72ccb656353c348c1385df54b237eeb7bfa874bf11486cf0b9473e691b662d31",
        input: {
          image: inputImages[sortIndex],
          prompt: `Classify this real estate photo into exactly one category: ${SORT_CATEGORIES.join(', ')}. Reply with ONLY the category name, nothing else.`,
          temperature: 0.2,
          max_tokens: 1024,
          top_p: 1,
        },
      });
      await supabase.from('video_jobs').update({ metadata: { ...metadata, sortPredictionId: prediction.id } }).eq('id', job.id);
      return NextResponse.json({ status: 'sorting', message: `Classifying image ${sortIndex + 1}/${inputImages.length}...` });
    } catch (err) {
      console.warn(`[Sort] Failed image ${sortIndex}:`, err);
      labels.push({ index: sortIndex, label: 'other', sortKey: 8 });
      const sortFailures = ((metadata.sortFailures as number) || 0) + 1;
      if (sortFailures >= 2) {
        console.log('[Sort] Too many failures, skipping sort');
        await supabase.from('video_jobs').update({ status: 'twilighting', metadata: { sortLabels: [] } }).eq('id', job.id);
        return NextResponse.json({ status: 'twilighting', message: 'Skipping auto-sort (model unavailable).' });
      }
      await supabase.from('video_jobs').update({ metadata: { ...metadata, sortFailures } }).eq('id', job.id);
    }
  }

  // Advance
  const nextIndex = sortIndex + 1;
  if (nextIndex >= inputImages.length) {
    const result = finalizeSort(labels, inputImages);
    await supabase.from('video_jobs').update({
      status: 'twilighting',
      input_images: result.sortedImages,
      metadata: { ...metadata, sortLabels: result.labels, sortIndex: 0, sortPredictionId: null },
    }).eq('id', job.id);
    return NextResponse.json({ status: 'twilighting', message: `Sorted: ${result.labels.map(l => l.label).join(' → ')}` });
  }

  await supabase.from('video_jobs').update({
    metadata: { ...metadata, sortIndex: nextIndex, sortLabels: labels, sortPredictionId: null },
  }).eq('id', job.id);
  return NextResponse.json({ status: 'sorting', message: `Classifying image ${nextIndex + 1}/${inputImages.length}...` });
}

// Dedup by category (max N per category), walkthrough order, cap at 12
function finalizeSort(labels: Array<{ index: number; label: string; sortKey: number }>, images: string[]) {
  const categoryCounts: Record<string, number> = {};
  const deduped: Array<{ index: number; label: string; sortKey: number }> = [];
  for (const item of labels) {
    const max = MAX_PER_CATEGORY[item.label] ?? 1;
    const count = categoryCounts[item.label] || 0;
    if (count < max) {
      deduped.push(item);
      categoryCounts[item.label] = count + 1;
    }
  }
  deduped.sort((a, b) => a.sortKey - b.sortKey);
  const capped = deduped.slice(0, MAX_SORTED_IMAGES);
  return { labels: capped, sortedImages: capped.map(item => images[item.index]) };
}

// ── Stage 3: Twilight — SDXL img2img for exterior shots only ───────────
async function handleTwilighting(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  const metadata = (job.metadata as Record<string, unknown>) || {};
  const inputImages = (job.input_images as string[]) || [];
  const sortLabels = (metadata.sortLabels as Array<{ index: number; label: string; sortKey: number }>) || [];

  // Only twilight exterior_front and exterior_garden (spec categories)
  const exteriorIndices = sortLabels
    .filter(l => ['exterior_front', 'exterior_garden'].includes(l.label))
    .map(l => l.index);

  if (exteriorIndices.length === 0) {
    console.log('[Twilight] No exterior images, skipping');
    await supabase.from('video_jobs').update({ status: 'enhancing' }).eq('id', job.id);
    return NextResponse.json({ status: 'enhancing', message: 'No exterior images to twilight.' });
  }

  // Process one exterior image per poll
  const twilightIndex = (metadata.twilightIndex as number) || 0;
  const twilightedImages = (metadata.twilightedImages as Record<number, string>) || {};

  if (twilightIndex >= exteriorIndices.length) {
    // All done — apply twilight images to input_images and move to renovating
    const updatedImages = [...inputImages];
    for (const [idx, url] of Object.entries(twilightedImages)) {
      updatedImages[parseInt(idx)] = url as string;
    }
    console.log(`[Twilight] Done. Enhanced ${Object.keys(twilightedImages).length} exterior images.`);
    await supabase.from('video_jobs')
      .update({ status: 'enhancing', input_images: updatedImages, metadata: { ...metadata, twilightedImages: undefined, twilightIndex: undefined } })
      .eq('id', job.id);
    return NextResponse.json({ status: 'enhancing', message: `Twilight enhanced ${Object.keys(twilightedImages).length} exterior shots.` });
  }

  const imageIdx = exteriorIndices[twilightIndex];
  const imageUrl = inputImages[imageIdx];
  console.log(`[Twilight] Processing exterior image ${twilightIndex + 1}/${exteriorIndices.length} (index ${imageIdx})`);

  // Check active prediction
  const activePredictionId = metadata.twilightPredictionId as string | undefined;
  if (activePredictionId) {
    try {
      const prediction = await replicate.predictions.get(activePredictionId);
      if (prediction.status === 'succeeded') {
        const url = extractUrl(prediction.output);
        if (url) {
          twilightedImages[imageIdx] = url;
          console.log(`[Twilight] Image ${imageIdx} done`);
        }
      } else if (prediction.status === 'failed') {
        console.warn(`[Twilight] Prediction failed for image ${imageIdx}: ${prediction.error}`);
        // Keep original image
      } else {
        return NextResponse.json({ status: 'twilighting', message: `Twilighting exterior ${twilightIndex + 1}/${exteriorIndices.length}...` });
      }
    } catch (err) {
      console.warn('[Twilight] Error checking prediction:', err);
    }

    // Move to next
    const nextIndex = twilightIndex + 1;
    await supabase.from('video_jobs')
      .update({ metadata: { ...metadata, twilightIndex: nextIndex, twilightedImages, twilightPredictionId: null } })
      .eq('id', job.id);
    return NextResponse.json({ status: 'twilighting', message: `Twilighting exterior ${nextIndex}/${exteriorIndices.length}...` });
  }

  // Start new twilight prediction
  try {
    const prediction = await createPredictionWithRetry({
      version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
      input: {
        image: imageUrl,
        prompt: 'real estate exterior photography, golden hour twilight, warm orange sky, professional lighting, luxury property, cinematic --ar 16:9',
        negative_prompt: 'daytime, harsh light, overcast, flat sky, dark, night, people, cars, text',
        num_inference_steps: 30,
        guidance_scale: 7.5,
        prompt_strength: 0.45,
      },
    });

    await supabase.from('video_jobs')
      .update({ metadata: { ...metadata, twilightPredictionId: prediction.id } })
      .eq('id', job.id);
    return NextResponse.json({ status: 'twilighting', message: `Twilighting exterior ${twilightIndex + 1}/${exteriorIndices.length}...` });
  } catch (err) {
    console.warn(`[Twilight] Failed for image ${imageIdx}:`, err);
    // Skip, keep original
    const nextIndex = twilightIndex + 1;
    await supabase.from('video_jobs')
      .update({ metadata: { ...metadata, twilightIndex: nextIndex, twilightedImages } })
      .eq('id', job.id);
    return NextResponse.json({ status: 'twilighting', message: `Twilighting exterior ${nextIndex}/${exteriorIndices.length}...` });
  }
}

// ── Stage 4: Enhance — Real-ESRGAN 2× upscale for all images ──────────
async function handleEnhancing(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  const metadata = (job.metadata as Record<string, unknown>) || {};
  const inputImages = (job.input_images as string[]) || [];

  if (inputImages.length === 0) {
    await supabase.from('video_jobs').update({ status: 'failed', metadata: { ...metadata, error: 'enhancing: No images to enhance' } }).eq('id', job.id);
    return NextResponse.json({ status: 'failed', error: 'No images to enhance' });
  }

  const enhanceIndex = (metadata.enhanceIndex as number) || 0;
  const enhancedImages = (metadata.enhancedImages as string[]) || [];

  // All done?
  if (enhanceIndex >= inputImages.length && enhancedImages.length > 0) {
    console.log(`[Enhance] Done. ${enhancedImages.length} images upscaled.`);
    await supabase.from('video_jobs').update({
      status: 'renovating',
      input_images: enhancedImages,
      metadata: { ...metadata, enhancedImages: undefined, enhanceIndex: undefined, enhancePredictionId: undefined },
    }).eq('id', job.id);
    return NextResponse.json({ status: 'renovating', message: `Enhanced ${enhancedImages.length} images.` });
  }

  console.log(`[Enhance] Upscaling image ${enhanceIndex + 1}/${inputImages.length}`);

  // Check active prediction
  const activePredictionId = metadata.enhancePredictionId as string | undefined;
  if (activePredictionId) {
    try {
      const prediction = await replicate.predictions.get(activePredictionId);
      if (prediction.status === 'succeeded') {
        const url = extractUrl(prediction.output);
        enhancedImages.push(url || inputImages[enhanceIndex]);
        console.log(`[Enhance] Image ${enhanceIndex + 1} done`);
      } else if (prediction.status === 'failed') {
        console.warn(`[Enhance] Prediction failed: ${prediction.error}`);
        enhancedImages.push(inputImages[enhanceIndex]); // fallback to original
      } else {
        return NextResponse.json({ status: 'enhancing', message: `Enhancing image ${enhanceIndex + 1}/${inputImages.length}...` });
      }
    } catch (err) {
      console.warn('[Enhance] Error checking prediction:', err);
      enhancedImages.push(inputImages[enhanceIndex]);
    }

    const nextIdx = enhanceIndex + 1;
    if (nextIdx >= inputImages.length) {
      await supabase.from('video_jobs').update({
        status: 'renovating',
        input_images: enhancedImages,
        metadata: { ...metadata, enhancedImages: undefined, enhanceIndex: undefined, enhancePredictionId: undefined },
      }).eq('id', job.id);
      return NextResponse.json({ status: 'renovating', message: `Enhanced ${enhancedImages.length} images.` });
    }

    await supabase.from('video_jobs').update({
      metadata: { ...metadata, enhanceIndex: nextIdx, enhancedImages, enhancePredictionId: null },
    }).eq('id', job.id);
    return NextResponse.json({ status: 'enhancing', message: `Enhancing image ${nextIdx + 1}/${inputImages.length}...` });
  }

  // Start Real-ESRGAN prediction
  try {
    const prediction = await createPredictionWithRetry({
      version: '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
      input: {
        image: inputImages[enhanceIndex],
        scale: 2,
        face_enhance: false,
      },
    });
    await supabase.from('video_jobs').update({
      metadata: { ...metadata, enhancePredictionId: prediction.id },
    }).eq('id', job.id);
    return NextResponse.json({ status: 'enhancing', message: `Enhancing image ${enhanceIndex + 1}/${inputImages.length}...` });
  } catch (err) {
    console.warn(`[Enhance] Failed image ${enhanceIndex}:`, err);
    enhancedImages.push(inputImages[enhanceIndex]);
    const nextIdx = enhanceIndex + 1;
    if (nextIdx >= inputImages.length) {
      await supabase.from('video_jobs').update({
        status: 'renovating',
        input_images: enhancedImages,
        metadata: { ...metadata, enhancedImages: undefined, enhanceIndex: undefined, enhancePredictionId: undefined },
      }).eq('id', job.id);
      return NextResponse.json({ status: 'renovating', message: `Enhanced ${enhancedImages.length} images (with fallbacks).` });
    }
    await supabase.from('video_jobs').update({
      metadata: { ...metadata, enhanceIndex: nextIdx, enhancedImages, enhancePredictionId: null },
    }).eq('id', job.id);
    return NextResponse.json({ status: 'enhancing', message: `Enhancing image ${nextIdx + 1}/${inputImages.length}...` });
  }
}

// ── Stage 5: Renovate — AI interior design (interior images only) ────────
async function handleRenovating(supabase: Awaited<ReturnType<typeof createClient>>, job: Record<string, unknown>) {
  const inputImages = (job.input_images as string[]) || [];
  if (inputImages.length === 0) {
    await supabase.from('video_jobs').update({ status: 'failed' }).eq('id', job.id);
    return NextResponse.json({ error: 'No input images' }, { status: 400 });
  }

  const style = (job.renovation_style as string) || 'modern';
  const sortLabels = ((job.metadata as Record<string, unknown>)?.sortLabels as Array<{ index: number; label: string }>) || [];
  const metadata = (job.metadata as Record<string, unknown>) || {};
  const currentIndex = (metadata.renovateIndex as number) || 0;
  const renovated: string[] = (metadata.renovatedImages as string[]) || [];

  // All done?
  if (currentIndex >= inputImages.length && renovated.length > 0) {
    await supabase.from('video_jobs').update({ status: 'animating', metadata: { ...metadata, renovatedImages: renovated } }).eq('id', job.id);
    return NextResponse.json({ status: 'animating', message: `Renovation done. ${renovated.length} images.` });
  }

  if (currentIndex < inputImages.length) {
    const activePredictionId = metadata.renovatePredictionId as string | undefined;
    if (activePredictionId) {
      try {
        const prediction = await replicate.predictions.get(activePredictionId);
        if (prediction.status === 'succeeded') {
          const url = extractUrl(prediction.output);
          renovated.push(url || inputImages[currentIndex]);
          console.log(`[Renovate] Image ${currentIndex + 1} done`);
        } else if (prediction.status === 'failed') {
          console.warn(`[Renovate] Prediction failed: ${prediction.error}`);
          renovated.push(inputImages[currentIndex]);
        } else {
          return NextResponse.json({ status: 'renovating', message: `Renovating image ${currentIndex + 1}/${inputImages.length}...` });
        }
      } catch (err) {
        console.warn(`[Renovate] Error checking prediction:`, err);
        renovated.push(inputImages[currentIndex]);
      }

      const nextIndex = currentIndex + 1;
      const isDone = nextIndex >= inputImages.length;
      await supabase.from('video_jobs').update({
        status: isDone ? 'animating' : 'renovating',
        metadata: { ...metadata, renovateIndex: nextIndex, renovatedImages: renovated, renovatePredictionId: null },
      }).eq('id', job.id);
      return NextResponse.json({
        status: isDone ? 'animating' : 'renovating',
        message: isDone ? `Renovation done. ${renovated.length} images.` : `Renovated ${nextIndex}/${inputImages.length}...`,
      });
    }

    // Determine if this is interior (needs renovation) or exterior (skip)
    const roomLabel = sortLabels[currentIndex]?.label || 'other';
    const isExterior = ['exterior_front', 'exterior_garden'].includes(roomLabel);

    if (isExterior) {
      console.log(`[Renovate] Image ${currentIndex + 1} is exterior (${roomLabel}), skipping`);
      renovated.push(inputImages[currentIndex]);
      const nextIndex = currentIndex + 1;
      const isDone = nextIndex >= inputImages.length;
      await supabase.from('video_jobs').update({
        status: isDone ? 'animating' : 'renovating',
        metadata: { ...metadata, renovateIndex: nextIndex, renovatedImages: renovated },
      }).eq('id', job.id);
      return NextResponse.json({
        status: isDone ? 'animating' : 'renovating',
        message: isDone ? `Renovation done. ${renovated.length} images.` : `Renovated ${nextIndex}/${inputImages.length}...`,
      });
    }

    // Interior — start renovation prediction
    const prompt = (STYLE_PROMPTS[style] || STYLE_PROMPTS.modern) + ', interior design magazine, wide angle, full room visible';
    console.log(`[Renovate] Starting image ${currentIndex + 1}/${inputImages.length} (${roomLabel})`);
    try {
      const prediction = await createPredictionWithRetry({
        version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
        input: {
          image: inputImages[currentIndex],
          prompt,
          negative_prompt: 'blurry, low quality, distorted, watermark, text, dark, empty room',
          num_inference_steps: 30,
          guidance_scale: 12,
          prompt_strength: 0.6,
        },
      });
      await supabase.from('video_jobs').update({
        metadata: { ...metadata, renovatePredictionId: prediction.id },
      }).eq('id', job.id);
      return NextResponse.json({ status: 'renovating', message: `Renovating image ${currentIndex + 1}/${inputImages.length}...` });
    } catch (err) {
      console.warn(`[Renovate] Failed to create prediction:`, err);
      renovated.push(inputImages[currentIndex]);
      const nextIndex = currentIndex + 1;
      const isDone = nextIndex >= inputImages.length;
      await supabase.from('video_jobs').update({
        status: isDone ? 'animating' : 'renovating',
        metadata: { ...metadata, renovateIndex: nextIndex, renovatedImages: renovated },
      }).eq('id', job.id);
      return NextResponse.json({ status: isDone ? 'animating' : 'renovating', message: `Renovation ${nextIndex}/${inputImages.length} (fallback).` });
    }
  }

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
          const nextMeta: Record<string, unknown> = { ...metadata, animateIndex: nextIndex, clips };
          delete nextMeta.animatePredictionId;
          await supabase.from('video_jobs').update({
            status: isDone ? 'stitching' : 'animating',
            metadata: nextMeta,
          }).eq('id', job.id);
          return NextResponse.json({
            status: isDone ? 'stitching' : 'animating',
            message: isDone ? `Animation done. ${clips.length} clips.` : `Animating ${nextIndex}/${images.length}...`,
          });
        } else if (prediction.status === 'failed') {
          console.warn(`[Animate] Prediction failed: ${prediction.error}`);
          const nextIndex = currentIndex + 1;
          const isDone = nextIndex >= images.length;
          const nextMeta: Record<string, unknown> = { ...metadata, animateIndex: nextIndex, clips };
          delete nextMeta.animatePredictionId;
          // If all remaining images fail and we have no clips, store the error
          if (isDone && clips.length === 0) {
            nextMeta.error = `animating: All predictions failed — ${prediction.error || 'unknown'}`;
          }
          await supabase.from('video_jobs').update({
            status: isDone && clips.length === 0 ? 'failed' : (isDone ? 'stitching' : 'animating'),
            metadata: nextMeta,
          }).eq('id', job.id);
          return NextResponse.json({ status: isDone ? 'stitching' : 'animating', message: `Animation ${nextIndex}/${images.length} (skipped failed).` });
        }
        // Still processing
        return NextResponse.json({ status: 'animating', message: `Animating image ${currentIndex + 1}/${images.length}...` });
      } catch (err) {
        console.warn(`[Animate] Error checking prediction:`, err);
      }
    }

    // Start new prediction with Kling v2.1
    console.log(`[Animate] Starting image ${currentIndex + 1}/${images.length}`, `URL: ${images[currentIndex]?.substring(0, 100)}...`);

    // Get room-specific motion prompt from sort labels
    const sortLabels = (metadata.sortLabels as Array<{ index: number; label: string; sortKey: number }>) || [];
    const roomLabel = sortLabels[currentIndex]?.label || 'default';
    const motionPrompt = MOTION_PROMPTS[roomLabel] || 'slow cinematic camera pan, professional real estate video, smooth motion, warm lighting';
    console.log(`[Animate] Room: ${roomLabel}, Motion: ${motionPrompt.substring(0, 60)}...`);

    try {
      const prediction = await createPredictionWithRetry({
        model: "kwaivgi/kling-v2.1",
        input: {
          start_image: images[currentIndex],
          prompt: motionPrompt,
          negative_prompt: 'shaky, blurry, distorted, text, watermark, people',
          duration: 5,
          aspect_ratio: '16:9',
          cfg_scale: 0.5,
          mode: 'standard',
        },
      });

      // Save prediction ID — check on next poll
      await supabase.from('video_jobs').update({
        metadata: { ...metadata, animatePredictionId: prediction.id },
      }).eq('id', job.id);

      return NextResponse.json({ status: 'animating', message: `Animating image ${currentIndex + 1}/${images.length}...` });
    } catch (err) {
      console.warn(`[Animate] Failed to start prediction for image ${currentIndex + 1}:`, err);
      // Skip this image instead of failing the whole job
      const nextIndex = currentIndex + 1;
      const isDone = nextIndex >= images.length;
      if (isDone && clips.length === 0) {
        // Only fail if we have zero clips after all attempts
        const errMsg = err instanceof Error ? err.message : 'Animation failed';
        await supabase.from('video_jobs').update({
          status: 'failed',
          metadata: { ...metadata, clips, error: `animating: ${errMsg}` },
        }).eq('id', job.id);
        return NextResponse.json({ status: 'failed', error: `Animation failed: ${errMsg}` });
      }
      await supabase.from('video_jobs').update({
        status: isDone ? 'stitching' : 'animating',
        metadata: { ...metadata, animateIndex: nextIndex, clips },
      }).eq('id', job.id);
      return NextResponse.json({ status: isDone ? 'stitching' : 'animating', message: `Skipped failed animation ${nextIndex}/${images.length}. Clips so far: ${clips.length}` });
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

  // Multiple clips — stitch with FFmpeg (crossfade + music)
  try {
    console.log(`[Stitch] Downloading ${clips.length} clips...`);
    const os = await import('os');
    const path = await import('path');
    const fs = await import('fs/promises');

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stitch-'));

    // Download all clips to temp files
    const clipPaths: string[] = [];
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
        const clipPath = path.join(tmpDir, `clip${i}.mp4`);
        await fs.writeFile(clipPath, Buffer.from(arrayBuffer));
        clipPaths.push(clipPath);
      } catch (fetchErr) {
        clearTimeout(timeout);
        console.warn(`[Stitch] Failed to download clip ${i + 1}:`, fetchErr);
      }
    }

    if (clipPaths.length === 0) throw new Error('No clips downloaded successfully');
    if (clipPaths.length === 1) {
      const buffer = await fs.readFile(clipPaths[0]);
      const outputUrl = await uploadVideo(job, buffer);
      await cleanup(tmpDir);
      await supabase.from('video_jobs').update({ status: 'done', output_video_url: outputUrl, metadata: { ...metadata, allClipUrls: clips } }).eq('id', job.id);
      return NextResponse.json({ status: 'done', message: 'Video complete (1 clip).', outputUrl, hasVideo: true });
    }

    const outputPath = path.join(tmpDir, 'final.mp4');

    // Download music and watermark
    let musicPath: string | null = null;
    let watermarkPath: string | null = null;

    // Get music: auto-select or use user genre
    const musicFile = selectMusicTrack(job);
    if (musicFile) {
      musicPath = await downloadToTemp(musicFile, tmpDir, 'music.mp3');
    }

    // Get watermark
    watermarkPath = await downloadToTemp(WATERMARK_LOGO_URL, tmpDir, 'watermark.png');

    // Run single-pass: concat + crossfade + watermark + music
    try {
      await stitchWithCrossfade(clipPaths, path.join(tmpDir, 'stitched.mp4'), tmpDir);
      const stitchedPath = path.join(tmpDir, 'stitched.mp4');

      // Add watermark + music in one pass
      await addWatermarkAndMusic(stitchedPath, outputPath, watermarkPath, musicPath);
    } catch (xfadeErr) {
      console.warn('[Stitch] Crossfade failed, trying simple concat:', xfadeErr);
      const concatListPath = path.join(tmpDir, 'concat.txt');
      const concatContent = clipPaths.map(p => `file '${p}'`).join('\n');
      await fs.writeFile(concatListPath, concatContent);
      const concatPath = path.join(tmpDir, 'concat.mp4');
      await stitchWithFFmpeg(concatListPath, concatPath);
      await addWatermarkAndMusic(concatPath, outputPath, watermarkPath, musicPath);
    }

    const finalBuffer = await fs.readFile(outputPath);
    console.log(`[Stitch] Final output: ${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB`);

    const outputUrl = await uploadVideo(job, finalBuffer);
    await cleanup(tmpDir);
    await supabase.from('video_jobs').update({ status: 'done', output_video_url: outputUrl, metadata: { ...metadata, allClipUrls: clips } }).eq('id', job.id);
    return NextResponse.json({ status: 'done', message: `Video complete! ${clipPaths.length} clips.`, outputUrl, hasVideo: true });
  } catch (err) {
    console.error('[Stitch] Stitching failed:', err);
    const outputUrl = clips[clips.length - 1];
    await supabase.from('video_jobs').update({
      status: 'done',
      output_video_url: outputUrl,
      metadata: { ...metadata, allClipUrls: clips },
    }).eq('id', job.id);
    return NextResponse.json({
      status: 'done',
      message: `Video complete (${clips.length} clips — stitching failed, showing last clip).`,
      outputUrl,
      hasVideo: true,
    });
  }
}

// Stitch clips using crossfade transitions via xfade filter
async function stitchWithCrossfade(clipPaths: string[], outputPath: string, tmpDir: string): Promise<void> {
  const ffmpegPath = getFFmpegPath();
  if (!ffmpegPath) throw new Error('No ffmpeg binary found');

  const fs = await import('fs/promises');
  const path = await import('path');
  const fadeDuration = 0.8; // seconds of crossfade
  const clipDuration = 5; // Kling produces 5s clips
  const offset = clipDuration - fadeDuration; // offset for each xfade

  if (clipPaths.length === 2) {
    return crossfadeTwo(ffmpegPath, clipPaths[0], clipPaths[1], outputPath, fadeDuration, offset);
  }

  // Normalize all clips to same resolution/codec/fps first
  const normalizedPaths: string[] = [];
  for (let i = 0; i < clipPaths.length; i++) {
    const normPath = path.join(tmpDir, `norm${i}.mp4`);
    await normalizeClip(ffmpegPath, clipPaths[i], normPath);
    normalizedPaths.push(normPath);
  }

  // Build a single complex filter with chained xfade for all clips
  // This is more efficient than processing pair by pair
  return new Promise((resolve, reject) => {
    import('fluent-ffmpeg').then(ffmpeg => {
      const cmd = ffmpeg.default().setFfmpegPath(ffmpegPath);

      // Add all inputs
      for (const p of normalizedPaths) {
        cmd.input(p);
      }

      // Build xfade filter chain
      const filters: string[] = [];
      let currentOffset = offset;

      for (let i = 0; i < normalizedPaths.length - 1; i++) {
        const inTag = i === 0 ? '[0:v]' : `[v${i - 1}]`;
        const outTag = i === normalizedPaths.length - 2 ? '[vout]' : `[v${i}]`;
        filters.push(`${inTag}[${i + 1}:v]xfade=transition=fade:duration=${fadeDuration}:offset=${currentOffset.toFixed(1)}${outTag}`);
        currentOffset += offset;
      }

      cmd
        .complexFilter(filters)
        .outputOptions([
          '-map [vout]',
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-movflags +faststart',
          '-pix_fmt yuv420p',
        ])
        .output(outputPath)
        .on('start', (cmd: string) => console.log(`[Stitch] Multi-xfade: ${cmd}`))
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  });
}

function crossfadeTwo(ffmpegPath: string, input1: string, input2: string, outputPath: string, fadeSec: number, offset: number): Promise<void> {
  return new Promise((resolve, reject) => {
    import('fluent-ffmpeg').then(ffmpeg => {
      ffmpeg.default()
        .setFfmpegPath(ffmpegPath)
        .input(input1)
        .input(input2)
        .complexFilter([
          `[0:v][1:v]xfade=transition=fade:duration=${fadeSec}:offset=${offset.toFixed(1)}[v]`,
        ])
        .outputOptions([
          '-map [v]',
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-movflags +faststart',
          '-pix_fmt yuv420p',
        ])
        .output(outputPath)
        .on('start', (cmd: string) => console.log(`[Stitch] xfade: ${cmd}`))
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  });
}

function normalizeClip(ffmpegPath: string, inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    import('fluent-ffmpeg').then(ffmpeg => {
      ffmpeg.default(inputPath)
        .setFfmpegPath(ffmpegPath)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
          '-r 30',
          '-pix_fmt yuv420p',
          '-an', // strip audio from individual clips
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  });
}

// Add background music to video
// Select music track based on listing metadata or user genre choice
function selectMusicTrack(job: Record<string, unknown>): string | null {
  // User override takes priority
  const userGenre = job.music_genre as string;
  if (userGenre && MUSIC_TRACKS[userGenre]) return MUSIC_TRACKS[userGenre];

  // Auto-select based on listing price/title from metadata
  const metadata = (job.metadata as Record<string, unknown>) || {};
  const title = ((metadata.listingTitle as string) || '').toLowerCase();
  const price = metadata.listingPrice as number;

  if (title.includes('luxus') || title.includes('luxury') || title.includes('penthous') || (price && price > 800000)) {
    return MUSIC_TRACKS.cinematic; // ambient_cinematic.mp3
  }
  if (title.includes('wohnung') || title.includes('apartment') || title.includes('studio') || (price && price < 250000)) {
    return MUSIC_TRACKS.ambient; // soft_ambient.mp3
  }

  // Default: upbeat modern for standard residential
  return MUSIC_TRACKS.upbeat; // upbeat_modern.mp3
}

// Download a URL to a temp file
async function downloadToTemp(url: string, tmpDir: string, filename: string): Promise<string | null> {
  const path = await import('path');
  const fs = await import('fs/promises');
  const outputPath = path.join(tmpDir, filename);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 100) return null; // too small, probably error
    await fs.writeFile(outputPath, buffer);
    return outputPath;
  } catch (err) {
    console.warn(`[Download] Failed: ${url.substring(0, 60)}...`, err);
    return null;
  }
}

// Single-pass: add watermark (bottom-right) + music (30% volume)
function addWatermarkAndMusic(videoPath: string, outputPath: string, watermarkPath: string | null, musicPath: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFFmpegPath();
    if (!ffmpegPath) { reject(new Error('No ffmpeg')); return; }

    import('fluent-ffmpeg').then(ffmpeg => {
      const cmd = ffmpeg.default().setFfmpegPath(ffmpegPath);
      cmd.input(videoPath); // input 0: video

      let audioInputIdx = -1;
      if (musicPath) {
        cmd.input(musicPath); // input 1: music
        audioInputIdx = 1;
      }

      let watermarkInputIdx = -1;
      if (watermarkPath) {
        cmd.input(watermarkPath); // input 2 (or 1): watermark
        watermarkInputIdx = musicPath ? 2 : 1;
      }

      const filters: string[] = [];
      const outputOpts: string[] = [
        '-c:v libx264', '-preset fast', '-crf 23',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
      ];

      if (watermarkPath && watermarkInputIdx >= 0) {
        filters.push(
          `[${watermarkInputIdx}:v]scale=160:-1,format=rgba,colorchannelmixer=aa=0.7[wm]`,
          `[0:v][wm]overlay=W-w-24:H-h-24[outv]`
        );
        outputOpts.push('-map', '[outv]');
      } else {
        // No PNG watermark — drawtext fallback
        outputOpts.push(
          "-vf", "drawtext=text='Made by Zestio':fontsize=22:fontcolor=white@0.7:x=W-tw-24:y=H-th-24:shadowcolor=black:shadowx=1:shadowy=1"
        );
      }

      if (musicPath && audioInputIdx >= 0) {
        outputOpts.push('-map', `${audioInputIdx}:a`);
        outputOpts.push('-c:a aac', '-b:a 128k', '-af volume=0.3', '-shortest');
      } else {
        // No music — strip audio
        outputOpts.push('-an');
      }

      if (filters.length > 0) {
        cmd.complexFilter(filters);
      }
      cmd.outputOptions(outputOpts);
      cmd.output(outputPath);

      cmd.on('start', (c: string) => console.log(`[Final] ${c}`));
      cmd.on('end', () => resolve());
      cmd.on('error', (err: Error) => reject(err));
      cmd.run();
    });
  });
}

function getFFmpegPath(): string | null {
  try {
    const p = require('ffmpeg-static') as string;
    if (p) return p;
  } catch {}
  const { existsSync } = require('fs');
  for (const p of ['/usr/bin/ffmpeg', '/bin/ffmpeg', '/opt/bin/ffmpeg']) {
    if (existsSync(p)) return p;
  }
  return null;
}

// Stitch clips using FFmpeg simple concat (fallback)
async function stitchWithFFmpeg(concatListPath: string, outputPath: string): Promise<void> {
  const ffmpegPath = getFFmpegPath();
  if (!ffmpegPath) throw new Error('No ffmpeg binary found');

  return new Promise((resolve, reject) => {
    import('fluent-ffmpeg').then(ffmpeg => {
      ffmpeg.default(concatListPath)
        .setFfmpegPath(ffmpegPath!)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-movflags +faststart', '-pix_fmt yuv420p'])
        .output(outputPath)
        .on('start', (cmd: string) => console.log(`[Stitch] FFmpeg: ${cmd}`))
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  });
}
async function uploadVideo(job: Record<string, unknown>, buffer: Buffer): Promise<string> {
  try {
    const { createServiceClient } = await import('@/utils/supabase/server');
    const serviceClient = createServiceClient();
    const filePath = `${job.id}/final.mp4`;
    const { error: uploadError } = await serviceClient.storage
      .from('videos')
      .upload(filePath, buffer, { contentType: 'video/mp4', cacheControl: '31536000', upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = serviceClient.storage.from('videos').getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (err) {
    console.warn('[Upload] videos bucket failed, falling back to user-uploads:', err);
    try {
      const { createServiceClient } = await import('@/utils/supabase/server');
      const serviceClient = createServiceClient();
      const userId = job.user_id as string;
      const filePath = `${userId}/video-output/${job.id}-${Date.now()}.mp4`;
      const { error: uploadError } = await serviceClient.storage
        .from('user-uploads')
        .upload(filePath, buffer, { contentType: 'video/mp4', upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = serviceClient.storage.from('user-uploads').getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (fallbackErr) {
      console.error('[Upload] All uploads failed:', fallbackErr);
      throw fallbackErr;
    }
  }
}

// Clean up temp directory
async function cleanup(tmpDir: string) {
  const fs = await import('fs/promises');
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {}
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
    // Model A: credits = remaining balance, so add back the cost
    await supabase.rpc('refund_credits', { p_user_id: userId, p_amount: CREDIT_COSTS.VIDEO_GENERATION });
  } catch {
    // Fallback if RPC doesn't exist
    const { data: ud } = await supabase
      .from('zestio_users')
      .select('credits')
      .eq('id', userId)
      .single();
    if (ud) {
      await supabase
        .from('zestio_users')
        .update({ credits: ud.credits + CREDIT_COSTS.VIDEO_GENERATION })
        .eq('id', userId);
    }
  }
}

// ── Apify helpers ────────────────────────────────────────────────────────
async function startApifyRun(actorId: string, url: string, inputKey: string, inputFormat: 'urlObjects' | 'plainString' = 'urlObjects'): Promise<string> {
  const token = process.env.APIFY_API_TOKEN!;
  const input: Record<string, unknown> = inputFormat === 'plainString'
    ? { [inputKey]: url }
    : { [inputKey]: [{ url }] };
  const res = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apify start failed: ${res.status} ${body.substring(0, 200)}`);
  }
  const data = await res.json();
  return data?.data?.id as string;
}

async function getApifyRunStatus(runId: string): Promise<string> {
  const token = process.env.APIFY_API_TOKEN!;
  const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return 'FAILED';
  const data = await res.json();
  return data?.data?.status as string || 'UNKNOWN';
}

async function pollApifyRun(runId: string, imageField: string): Promise<string[]> {
  const token = process.env.APIFY_API_TOKEN!;

  // Poll until run finishes (max 90s)
  for (let i = 0; i < 18; i++) {
    const status = await getApifyRunStatus(runId);
    if (status === 'SUCCEEDED') break;
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') return [];
    await new Promise(r => setTimeout(r, 5000));
  }

  // Get the dataset (fetch more items — some actors split data across items)
  const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${token}&clean=true&limit=10`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) return [];

  const images: string[] = [];
  const seen = new Set<string>();

  // Known image field names across different scrapers
  const fields = [imageField, 'images', 'photos', 'imageUrls', 'gallery', 'media', 'imageList',
    'pictureList', 'pictureUrls', 'galleryImages', 'realEstateImages', 'attachments'];

  for (const item of items) {
    // 1) Try known top-level fields
    for (const field of fields) {
      const val = item[field];
      if (Array.isArray(val)) {
        for (const v of val) {
          if (typeof v === 'string' && v.startsWith('http')) { if (!seen.has(v)) { seen.add(v); images.push(v); } }
          else if (typeof v === 'object' && v !== null) {
            const url = v.url || v.src || v.href || v.imageUrl;
            if (typeof url === 'string' && url.startsWith('http') && !seen.has(url)) { seen.add(url); images.push(url); }
          }
        }
      }
    }

    // 2) Recursively find image URLs anywhere in the item
    const imagePattern = /^https?:\/\/.+\.(?:jpg|jpeg|png|webp|avif)(?:\?.*)?$/i;
    function findImagesDeep(obj: unknown, depth = 0) {
      if (depth > 5 || images.length >= 30) return;
      if (typeof obj === 'string') {
        if (imagePattern.test(obj) && !seen.has(obj)) { seen.add(obj); images.push(obj); }
      } else if (Array.isArray(obj)) {
        for (const v of obj) findImagesDeep(v, depth + 1);
      } else if (typeof obj === 'object' && obj !== null) {
        for (const v of Object.values(obj)) findImagesDeep(v, depth + 1);
      }
    }
    findImagesDeep(item);
  }

  return images.slice(0, 30);
}

async function scrapeListingImages(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });
    if (!response.ok) return [];
    const html = await response.text();
    const images: string[] = [];
    const seen = new Set<string>();

    const addImage = (url: string) => {
      // Filter out tiny/irrelevant images
      if (seen.has(url)) return;
      if (url.match(/\.(?:svg|gif|ico|webp)$/i)) return;
      if (url.match(/(?:logo|icon|avatar|badge|button|arrow|spinner|loading)/i)) return;
      if (url.length < 20) return;
      seen.add(url);
      images.push(url);
    };

    // 1. og:image meta tag
    const ogMatches = html.matchAll(/property="og:image"[^>]*content="([^"]+)"/gi);
    for (const m of ogMatches) addImage(m[1]);

    // 2. <img src> with large image patterns (property listing sites)
    const imgSrcMatches = html.matchAll(/src="(https?:\/\/[^"\s<>]+\.(?:jpg|jpeg|png|webp)[^"\s<>]*)"/gi);
    for (const m of imgSrcMatches) addImage(m[1]);

    // 3. data-src / data-lazy-src (lazy loaded images)
    const lazyMatches = html.matchAll(/data-(?:src|lazy-src|original)="(https?:\/\/[^"\s<>]+\.(?:jpg|jpeg|png|webp)[^"\s<>]*)"/gi);
    for (const m of lazyMatches) addImage(m[1]);

    // 4. JSON-LD structured data (common in listing pages)
    const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    for (const m of jsonLdMatches) {
      try {
        const json = JSON.parse(m[1]);
        const extractUrls = (obj: unknown) => {
          if (typeof obj === 'string' && obj.match(/^https?:\/\/.+\.(?:jpg|jpeg|png|webp)/i)) {
            addImage(obj);
          } else if (Array.isArray(obj)) {
            obj.forEach(extractUrls);
          } else if (obj && typeof obj === 'object') {
            Object.values(obj as Record<string, unknown>).forEach(extractUrls);
          }
        };
        extractUrls(json);
      } catch {}
    }

    // 5. Generic URL patterns from known property portals
    const portalPatterns = html.matchAll(/(https?:\/\/[^"\s'<>]+(?:immobilienscout24|immowelt|zillow|rightmove|idealista|remax|engelvoelkers|wonnen|kleinanzeigen|immobiliare)\S+\.(?:jpg|jpeg|png|webp))/gi);
    for (const m of portalPatterns) addImage(m[1]);

    return images.slice(0, 30);
  } catch {
    return [];
  }
}
