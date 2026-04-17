import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
// Force dynamic rendering - uses cookies/auth
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Rate limiting by IP (in-memory, resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user credits
    const { data: userData, error: userError } = await supabase
      .from('zestio_users')
      .select('credits, used_credits, subscription_tier')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      // User might not exist in zestio_users yet, create record
      const { error: insertError } = await supabase
        .from('zestio_users')
        .insert({
          id: user.id,
          credits: 5, // Free tier default
          used_credits: 0,
          subscription_tier: 'free'
        });
      if (insertError) {
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }
    } else if (userData && userData.credits !== -1 && userData.credits <= 0) {
      // -1 means unlimited credits (enterprise plan)
      return NextResponse.json(
        { error: 'No credits remaining. Please upgrade your plan.' },
        { status: 402 }
      );
    }

    const body = await request.json();
    const { image, motionType } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const validMotionTypes = ['pan_left', 'pan_right', 'zoom_in', 'zoom_out', 'orbit'];
    if (!motionType || !validMotionTypes.includes(motionType)) {
      return NextResponse.json({ error: 'Valid motion type required: pan_left, pan_right, zoom_in, zoom_out, orbit' }, { status: 400 });
    }

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('zestio_jobs')
      .insert({
        user_id: user.id,
        input_url: image.substring(0, 500), // Store truncated reference
        job_type: 'video',
        status: 'processing',
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    try {
      // Use Stable Video Diffusion for image-to-video generation
      const result = await replicate.run(
        "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4a51a4069a579d4b6db9cf11f11fd0d4",
        {
          input: {
            input_image: image,
            fps: 6,
            motion_bucket_id: getMotionBucketId(motionType),
            cond_aug: 0.02,
            decoding_t: 14,
            video_length: "2fps_6s",
          },
        }
      );

      // Handle video output from Replicate
      let videoUrl: string;
      if (typeof result === 'string') {
        videoUrl = result;
      } else if (Array.isArray(result) && result.length > 0) {
        videoUrl = String(result[0]);
      } else if (result && typeof result === 'object') {
        const out = result as Record<string, unknown>;
        videoUrl = String(out.url || out.output || JSON.stringify(result));
      } else {
        videoUrl = String(result);
      }

      // Update job with result
      await supabase
        .from('zestio_jobs')
        .update({
          output_url: videoUrl,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Deduct credits (video costs 3 credits - most expensive operation)
      // Only deduct if not unlimited (enterprise)
      if (userData && userData.credits !== -1) {
        await supabase
          .from('zestio_users')
          .update({
            credits: Math.max(0, userData.credits - 3),
            used_credits: userData.used_credits + 3,
          })
          .eq('id', user.id);
      }

      return NextResponse.json({
        success: true,
        output: videoUrl,
        jobId: job.id,
      });
    } catch (videoError) {
      console.error('Video generation error:', videoError);
      // Update job as failed
      await supabase
        .from('zestio_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id);
      throw videoError;
    }
  } catch (error) {
    console.error('Video generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Get job status endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = request.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const { data: job, error } = await supabase
      .from('zestio_jobs')
      .select('id, status, output_url, created_at, completed_at')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

// Map motion types to motion_bucket_id values for SVD
function getMotionBucketId(motionType: string): number {
  // Higher values = more motion
  // Pan motions use moderate movement
  // Zoom uses higher movement for dramatic effect
  // Orbit uses moderate-high movement
  switch (motionType) {
    case 'pan_left':
    case 'pan_right':
      return 127; // Moderate panning motion
    case 'zoom_in':
    case 'zoom_out':
      return 150; // Higher motion for zoom effect
    case 'orbit':
      return 140; // Moderate-high for orbit effect
    default:
      return 127;
  }
}
