// Video Pipeline Jobs API
// POST /api/video-jobs - Create new video job
// GET /api/video-jobs - List user's video jobs

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { queueVideoPipeline, detectPlatform } from '@/lib/video-pipeline-queue';

// Force dynamic rendering - uses cookies/auth
export const dynamic = 'force-dynamic';

// POST - Create new video job
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      listing_url,
      manual_images,
      renovation_style = 'modern',
      music_genre = 'cinematic'
    } = body;

    // Validate: either URL or manual images required
    const isManualMode = Array.isArray(manual_images) && manual_images.length >= 5;
    if (!listing_url && !isManualMode) {
      return NextResponse.json(
        { error: 'Either listing_url or manual_images (min 5) is required' },
        { status: 400 }
      );
    }

    // Validate URL format (only for URL mode)
    let normalizedUrl = listing_url || '';
    if (normalizedUrl) {
      if (!normalizedUrl.match(/^https?:\/\//i)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      try {
        new URL(normalizedUrl);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Validate renovation style
    const validStyles = ['modern', 'luxury', 'minimalist', 'scandinavian', 'industrial', 'contemporary', 'coastal', 'midcentury'];
    if (!validStyles.includes(renovation_style)) {
      return NextResponse.json(
        { error: `Invalid renovation_style. Must be one of: ${validStyles.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate music genre
    const validGenres = ['cinematic', 'uplifting', 'ambient', 'acoustic', 'electronic', 'jazz', 'classical'];
    if (!validGenres.includes(music_genre)) {
      return NextResponse.json(
        { error: `Invalid music_genre. Must be one of: ${validGenres.join(', ')}` },
        { status: 400 }
      );
    }

    // Check user credits from zestio_users table
    const { data: userData } = await supabase
      .from('zestio_users')
      .select('credits, used_credits')
      .eq('id', user.id)
      .single();

    const hasUnlimitedCredits = userData?.credits === -1 || userData?.subscription_tier === 'enterprise';
    const creditsRemaining = hasUnlimitedCredits ? Infinity : ((userData?.credits ?? 0) - (userData?.used_credits ?? 0));
    if (!hasUnlimitedCredits && creditsRemaining < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Video generation requires 1 credit.' },
        { status: 402 }
      );
    }

    // Detect platform from URL (manual mode has no platform)
    const platform = normalizedUrl ? detectPlatform(normalizedUrl) : 'other';

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('video_jobs')
      .insert({
        user_id: user.id,
        listing_url: normalizedUrl || null,
        platform,
        renovation_style,
        music_genre,
        status: 'queued',
        credits_used: 1,
        input_images: isManualMode ? manual_images : null,
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating video job:', jobError);
      return NextResponse.json(
        { error: jobError.message },
        { status: 500 }
      );
    }

    // Deduct credit atomically
    if (!hasUnlimitedCredits) {
      try {
        await supabase.rpc('deduct_credits', {
          p_user_id: user.id,
          p_amount: 1,
        });
      } catch {
        // Fallback: manual decrement if RPC not available
        await supabase
          .from('zestio_users')
          .update({
            credits: Math.max(0, (userData?.credits ?? 0) - 1),
            used_credits: (userData?.used_credits ?? 0) + 1,
          })
          .eq('id', user.id);
      }
    }

    // Enqueue job for processing (optional - may fail on serverless)
    try {
      await queueVideoPipeline({
        jobId: job.id,
        userId: user.id,
        listingUrl: normalizedUrl || '',
        platform,
        renovationStyle: renovation_style,
        musicGenre: music_genre,
        inputImages: isManualMode ? manual_images : undefined,
      });
    } catch (queueError) {
      console.warn('[VideoJobs] Queue unavailable (serverless mode):', queueError);
      // Job is created, will be processed by cron or manual trigger
    }

    console.log(`[VideoJobs] Created job ${job.id} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      job_id: job.id,
      status: 'queued',
      message: 'Video job created and queued for processing',
    });
  } catch (error) {
    console.error('Video job creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create video job';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET - List user's video jobs
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('video_jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Filter by status if provided
    if (status) {
      const validStatuses = ['queued', 'scraping', 'renovating', 'animating', 'stitching', 'done', 'failed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      query = query.eq('status', status);
    }

    const { data: jobs, error, count } = await query;

    if (error) {
      console.error('Error fetching video jobs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Video jobs fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch video jobs';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
