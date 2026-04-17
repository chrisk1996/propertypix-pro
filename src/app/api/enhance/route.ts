import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
// Force dynamic rendering - uses cookies/auth
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

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
    const { image, enhancementType, model = 'auto' } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('zestio_jobs')
      .insert({
        user_id: user.id,
        input_url: image.substring(0, 500), // Store truncated reference
        job_type: enhancementType || 'auto',
        status: 'processing',
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    // Build prompt based on enhancement type
    let prompt: string = body.customPrompt;
    if (!prompt) {
      switch (enhancementType) {
        case 'staging':
          prompt = "furnished room, modern furniture, professional interior design, real estate photography, clean and bright, high quality";
          break;
        case 'sky':
          prompt = "beautiful blue sky, sunny day, real estate exterior photography, clear weather, professional photo, high quality";
          break;
        case 'object_removal':
          prompt = "clean room, professional real estate photography, empty space, organized, clean, high quality";
          break;
        default:
          prompt = "professional real estate photography, enhanced, high quality, vibrant colors, sharp details, well-lit";
      }
    }
    const negativePrompt = "blurry, low quality, distorted, overexposed, underexposed, noisy, pixelated, watermark, text";

    try {
      let resultUrl: string;
      let creditsUsed = 1;

      // Select model based on user choice
      if (model === 'flux-kontext') {
        // FLUX Kontext Pro - best for instruction-based edits
        console.log('Using FLUX Kontext Pro for enhancement');
        const result = await replicate.run(
          "black-forest-labs/flux-kontext-pro",
          {
            input: {
              image: image,
              prompt: prompt,
              num_inference_steps: 28,
              guidance_scale: 3.5,
              output_format: 'webp',
              output_quality: 90,
            },
          }
        );
        if (typeof result === 'string') {
          resultUrl = result;
        } else if (Array.isArray(result) && result.length > 0) {
          resultUrl = String(result[0]);
        } else if (result && typeof result === 'object') {
          const out = result as Record<string, unknown>;
          resultUrl = String(out.url || out.output);
        } else {
          throw new Error('Invalid output from FLUX Kontext');
        }
        creditsUsed = 2;
      } else if (model === 'ideogram') {
        // Ideogram v2 - best for text in images
        console.log('Using Ideogram v2 for enhancement');
        const result = await replicate.run(
          "ideogram-ai/ideogram-v2",
          {
            input: {
              image: image,
              prompt: prompt,
              negative_prompt: negativePrompt,
              num_inference_steps: 30,
              guidance_scale: 7.5,
            },
          }
        );
        if (typeof result === 'string') {
          resultUrl = result;
        } else if (Array.isArray(result) && result.length > 0) {
          resultUrl = String(result[0]);
        } else if (result && typeof result === 'object') {
          const out = result as Record<string, unknown>;
          resultUrl = String(out.url || out.output);
        } else {
          throw new Error('Invalid output from Ideogram');
        }
        creditsUsed = 2;
      } else {
        // Default: SDXL (fast and versatile) or 'auto'
        console.log('Using SDXL for enhancement (auto/default)');
        const result = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          {
            input: {
              image: image,
              prompt: prompt,
              negative_prompt: negativePrompt,
              num_inference_steps: 30,
              prompt_strength: 0.35,
              guidance_scale: 7.5,
              refine: "expert_ensemble_refiner",
            },
          }
        );
        if (typeof result === 'string') {
          resultUrl = result;
        } else if (Array.isArray(result) && result.length > 0) {
          resultUrl = String(result[0]);
        } else if (result && typeof result === 'object') {
          const out = result as Record<string, unknown>;
          resultUrl = String(out.url || out.output);
        } else {
          throw new Error('Invalid output from SDXL');
        }
        creditsUsed = 1;
      }

      // Update job with result
      await supabase
        .from('zestio_jobs')
        .update({
          output_url: resultUrl,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Deduct credits (only if not unlimited)
      if (userData && userData.credits !== -1) {
        await supabase
          .from('zestio_users')
          .update({
            credits: Math.max(0, userData.credits - creditsUsed),
            used_credits: userData.used_credits + creditsUsed,
          })
          .eq('id', user.id);
      }

      return NextResponse.json({
        success: true,
        output: resultUrl,
        jobId: job.id,
        creditsUsed,
        model,
      });
    } catch (enhanceError) {
      console.error('Enhancement error:', enhanceError);
      // Update job as failed
      await supabase
        .from('zestio_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id);
      throw enhanceError;
    }
  } catch (error) {
    console.error('Enhancement error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to enhance image';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
