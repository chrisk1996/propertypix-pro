import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { CREDIT_COSTS } from '@/lib/pricing';
import { logCreditTransaction } from '@/lib/credit-transactions';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { authenticateRequest, logApiUsage } from '@/lib/api-auth';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

const RATE_LIMIT_OPTIONS = { limit: 10, windowMs: 60 * 60 * 1000 };

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    if (!(await checkRateLimit(ip, RATE_LIMIT_OPTIONS)).allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }

    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.userId;
    const supabase = await createClient();

    // Check credits
    const { data: userData, error: userError } = await supabase
      .from('zestio_users')
      .select('credits, used_credits')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    if (userData.credits < CREDIT_COSTS.UPSCALE) {
      return NextResponse.json({ error: 'Not enough credits. Please upgrade your plan.' }, { status: 402 });
    }

    const body = await request.json();
    const { image, scale = 4 } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Use Real-ESRGAN for upscaling (fast, reliable, good quality)
    const result = await replicate.run(
      "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
      {
        input: {
          image,
          scale,
          face_enhance: false,
        },
      }
    );

    let resultUrl: string;
    if (typeof result === 'string') {
      resultUrl = result;
    } else if (Array.isArray(result) && result.length > 0) {
      const first = result[0];
      resultUrl = typeof first === 'string' ? first : String((first as Record<string, unknown>)?.url || first);
    } else if (result && typeof result === 'object') {
      const out = result as Record<string, unknown>;
      // Handle FileOutput objects from Replicate SDK v1.4+
      if (out.url && typeof out.url === 'string') {
        resultUrl = out.url;
      } else if (out.output) {
        const output = out.output;
        if (typeof output === 'string') {
          resultUrl = output;
        } else if (Array.isArray(output) && output.length > 0) {
          resultUrl = typeof output[0] === 'string' ? output[0] : String(output[0]);
        } else {
          resultUrl = String(output);
        }
      } else {
        // Check if result itself has a toString that gives a URL
        const str = String(result);
        resultUrl = str.startsWith('http') ? str : '';
      }
      if (!resultUrl) {
        throw new Error('Could not extract output URL from Replicate response');
      }
    } else {
      throw new Error('Invalid output from upscaler');
    }

    console.log('[Upscale] Result URL type:', typeof result, '| URL:', resultUrl?.substring(0, 100));

    // Upload result to Supabase storage for persistence (Replicate URLs expire)
    let persistentUrl = resultUrl;
    try {
      const imageResponse = await fetch(resultUrl);
      if (imageResponse.ok) {
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const storagePath = `${userId}/upscale/${Date.now()}-upscale-${scale}x.png`;
        const { error: uploadErr } = await supabase.storage
          .from('user-uploads')
          .upload(storagePath, imageBuffer, { contentType: 'image/png', upsert: false });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('user-uploads').getPublicUrl(storagePath);
          if (urlData.publicUrl) {
            persistentUrl = urlData.publicUrl;
          }
        } else {
          console.warn('[Upscale] Storage upload failed, using Replicate URL:', uploadErr.message);
        }
      }
    } catch (storageErr) {
      console.warn('[Upscale] Storage upload error, using Replicate URL:', storageErr);
    }
    const { error: deductError } = await supabase.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: CREDIT_COSTS.UPSCALE,
    });
    if (deductError) {
      console.error('[Upscale] Credit deduction failed:', deductError.message);
    }

    logCreditTransaction({
      userId,
      type: 'usage',
      amount: -CREDIT_COSTS.UPSCALE,
      description: `AI Upscale (${scale}x)`,
    }).catch(() => {});

    logApiUsage({
      apiKeyId: authResult.apiKeyId,
      userId,
      endpoint: '/api/upscale',
      creditsUsed: CREDIT_COSTS.UPSCALE,
      statusCode: 200,
      ipAddress: ip,
    }).catch(() => {});

    // Save to library
    supabase.from('zestio_jobs').insert({
      user_id: userId,
      input_url: image,
      output_url: persistentUrl,
      job_type: 'upscale',
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: { scale, creditsUsed: CREDIT_COSTS.UPSCALE },
    }).then(({ error }) => { if (error) console.warn('[Upscale] Failed to save job:', error.message); });

    return NextResponse.json({
      success: true,
      output: persistentUrl,
      scale,
      creditsUsed: CREDIT_COSTS.UPSCALE,
    });
  } catch (error) {
    console.error('[Upscale] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upscale image' },
      { status: 500 }
    );
  }
}
