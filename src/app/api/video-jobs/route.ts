// Video Jobs API — Client-driven step processing
// POST /api/video-jobs - Create video job
// GET /api/video-jobs - List user's video jobs
// POST /api/video-jobs/[id]/process - Advance job one step

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CREDIT_COSTS } from '@/lib/pricing';
import { detectPlatform } from '@/lib/video-pipeline-queue';

export const dynamic = 'force-dynamic';


// Style prompts for AI renovation

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

    // Detect platform from URL
    const platform = normalizedUrl ? detectPlatform(normalizedUrl) : 'other';

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('video_jobs')
      .insert({
        user_id: user.id,
        listing_url: normalizedUrl || 'manual-mode',
        platform,
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
        await supabase.rpc('deduct_credits', { p_user_id: user.id, p_amount: CREDIT_COSTS.VIDEO_GENERATION });
      } catch {
        await supabase
          .from('zestio_users')
          .update({
            credits: Math.max(0, (userData?.credits ?? 0) - CREDIT_COSTS.VIDEO_GENERATION),
            used_credits: (userData?.used_credits ?? 0) + CREDIT_COSTS.VIDEO_GENERATION,
          })
          .eq('id', user.id);
      }
    }

    console.log(`[VideoJobs] Created job ${job.id}. Client will trigger processing.`);

    return NextResponse.json({
      success: true,
      job_id: job.id,
      status: 'scraping',
      message: 'Video job created',
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
