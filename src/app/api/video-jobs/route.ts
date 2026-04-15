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
      renovation_style = 'modern',
      music_genre = 'cinematic'
    } = body;

    // Validate URL
    if (!listing_url) {
      return NextResponse.json(
        { error: 'listing_url is required' },
        { status: 400 }
      );
    }

    // Auto-prepend https:// if missing protocol
    let normalizedUrl = listing_url;
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
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

    const creditsRemaining = (userData?.credits ?? 0) - (userData?.used_credits ?? 0);
    if (creditsRemaining < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Video generation requires 1 credit.' },
        { status: 402 }
      );
    }

    // Detect platform from URL
    const platform = detectPlatform(normalizedUrl);

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('video_jobs')
      .insert({
        user_id: user.id,
        listing_url: normalizedUrl,
        platform,
        renovation_style,
        music_genre,
        status: 'queued',
        credits_used: 1,
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

    // Deduct credit from zestio_users
    await supabase
      .from('zestio_users')
      .update({ used_credits: (userData?.used_credits ?? 0) + 1 })
      .eq('id', user.id);

    // Enqueue job for processing (optional - may fail on serverless)
    try {
      await queueVideoPipeline({
        jobId: job.id,
        userId: user.id,
        listingUrl: normalizedUrl,
        platform,
        renovationStyle: renovation_style,
        musicGenre: music_genre,
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
