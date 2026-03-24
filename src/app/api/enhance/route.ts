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

    // Use Replicate's SDXL model for image-to-image enhancement
    // Model: stability-ai/sdxl (version: 39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b)
    const result = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          image: image,
          prompt: prompt,
          negative_prompt: "blurry, low quality, distorted, overexposed, underexposed, noisy, pixelated",
          num_inference_steps: 30,
          prompt_strength: 0.6,
          guidance_scale: 7.5,
          refine: "expert_ensemble_refiner",
        }
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
