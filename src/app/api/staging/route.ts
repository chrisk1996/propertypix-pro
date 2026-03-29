import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

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

// Room-specific prompts
const ROOM_PROMPTS: Record<string, string> = {
  living: 'Add modern furniture to this empty living room: comfortable L-shaped sofa, glass coffee table, TV stand, floor lamp, area rug, side tables with table lamps, potted indoor plant. Keep the original walls, windows, and flooring exactly as they are.',
  bedroom: 'Add furniture to this empty bedroom: king-size bed with upholstered headboard, nightstands with lamps on each side, dresser with mirror, accent chair in corner, soft bedding and pillows. Keep the original walls, windows, and flooring unchanged.',
  dining: 'Add furniture to this empty dining room: rectangular dining table for 6 people, upholstered dining chairs, sideboard cabinet, pendant light fixture above table, area rug under table. Keep original architecture intact.',
  office: 'Add furniture to this empty home office: executive desk, ergonomic office chair, bookshelf, filing cabinet, desk lamp, monitor stand, indoor plant. Keep walls and windows unchanged.',
  kitchen: 'Add staging to this empty kitchen: bar stools at island, pendant lights, countertop appliances, herb plants on windowsill, fruit bowl, cookbook stand. Keep original kitchen fixtures unchanged.',
};

const STYLE_MODIFIERS: Record<string, string> = {
  modern: 'Modern contemporary style: clean lines, neutral colors (white, gray, beige), sleek furniture, minimal decor.',
  scandinavian: 'Scandinavian style: light wood tones, white and soft beige palette, cozy textures (wool throws, linen), natural materials, hygge atmosphere.',
  luxury: 'Luxury high-end style: premium materials (marble, velvet, brass), rich colors, elegant statement pieces, sophisticated lighting, plush textures.',
  minimalist: 'Minimalist style: simple functional furniture, monochrome palette, uncluttered space, essential pieces only, zen aesthetic.',
  industrial: 'Industrial style: metal and reclaimed wood furniture, exposed elements, leather upholstery, urban contemporary, dark accent colors.',
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

    // Use FLUX Kontext Pro - best for instruction-based editing that preserves structure
    const prompt = `${roomPrompt} ${styleModifier} Professional real estate photography, bright natural lighting, photorealistic, high quality.`;

    const result = await replicate.run(
      "black-forest-labs/flux-kontext-pro",
      {
        input: {
          image: image,
          prompt: prompt,
          aspect_ratio: "match_input_image",
          output_format: "jpg",
          output_quality: 95,
        },
      }
    );

    let resultUrl: string;
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
