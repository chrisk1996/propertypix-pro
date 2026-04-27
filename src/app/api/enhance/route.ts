import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { CREDIT_COSTS } from '@/lib/pricing';
import { logCreditTransaction } from '@/lib/credit-transactions';
import { checkRateLimit } from '@/lib/rate-limit';
// Force dynamic rendering - uses cookies/auth
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { authenticateRequest, logApiUsage } from '@/lib/api-auth';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

const RATE_LIMIT_OPTIONS = { limit: 10, windowMs: 60 * 60 * 1000 }; // 10 req/hour

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    if (!(await checkRateLimit(ip, RATE_LIMIT_OPTIONS)).allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.userId;
    const supabase = await createClient();

    // Check user credits
    const { data: userData, error: userError } = await supabase
      .from('zestio_users')
      .select('credits, used_credits, subscription_tier')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[Enhance] Error fetching user:', userError?.message);
      return NextResponse.json({ error: 'User profile not found. Please try signing in again.' }, { status: 404 });
    }

    // Check credits before AI call (Model A: credits = remaining balance)
    if (userData && userData.credits < CREDIT_COSTS.ENHANCE_BASIC) {
      return NextResponse.json(
        { error: 'Not enough credits. Please upgrade your plan.' },
        { status: 402 }
      );
    }

    const body = await request.json();
    const { image, enhancementType, model = 'auto' } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
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
        case 'sky_sunset':
          prompt = "golden hour sunset sky, warm orange and pink clouds, dramatic twilight, real estate exterior photography, professional photo, high quality";
          break;
        case 'sky_dramatic':
          prompt = "dramatic clouds, moody sky, professional real estate exterior photography, cinematic lighting, high quality";
          break;
        case 'season_summer':
          prompt = "lush green trees, summer landscape, bright sunlight, vibrant greenery, blooming flowers, real estate exterior photography, high quality";
          break;
        case 'season_autumn':
          prompt = "autumn foliage, golden orange and red leaves, fall colors, warm light, real estate exterior photography, high quality";
          break;
        case 'season_winter':
          prompt = "snow-covered ground, winter scene, pristine white snow, bare trees, soft winter light, real estate exterior photography, high quality";
          break;
        case 'object_removal':
          prompt = "clean room, professional real estate photography, empty space, organized, clean, high quality, no objects, no clutter";
          break;
        case 'declutter':
          prompt = "clean minimalist room, no personal items, no toys, no cables, no pet items, professional real estate photography, organized, tidy, high quality";
          break;
        case 'curb_appeal':
          prompt = "beautiful manicured lawn, green grass, clean facade, trimmed hedges, fresh landscaping, power lines removed, real estate exterior photography, high quality";
          break;
        case 'facade_refresh':
          prompt = "freshly painted clean facade, modern exterior, clean walls, no stains, professional real estate exterior photography, high quality";
          break;
        case 'twilight':
          prompt = "virtual twilight, dusk exterior, warm interior lights glowing, blue hour sky, professional real estate photography, high quality";
          break;
        default:
          prompt = "professional real estate photography, enhanced, high quality, vibrant colors, sharp details, well-lit";
      }
    }
    const negativePrompt = "blurry, low quality, distorted, overexposed, underexposed, noisy, pixelated, watermark, text";

    try {
      let resultUrl: string;
      let creditsUsed = CREDIT_COSTS.ENHANCE_BASIC;

      // Select model based on user choice
      if (model === 'flux-kontext') {
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
        creditsUsed = CREDIT_COSTS.ENHANCE_PREMIUM;
      } else if (model === 'ideogram') {
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
        creditsUsed = CREDIT_COSTS.ENHANCE_PREMIUM;
      } else {
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
        creditsUsed = CREDIT_COSTS.ENHANCE_BASIC;
      }

      // Deduct credits atomically via RPC (Model A: decrements credits, increments used_credits)
      const { data: newBalance, error: deductError } = await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: creditsUsed,
      });
      if (deductError) {
        console.error('[Enhance] Credit deduction failed:', deductError.message);
      }

      logApiUsage({
        apiKeyId: authResult.apiKeyId,
        userId,
        endpoint: '/api/enhance',
        creditsUsed,
        model,
        statusCode: 200,
        ipAddress: ip,
      }).catch(() => {});

      logCreditTransaction({ userId, type: 'usage', amount: -creditsUsed, description: `Photo enhancement (${model})` }).catch(() => {});

      return NextResponse.json({
        success: true,
        output: resultUrl,
        creditsUsed,
        model,
      });
    } catch (enhanceError) {
      console.error('[Enhance] Enhancement error:', enhanceError);
      throw enhanceError;
    }
  } catch (error) {
    console.error('[Enhance] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to enhance image';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
