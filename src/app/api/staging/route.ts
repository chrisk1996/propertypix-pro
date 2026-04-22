import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { authenticateRequest, logApiUsage } from '@/lib/api-auth';

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

// Room type prompts for virtual staging
const ROOM_PROMPTS: Record<string, string> = {
  living: 'wide angle furnished living room with comfortable sofa, coffee table, rug, lamps, wall art, plants, curtains, full room visible',
  bedroom: 'wide angle furnished bedroom with bed, nightstands, lamps, dresser, rug, curtains, pillows, full room visible',
  kitchen: 'wide angle furnished kitchen with dining table, chairs, countertop decorations, pendant lights, full room visible',
  bathroom: 'wide angle furnished bathroom with towels, plants, soap dispensers, mirror, rug, full room visible',
  dining: 'wide angle furnished dining room with dining table, chairs, sideboard, centerpiece, pendant light, full room visible',
  office: 'wide angle furnished home office with desk, office chair, bookshelf, desk lamp, computer, rug, full room visible',
  basement: 'wide angle furnished basement with entertainment center, sofa, game table, rug, lighting, full room visible',
  patio: 'wide angle furnished patio with outdoor furniture, plants, string lights, rug, cushions, full area visible',
};

// Style prompts for virtual staging
const STYLE_PROMPTS: Record<string, string> = {
  modern: 'modern minimalist style, clean lines, neutral colors, contemporary furniture',
  scandinavian: 'scandinavian style, light wood, white walls, cozy textiles, minimalist',
  industrial: 'industrial style, exposed brick, metal fixtures, dark colors, leather furniture',
  bohemian: 'bohemian style, colorful textiles, plants, rattan furniture, eclectic decor',
  traditional: 'traditional style, classic furniture, warm colors, elegant details, antique pieces',
  midcentury: 'mid-century modern style, retro furniture, warm wood tones, bold colors',
  farmhouse: 'farmhouse style, rustic wood, shiplap walls, vintage accessories, cozy textiles',
  luxury: 'luxury style, high-end furniture, marble accents, gold fixtures, elegant decor',
  minimalist: 'minimalist style, simple furniture, clean lines, neutral tones, uncluttered space',
};

// Max time to wait for a prediction (ms)
const POLL_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 1_000;

/** Extract a URL string from various Replicate response shapes */
function extractOutputUrl(result: unknown): string | null {
  if (typeof result === 'string') return result;
  if (Array.isArray(result) && result.length > 0) {
    const first = result[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) {
      const url = typeof first.url === 'function' ? first.url() : first.url;
      return typeof url === 'string' ? url : url.toString();
    }
    return String(first);
  }
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    if (typeof obj.url === 'string') return obj.url;
    if (typeof obj.output === 'string') return obj.output;
  }
  return null;
}

// Generate depth map using Marigold
async function generateDepthMap(imageUrl: string): Promise<string> {
  const result = await replicate.run(
    "adirik/marigold:1a363593bc4882684fc58042d19db5e13a810e44e02f8d4c32afd1eb30464818",
    { input: { image: imageUrl } }
  );

  const url = extractOutputUrl(result);
  if (!url) {
    throw new Error('Failed to generate depth map - no valid URL returned. Result: ' + JSON.stringify(result));
  }
  return url;
}

/** Poll a Replicate prediction until it completes or times out */
async function waitForPrediction(predictionId: string): Promise<Replicate.Prediction> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let pred = await replicate.predictions.get(predictionId);

  while (pred.status !== 'succeeded' && pred.status !== 'failed' && pred.status !== 'canceled') {
    if (Date.now() > deadline) {
      throw new Error('AI model timed out — please try again');
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    pred = await replicate.predictions.get(predictionId);
  }

  if (pred.status === 'failed') {
    throw new Error(pred.error || 'AI model failed to generate output');
  }

  return pred;
}

