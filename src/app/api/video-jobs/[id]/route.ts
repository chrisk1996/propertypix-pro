// Single Video Job API
// GET /api/video-jobs/[id] - Get single job with assets

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering - uses cookies/auth
export const dynamic = 'force-dynamic';

// GET - Get single video job with assets
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get job ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Fetch job with assets
    const { data: job, error } = await supabase
      .from('video_jobs')
      .select(`
        *,
        assets:video_job_assets(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Generate signed URLs for assets
    const assetsWithUrls = await Promise.all(
      (job.assets || []).map(async (asset: {
        id: string;
        storage_path: string;
        type: string;
        order_index: number | null;
        room_label: string | null;
        metadata: Record<string, unknown> | null;
      }) => {
        try {
          const { data: signedUrlData } = await supabase.storage
            .from('job-assets')
            .createSignedUrl(asset.storage_path, 3600);

          return {
            ...asset,
            signed_url: signedUrlData?.signedUrl || null,
          };
        } catch (urlError) {
          console.error(`Error generating signed URL for asset ${asset.id}:`, urlError);
          return {
            ...asset,
            signed_url: null,
          };
        }
      })
    );

    // Calculate progress based on status
    const statusProgress: Record<string, number> = {
      queued: 0,
      scraping: 10,
      renovating: 30,
      animating: 60,
      stitching: 85,
      done: 100,
      failed: 0,
    };

    const progress = statusProgress[job.status] || 0;

    // Return job with assets and progress
    return NextResponse.json({
      success: true,
      job: {
        ...job,
        assets: assetsWithUrls,
        progress,
      },
    });
  } catch (error) {
    console.error('Video job fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch video job';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Cancel/delete a video job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get job ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Check if job exists and belongs to user
    const { data: job, error: fetchError } = await supabase
      .from('video_jobs')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation if job is queued
    if (job.status === 'done') {
      // For completed jobs, just delete the record
      await supabase.from('video_jobs').delete().eq('id', id);
      return NextResponse.json({
        success: true,
        message: 'Job deleted',
      });
    }

    if (job.status === 'failed') {
      // For failed jobs, just delete the record
      await supabase.from('video_jobs').delete().eq('id', id);
      return NextResponse.json({
        success: true,
        message: 'Failed job deleted',
      });
    }

    // For in-progress jobs, mark as failed and refund credit
    await supabase
      .from('video_jobs')
      .update({
        status: 'failed',
        error_message: 'Cancelled by user',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Refund credit
    const { data: credits } = await supabase
      .from('enhancement_credits')
      .select('credits_used')
      .eq('user_id', user.id)
      .single();

    if (credits && credits.credits_used > 0) {
      await supabase
        .from('enhancement_credits')
        .update({ credits_used: credits.credits_used - 1 })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelled and credit refunded',
    });
  } catch (error) {
    console.error('Video job cancellation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel video job';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
