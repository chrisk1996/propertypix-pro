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

// Motion prompts per room type for Kling v2.1
const ROOM_MOTION_PROMPTS: Record<string, string> = {
  exterior: 'Slow cinematic drone shot approaching the building exterior, golden hour lighting, professional real estate video, smooth camera motion',
  facade: 'Slow cinematic drone shot approaching the building exterior, golden hour lighting, professional real estate video, smooth camera motion',
  building: 'Slow cinematic reveal of the building exterior, wide angle, professional real estate video, smooth camera motion',
  living_room: 'Smooth slow camera pan across the living room, cinematic interior shot, warm natural lighting, professional real estate video',
  living: 'Smooth slow camera pan across the living room, cinematic interior shot, warm natural lighting, professional real estate video',
  lounge: 'Smooth slow camera pan across the lounge, cinematic interior shot, warm natural lighting, professional real estate video',
  kitchen: 'Slow dolly shot through the kitchen, showing countertops and appliances, warm lighting, professional real estate video',
  dining_room: 'Slow elegant camera pan across the dining room, showing table setting, warm ambient lighting, professional real estate video',
  dining: 'Slow elegant camera pan across the dining area, showing table and chairs, warm ambient lighting, professional real estate video',
  bedroom: 'Gentle slow zoom into the bedroom, soft morning light, cozy atmosphere, professional real estate video',
  bathroom: 'Slow reveal pan of the bathroom, clean modern fixtures, bright natural lighting, professional real estate video',
  office: 'Smooth pan across the home office, natural light from window, professional real estate video',
  study: 'Smooth pan across the study, warm lighting, bookshelves, professional real estate video',
  hallway: 'Smooth dolly shot through the hallway, bright and welcoming, professional real estate video',
  balcony: 'Slow cinematic pan of the balcony view, gentle breeze, golden hour, professional real estate video',
  garden: 'Slow cinematic drone shot of the garden, lush greenery, golden hour, professional real estate video',
  default: 'Slow cinematic camera pan, professional real estate video, smooth motion, warm lighting',
};

