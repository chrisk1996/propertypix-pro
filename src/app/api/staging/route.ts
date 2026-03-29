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

// Room-specific prompts - focused on furniture, not room changes
const ROOM_PROMPTS: Record<string, string> = {
  living: 'furnished living room with comfortable sofa, coffee table, TV stand, floor lamp, area rug, side tables, indoor plants',
  bedroom: 'furnished bedroom with bed, nightstands, lamps, dresser, accent chair, soft bedding',
  dining: 'furnished dining room with dining table, chairs, sideboard, pendant light, area rug',
  office: 'furnished home office with desk, office chair, bookshelf, filing cabinet, desk lamp',
  kitchen: 'staged kitchen with bar stools, pendant lights, countertop appliances, plants',
};

const STYLE_MODIFIERS: Record<string, string> = {
  modern: 'modern contemporary style, clean lines, neutral colors',
  scandinavian: 'scandinavian style, light wood, white and beige, cozy',
  luxury: 'luxury high-end style, premium materials, elegant',
  minimalist: 'minimalist style, simple functional, monochrome',
  industrial: 'industrial style, metal and wood, leather, urban',
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
    const { image, roomType, furnitureStyle } = body;

    if (!image || !roomType || !furnitureStyle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roomPrompt = ROOM_PROMPTS[roomType] || ROOM_PROMPTS.living;
    const styleModifier = STYLE_MODIFIERS[furnitureStyle] || STYLE_MODIFIERS.modern;

    // Build prompt for virtual staging
    const prompt = `${roomPrompt}, ${styleModifier}, professional real estate photography, bright natural lighting, photorealistic`;

    // Use FLUX ControlNet with depth - preserves room structure
    // Correct input format for xlabs-ai/flux-dev-controlnet
    const prediction = await replicate.predictions.create({
      model: "xlabs-ai/flux-dev-controlnet",
      input: {
        prompt: prompt,
        control_image: image,
        control_type: "depth",  // Depth preserves 3D geometry
        control_strength: 0.85,
        steps: 30,
        guidance_scale: 7.5,
        output_format: "jpg",
        output_quality: 90,
      },
    });

    // Wait for completion
    const result = await replicate.wait(prediction, { interval: 500 });

    let resultUrl: string;
    if (result.output) {
      if (typeof result.output === 'string') {
        resultUrl = result.output;
      } else if (Array.isArray(result.output) && result.output.length > 0) {
        resultUrl = String(result.output[0]);
      } else {
        resultUrl = String(result.output);
      }
    } else {
      throw new Error('No output from FLUX ControlNet');
    }

    // Deduct credits (2 credits for virtual staging)
    const { data: userData } = await supabase
      .from('propertypix_users')
      .select('credits, used_credits')
      .eq('id', user.id)
      .single();

    if (userData) {
      await supabase
        .from('propertypix_users')
        .update({
          credits: Math.max(0, userData.credits - 2),
          used_credits: userData.used_credits + 2,
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      output: resultUrl,
      roomType,
      furnitureStyle,
      creditsUsed: 2,
    });

  } catch (error) {
    console.error('Virtual staging error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Staging failed' },
      { status: 500 }
    );
  }
}