/** Atomically deduct credits, returns updated credits or throws if insufficient */
async function deductCredits(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, amount: number): Promise<number> {
  // Atomic decrement: only succeeds if credits >= amount (or unlimited = -1)
  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    // Fallback: if RPC doesn't exist, do a safe manual decrement
    const { data: userData } = await supabase
      .from('zestio_users')
      .select('credits, used_credits')
      .eq('id', userId)
      .single();

    if (!userData) throw new Error('User not found for credit deduction');

    const isUnlimited = userData.credits === -1;
    if (!isUnlimited && userData.credits < amount) {
      throw new Error('Insufficient credits');
    }

    const newCredits = isUnlimited ? -1 : userData.credits - amount;
    await supabase
      .from('zestio_users')
      .update({
        credits: newCredits,
        used_credits: (userData.used_credits || 0) + amount,
      })
      .eq('id', userId);

    return newCredits;
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.userId;
    const supabase = await createClient();

    // Check if user has credits
    const { data: userData } = await supabase
      .from('zestio_users')
      .select('credits, used_credits, subscription_tier')
      .eq('id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { image, roomType, furnitureStyle, model = 'interior-design' } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Check credits (enterprise has unlimited)
    const hasUnlimitedCredits = userData.subscription_tier === 'enterprise' || userData.credits === -1;
    if (!hasUnlimitedCredits && userData.credits <= 0) {
      return NextResponse.json({ error: 'No credits remaining' }, { status: 402 });
    }

    let outputUrl: string | null = null;
    let creditsUsed = 2;
    let usedModel = model;

    try {
      const roomPrompt = ROOM_PROMPTS[roomType] || ROOM_PROMPTS.living;
      const stylePrompt = STYLE_PROMPTS[furnitureStyle] || STYLE_PROMPTS[furnitureStyle === 'minimalist' ? 'minimalist' : 'modern'];
      const prompt = `${roomPrompt}, ${stylePrompt}, wide angle, full room visible, professional real estate photography, well-lit, high quality, keep original room structure, preserve walls, preserve windows, preserve ceiling, preserve floor plan`;
      const negativePrompt = 'empty room, unfurnished, blurry, low quality, distorted, watermark, text, dark, structural changes, different room';

      if (model === 'decor8') {
        // Use Decor8 API for virtual staging
        const roomTypeDecor8 = roomType?.toUpperCase() || 'LIVING_ROOM';
        const designStyle = furnitureStyle?.toUpperCase() || 'MODERN';

        const decor8Response = await fetch('https://api.decor8.ai/api/v1/stage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.DECOR8_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input_image_url: image,
            room_type: roomTypeDecor8,
            design_style: designStyle,
            num_images: 1,
          }),
        });

        if (!decor8Response.ok) {
          const errorText = await decor8Response.text();
          console.error('Decor8 API error:', errorText);
          throw new Error(`Decor8 staging failed: ${decor8Response.status}`);
        }

        const decor8Data = await decor8Response.json();
        outputUrl = decor8Data?.info?.images?.[0]?.url;
        if (!outputUrl) {
          throw new Error('No output from Decor8 API');
        }
        usedModel = 'decor8';

      } else if (model === 'flux-depth') {
        // FLUX Depth Pro workflow: depth map + FLUX
        console.log('FLUX Depth Pro workflow:', { roomType, furnitureStyle });

        const depthMapUrl = await generateDepthMap(image);
        console.log('Depth map generated:', depthMapUrl);

        const prediction = await replicate.predictions.create({
          model: "black-forest-labs/flux-depth-pro",
          input: {
            control_image: depthMapUrl,
            prompt,
            num_inference_steps: 30,
            guidance_scale: 2.5,
            output_format: 'webp',
          },
        });

        const finalPrediction = await waitForPrediction(prediction.id);
        console.log('FLUX Depth result:', JSON.stringify(finalPrediction.output)?.substring(0, 200));
        outputUrl = extractOutputUrl(finalPrediction.output);
        if (!outputUrl) {
          throw new Error('No output from FLUX Depth Pro. Output: ' + JSON.stringify(finalPrediction.output)?.substring(0, 300));
        }
        usedModel = 'flux-depth';

      } else if (model === 'interior-design') {
        // Use adirik/interior-design - ControlNet-based virtual staging
        console.log('Interior design model:', { roomType, furnitureStyle });

        const fullPrompt = prompt + ', interior design magazine';
        const prediction = await replicate.predictions.create({
          model: "adirik/interior-design",
          input: {
            image: image,
            prompt: fullPrompt,
            negative_prompt: 'empty room, unfurnished, blurry, low quality, distorted, watermark, text, dark, structural changes, different room, changed walls, changed windows, changed ceiling, changed floor plan',
            num_inference_steps: 50,
            guidance_scale: 15,
            prompt_strength: 0.6,
          },
        });

        const finalPrediction = await waitForPrediction(prediction.id);
        outputUrl = extractOutputUrl(finalPrediction.output);
        if (!outputUrl) {
          throw new Error('No output from interior design model');
        }
        usedModel = 'interior-design';

      } else {
        // Fallback to SDXL
        const result = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          {
            input: {
              image: image,
              prompt,
              negative_prompt: negativePrompt,
              num_inference_steps: 30,
              prompt_strength: 0.7,
              guidance_scale: 7.5,
              refine: "expert_ensemble_refiner",
            },
          }
        );

        outputUrl = extractOutputUrl(result);
        if (!outputUrl) {
          throw new Error('No output from SDXL model');
        }
        usedModel = 'sdxl';
      }

      // Deduct credits atomically
      const remainingCredits = await deductCredits(supabase, userId, creditsUsed);

      // Log usage
      logApiUsage({
        apiKeyId: authResult.apiKeyId,
        userId,
        endpoint: '/api/staging',
        creditsUsed,
        model: usedModel,
        statusCode: 200,
        ipAddress: ip,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        output: outputUrl,
        model: usedModel,
        creditsUsed,
        creditsRemaining: hasUnlimitedCredits ? -1 : remainingCredits,
      });
    } catch (apiError: any) {
      console.error('API error:', apiError);
      return NextResponse.json(
        { error: apiError.message || 'Virtual staging failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Staging error:', error);
    return NextResponse.json(
      { error: 'Failed to process virtual staging request' },
      { status: 500 }
    );
  }
}