// Music tracks — royalty-free audio URLs per genre
const MUSIC_TRACKS: Record<string, string> = {
  cinematic: 'https://cdn.zestio.de/music/cinematic.mp3',
  uplifting: 'https://cdn.zestio.de/music/uplifting.mp3',
  ambient: 'https://cdn.zestio.de/music/ambient.mp3',
  acoustic: 'https://cdn.zestio.de/music/acoustic.mp3',
  electronic: 'https://cdn.zestio.de/music/electronic.mp3',
  jazz: 'https://cdn.zestio.de/music/jazz.mp3',
  classical: 'https://cdn.zestio.de/music/classical.mp3',
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
      .update({ status: 'renovating', input_images: sortedImages, metadata: { sortLabels: labels } })
      .eq('id', job.id);
    return NextResponse.json({ status: 'renovating', message: `Sorted: ${labels.map(l => l.label).join(' → ')}` });
  }

  // Classify one image
  const sortOrder: Record<string, number> = {
    exterior: 0, facade: 0, building: 0, house: 0, outside: 0,
    balcony: 1, patio: 1, terrace: 1, garden: 1, yard: 1,
    living: 2, lounge: 2, living_room: 2,
    dining: 3, dining_room: 3, kitchen: 4, office: 5, study: 5,
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
        const match = label.match(/\b(living_room|living room|dining_room|dining room|exterior|facade|building|house|outside|balcony|patio|terrace|garden|yard|living|lounge|dining|kitchen|office|study|hallway|corridor|entrance|bedroom|bathroom|other)\b/);
        const cleanLabel = match ? match[1].replace(/ /g, '_') : 'other';
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
        version: "72ccb656353c348c1385df54b237eeb7bfa874bf11486cf0b9473e691b662d31",
        input: {
          image: inputImages[sortIndex],
          prompt: 'Classify this real estate photo. Choose EXACTLY one: exterior, living_room, kitchen, bedroom, bathroom, dining_room, office, hallway, balcony, garden, other. Reply with ONLY the label, nothing else.',
          temperature: 0.2,
          max_tokens: 1024,
          top_p: 1,
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
          .update({ status: 'renovating', metadata: { sortLabels: [] } })
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
      .update({ status: 'renovating', input_images: sortedImages, metadata: { sortLabels: labels } })
      .eq('id', job.id);
    return NextResponse.json({ status: 'renovating', message: `Sorted: ${labels.map(l => l.label).join(', ')}` });
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
    const motionPrompt = ROOM_MOTION_PROMPTS[roomLabel] || ROOM_MOTION_PROMPTS.default;
    console.log(`[Animate] Room: ${roomLabel}, Motion: ${motionPrompt.substring(0, 60)}...`);

    try {
      const prediction = await createPredictionWithRetry({
        model: "kwaivgi/kling-v2.1",
        input: {
          image: images[currentIndex],
          prompt: motionPrompt,
          negative_prompt: 'blurry, distorted, low quality, watermark, text, fast motion, shaky',
          duration: 5,
          aspect_ratio: '16:9',
          resolution: '720p',
          mode: 'std',
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

    const outputPath = path.join(tmpDir, 'output.mp4');

    // Try crossfade stitch first, fall back to simple concat
    try {
      await stitchWithCrossfade(clipPaths, outputPath, tmpDir);
    } catch (xfadeErr) {
      console.warn('[Stitch] Crossfade failed, trying simple concat:', xfadeErr);
      const concatListPath = path.join(tmpDir, 'concat.txt');
      const concatContent = clipPaths.map(p => `file '${p}'`).join('\n');
      await fs.writeFile(concatListPath, concatContent);
      await stitchWithFFmpeg(concatListPath, outputPath);
    }

    // Add music overlay
    const musicGenre = (job.music_genre as string) || 'cinematic';
    const musicUrl = MUSIC_TRACKS[musicGenre];
    const finalOutputPath = path.join(tmpDir, 'final.mp4');

    if (musicUrl) {
      try {
        await addMusicOverlay(outputPath, musicUrl, finalOutputPath);
        // Use the version with music
        const finalBuffer = await fs.readFile(finalOutputPath);
        console.log(`[Stitch] Final output with music: ${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB`);
        const outputUrl = await uploadVideo(job, finalBuffer);
        await cleanup(tmpDir);
        await supabase.from('video_jobs').update({ status: 'done', output_video_url: outputUrl, metadata: { ...metadata, allClipUrls: clips } }).eq('id', job.id);
        return NextResponse.json({ status: 'done', message: `Video complete! ${clipPaths.length} clips with music.`, outputUrl, hasVideo: true });
      } catch (musicErr) {
        console.warn('[Stitch] Music overlay failed, using video without music:', musicErr);
      }
    }

    // No music or music failed — use stitched output directly
    const outputBuffer = await fs.readFile(outputPath);
    console.log(`[Stitch] Output: ${(outputBuffer.length / 1024 / 1024).toFixed(1)}MB`);
    const outputUrl = await uploadVideo(job, outputBuffer);
    await cleanup(tmpDir);
    await supabase.from('video_jobs').update({ status: 'done', output_video_url: outputUrl, metadata: { ...metadata, allClipUrls: clips } }).eq('id', job.id);
    return NextResponse.json({ status: 'done', message: `Video complete! ${clipPaths.length} clips stitched.`, outputUrl, hasVideo: true });
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
function addMusicOverlay(videoPath: string, musicUrl: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFFmpegPath();
    if (!ffmpegPath) { reject(new Error('No ffmpeg')); return; }

    import('fluent-ffmpeg').then(ffmpeg => {
      ffmpeg.default()
        .setFfmpegPath(ffmpegPath)
        .input(videoPath)
        .input(musicUrl)
        .outputOptions([
          '-c:v copy',           // keep video as-is
          '-c:a aac',            // encode audio to AAC
          '-b:a 128k',           // audio bitrate
          '-shortest',           // stop when shortest stream ends (the video)
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('start', (cmd: string) => console.log(`[Stitch] Music: ${cmd}`))
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
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
    const userId = job.user_id as string;
    const filePath = `${userId}/video-output/${job.id}-${Date.now()}.mp4`;
    const { error: uploadError } = await serviceClient.storage
      .from('user-uploads')
      .upload(filePath, buffer, { contentType: 'video/mp4', upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = serviceClient.storage.from('user-uploads').getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (err) {
    console.warn('[Upload] Service upload failed:', err);
    throw err;
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
