import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

// Map room types to Decor8 room_type values
const ROOM_TYPES: Record<string, string> = {
  living: 'livingroom',
  bedroom: 'bedroom',
  dining: 'dining',
  office: 'office',
  kitchen: 'kitchen',
};

// Map styles to Decor8 design_style values
const DESIGN_STYLES: Record<string, string> = {
  modern: 'modern',
  scandinavian: 'scandinavian',
  luxury: 'luxury',
  minimalist: 'minimalist',
  industrial: 'industrial',
};

// Map room types to Flux prompts
const ROOM_PROMPTS: Record<string, string> = {
  living: 'furnished living room with comfortable sofa, coffee table, entertainment center, rug, lamps, professional interior design',
  bedroom: 'furnished bedroom with bed, nightstands, dresser, lamp, cozy bedding, window treatments, professional interior design',
  dining: 'furnished dining room with dining table, chairs, chandelier, sideboard, table setting, professional interior design',
  office: 'furnished home office with desk, office chair, bookshelf, computer, lamp, professional interior design',
  kitchen: 'furnished kitchen with countertops, appliances, dining area, modern fixtures, professional interior design',
};

const STYLE_PROMPTS: Record<string, string> = {
  modern: 'modern contemporary furniture, clean lines, neutral colors, sleek design, minimalist decor',
  scandinavian: 'scandinavian style, light wood, white and beige, minimalist, cozy hygge, natural textures',
  luxury: 'luxury high-end furniture, elegant, premium materials, sophisticated design, marble, gold accents',
  minimalist: 'minimalist furniture, simple clean design, uncluttered, zen aesthetic, neutral palette',
  industrial: 'industrial style, metal and wood, exposed elements, urban loft aesthetic, leather furniture',
};

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { image, roomType, furnitureStyle, model = 'flux-depth' } = body;

    if (!image || !roomType || !furnitureStyle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let resultUrl: string;
    let creditsUsed: number;

    if (model === 'decor8') {
      // Use Decor8 AI API for premium staging (best structure preservation)
      creditsUsed = 3;

      const roomTypeDecor8 = ROOM_TYPES[roomType] || 'livingroom';
      const designStyle = DESIGN_STYLES[furnitureStyle] || 'modern';

      console.log('Calling Decor8 AI for virtual staging:', { roomType: roomTypeDecor8, designStyle });

      // Call Decor8 API
      const decor8Response = await fetch('https://api.decor8.ai/generate_designs_for_room', {
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
      resultUrl = decor8Data?.info?.images?.[0]?.url;

      if (!resultUrl) {
        throw new Error('No output from Decor8 API');
      }

    } else if (model === 'flux-depth') {
      // Use FLUX Depth Pro with proper depth conditioning
      creditsUsed = 2;

      const roomPrompt = ROOM_PROMPTS[roomType] || ROOM_PROMPTS.living;
      const stylePrompt = STYLE_PROMPTS[furnitureStyle] || STYLE_PROMPTS.modern;
      const prompt = `${roomPrompt}, ${stylePrompt}, professional real estate photography, well-lit, high quality, interior design magazine, bright and clean`;

      console.log('Calling FLUX Depth Pro for virtual staging:', { roomType, furnitureStyle });

      // FLUX Depth Pro uses depth map to preserve structure
      // First generate depth map from input, then use ControlNet conditioning
      const result = await replicate.run(
        "black-forest-labs/flux-depth-pro",
        {
          input: {
            image: image,
            prompt: prompt,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            strength: 0.75, // Balance between preserving structure and adding furniture
            output_format: 'webp',
            output_quality: 90,
          },
        }
      );

      // Handle output
      if (typeof result === 'string') {
        resultUrl = result;
      } else if (Array.isArray(result) && result.length > 0) {
        resultUrl = String(result[0]);
      } else if (result && typeof result === 'object') {
        const out = result as Record<string, unknown>;
        resultUrl = String(out.url || out.output || JSON.stringify(result));
      } else {
        resultUrl = String(result);
      }

      if (!resultUrl || resultUrl === '[object Object]') {
        throw new Error('No output from FLUX Depth Pro');
      }

    } else {
      // Fallback to SDXL for other models
      creditsUsed = 2;

      const roomPrompt = ROOM_PROMPTS[roomType] || ROOM_PROMPTS.living;
      const stylePrompt = STYLE_PROMPTS[furnitureStyle] || STYLE_PROMPTS.modern;
      const prompt = `${roomPrompt}, ${stylePrompt}, professional real estate photography, well-lit, high quality, interior design magazine, bright and clean`;
      const negativePrompt = 'empty room, unfurnished, blurry, low quality, distorted, overexposed, underexposed, noisy, pixelated, watermark, text, dark, cluttered';

      const result = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            image: image,
            prompt: prompt,
            negative_prompt: negativePrompt,
            num_inference_steps: 30,
            prompt_strength: 0.7,
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
        resultUrl = String(out.url || out.output || JSON.stringify(result));
      } else {
        resultUrl = String(result);
      }
    }

    // Deduct credits
    const { data: userData } = await supabase
      .from('propertypix_users')
      .select('credits, used_credits')
      .eq('id', user.id)
      .single();

    if (userData) {
      await supabase
        .from('propertypix_users')
        .update({
          credits: Math.max(0, userData.credits - creditsUsed),
          used_credits: userData.used_credits + creditsUsed,
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      output: resultUrl,
      roomType,
      furnitureStyle,
      model,
      creditsUsed,
    });

  } catch (error) {
    console.error('Virtual staging error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Virtual staging failed' },
      { status: 500 }
    );
  }
}
