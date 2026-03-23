import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

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
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { image, enhancementType } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    let output: unknown;
    let prompt: string;

    // Set prompt based on enhancement type
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

    // Use Replicate's image-to-image model for enhancement
    // Using a stable, working model
    const result = await replicate.run(
      "stability-ai/sdxl-img2img:d2e5446e6db43c5f3c5c5c5c5c5c5c5c" as `${string}/${string}:${string}`,
      {
        input: {
          image: image,
          prompt: prompt,
          negative_prompt: "blurry, low quality, distorted, overexposed, underexposed, noisy, pixelated",
          num_inference_steps: 30,
          strength: 0.6,
          guidance_scale: 7.5,
        }
      }
    );

    output = result;

    // Handle different output formats from Replicate
    let resultUrl: string;
    if (typeof output === 'string') {
      resultUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      resultUrl = String(output[0]);
    } else if (output && typeof output === 'object') {
      const out = output as Record<string, unknown>;
      resultUrl = String(out.url || out.output || JSON.stringify(output));
    } else {
      resultUrl = String(output);
    }

    return NextResponse.json({ 
      success: true, 
      output: resultUrl,
    });

  } catch (error) {
    console.error('Enhancement error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to enhance image';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
