import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
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

// Valid room types and their prompt enhancements
const ROOM_PROMPTS: Record<string, string> = {
  living: 'living room with comfortable seating area, coffee table, entertainment unit, soft lighting',
  bedroom: 'bedroom with bed, nightstands, wardrobe, soft ambient lighting, cozy atmosphere',
  kitchen: 'kitchen with modern appliances, counter space, dining area, functional layout',
  dining: 'dining room with dining table, chairs, sideboard, elegant table setting',
  office: 'home office with desk, ergonomic chair, shelving, task lighting, productive workspace',
};

// Valid furniture styles and their prompt enhancements
const STYLE_PROMPTS: Record<string, string> = {
  modern: 'modern furniture, sleek clean lines, neutral color palette, contemporary design, minimalist decor',
  scandinavian: 'scandinavian style, light wood tones, white and beige colors, hygge cozy atmosphere, natural textiles',
  luxury: 'luxury high-end furniture, premium materials, marble and gold accents, elegant sophisticated design, plush fabrics',
  minimalist: 'minimalist furniture, simple clean design, uncluttered space, neutral tones, zen aesthetic, functional pieces',
  industrial: 'industrial style, metal and reclaimed wood, exposed brick elements, loft aesthetic, urban contemporary design',
};

const VALID_ROOM_TYPES = Object.keys(ROOM_PROMPTS);
const VALID_STYLES = Object.keys(STYLE_PROMPTS);

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';

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
      .from('propertypix_users')
      .select('credits_remaining, credits_used, plan')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      // User might not exist in propertypix_users yet, create record
      const { error: insertError } = await supabase
        .from('propertypix_users')
        .insert({
          id: user.id,
          email: user.email || '',
          credits_remaining: 5, // Free tier default
          credits_used: 0,
          plan: 'free'
        });

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }
    } else if (userData && userData.credits_remaining <= 0) {
      return NextResponse.json(
        { error: 'No credits remaining. Please upgrade your plan.' },
        { status: 402 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { image, roomType, furnitureStyle } = body;

    // Validate required fields
    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!roomType) {
      return NextResponse.json({ error: 'Room type is required' }, { status: 400 });
    }

    if (!furnitureStyle) {
      return NextResponse.json({ error: 'Furniture style is required' }, { status: 400 });
    }

    // Validate room type
    const normalizedRoomType = roomType.toLowerCase();
    if (!VALID_ROOM_TYPES.includes(normalizedRoomType)) {
      return NextResponse.json(
        { error: `Invalid room type. Valid options: ${VALID_ROOM_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate furniture style
    const normalizedStyle = furnitureStyle.toLowerCase();
    if (!VALID_STYLES.includes(normalizedStyle)) {
      return NextResponse.json(
        { error: `Invalid furniture style. Valid options: ${VALID_STYLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('propertypix_jobs')
      .insert({
        user_id: user.id,
        original_image: image.substring(0, 500), // Store truncated reference
        enhancement_type: 'virtual_staging',
        status: 'processing',
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    // Build the virtual staging prompt
    const roomPrompt = ROOM_PROMPTS[normalizedRoomType];
    const stylePrompt = STYLE_PROMPTS[normalizedStyle];
    
    const prompt = `Virtual staging: ${roomPrompt}, ${stylePrompt}, professionally staged room, photorealistic, high quality real estate photography, well-lit, appealing interior design`;

    try {
      // Use Replicate's SDXL model for image-to-image virtual staging
      const result = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            image: image,
            prompt: prompt,
            negative_prompt: "blurry, low quality, distorted, overexposed, underexposed, noisy, pixelated, cluttered, messy, dark, shadowy, cartoon, illustration, painting, watermark, text",
            num_inference_steps: 30,
            prompt_strength: 0.65, // Slightly higher for more furniture presence
            guidance_scale: 7.5,
            refine: "expert_ensemble_refiner",
          },
        }
      );

      // Handle different output formats from Replicate
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

      // Update job with result
      await supabase
        .from('propertypix_jobs')
        .update({
          enhanced_image: resultUrl,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Deduct credit
      if (userData) {
        await supabase
          .from('propertypix_users')
          .update({
            credits_remaining: Math.max(0, userData.credits_remaining - 1),
            credits_used: userData.credits_used + 1,
          })
          .eq('id', user.id);
      }

      return NextResponse.json({
        success: true,
        output: resultUrl,
        jobId: job.id,
        roomType: normalizedRoomType,
        furnitureStyle: normalizedStyle,
      });

    } catch (stagingError) {
      console.error('Staging error:', stagingError);
      
      // Update job as failed
      await supabase
        .from('propertypix_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id);

      throw stagingError;
    }

  } catch (error) {
    console.error('Virtual staging error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to stage room';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
