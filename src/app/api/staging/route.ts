import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });


// Helper: Convert data URL to File and upload to Supabase storage
async function uploadImageToStorage(supabase: any, userId: string, dataUrl: string): Promise<string> {
  // Extract base64 data from data URL
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid image data URL format');
  }

  const extension = matches[1];
  const base64Data = matches[2];

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate unique filename
  const filename = `staging/${userId}/${Date.now()}.${extension}`;

  // Upload to Supabase storage
  const { data, error } = await supabase
    .storage
    .from('images')
    .upload(filename, buffer, {
      contentType: `image/${extension}`,
      upsert: true,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase
    .storage
    .from('images')
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

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

/**
 * Generate depth map from input image using Depth Pro (Apple's model)
 * Depth Pro provides sharp metric depth in less than a second
 */
async function generateDepthMap(imageUrl: string): Promise<string> {
  console.log('Generating depth map from image...');
  console.log('Input image URL:', imageUrl);

  try {
    // Use Marigold - diffusion-based monocular depth estimation
    // https://replicate.com/adirik/marigold
    // Returns: [grayscale_depth_url, spectral_depth_url]
    const result = await replicate.run(
      "adirik/marigold:1a363593bc4882684fc58042d19db5e13a810e44e02f8d4c32afd1eb30464818",
      {
        input: {
          image: imageUrl,
        },
      }
    );

    console.log('Depth Pro result:', JSON.stringify(result, null, 2));

    // Handle response from Depth Pro
    if (result && typeof result === 'object') {
      const r = result as any;
      
      // Try common output property names
      if (r.depth && typeof r.depth === 'string') {
        return r.depth;
      }
      if (r.depth_map && typeof r.depth_map === 'string') {
        return r.depth_map;
      }
      if (r.output && typeof r.output === 'string') {
        return r.output;
      }
      
      // Try to get URL from FileOutput
      if (typeof r.url === 'function') {
        const url = r.url();
        if (typeof url === 'string') return url;
        if (url && typeof url.toString === 'function') return url.toString();
      }
      
      // Try array output
      if (Array.isArray(result) && result.length > 0) {
        const first = result[0];
        if (typeof first === 'string') return first;
        if (first && typeof first.url === 'function') {
          const url = first.url();
          return typeof url === 'string' ? url : url.toString();
        }
      }

      // Try common property names
      if (r.url) return r.url;
      if (r.output) return typeof r.output === 'string' ? r.output : r.output.url;
      if (r.image) return r.image;
    }

    // Direct string URL
    if (typeof result === 'string') {
      return result;
    }

    console.error('Could not extract URL from result:', result);
    throw new Error('Failed to generate depth map - no valid URL returned. Result: ' + JSON.stringify(result));
  } catch (error) {
    console.error('Depth map generation error:', error);
    throw error;
  }
}

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

    // If image is a data URL, upload to storage first (Replicate needs public URLs)
    let imageUrl = image;
    if (image.startsWith('data:')) {
      console.log('Image is a data URL, uploading to storage...');
      imageUrl = await uploadImageToStorage(supabase, user.id, image);
      console.log('Image uploaded to:', imageUrl);
    }

    let resultUrl: string;
    let creditsUsed: number;

    if (model === 'decor8') {
      // Use Decor8 AI API for premium staging (best structure preservation)
      // Decor8 handles depth/structure internally - no manual depth map needed
      creditsUsed = 3;

      const roomTypeDecor8 = ROOM_TYPES[roomType] || 'livingroom';
      const designStyle = DESIGN_STYLES[furnitureStyle] || 'modern';

      console.log('Calling Decor8 AI for virtual staging:', { roomType: roomTypeDecor8, designStyle });

      const decor8Response = await fetch('https://api.decor8.ai/generate_designs_for_room', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DECOR8_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_image_url: imageUrl,
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
      // FLUX Depth Pro workflow:
      // 1. Generate depth map from input image using Depth Anything
      // 2. Use depth map as control_image for FLUX Depth Pro
      creditsUsed = 2;

      const roomPrompt = ROOM_PROMPTS[roomType] || ROOM_PROMPTS.living;
      const stylePrompt = STYLE_PROMPTS[furnitureStyle] || STYLE_PROMPTS.modern;
      // Emphasize preserving original background - no hallucinated outdoor scenes
      const prompt = `${roomPrompt}, ${stylePrompt}, professional real estate photography, well-lit, high quality, interior design magazine, bright and clean, preserve original window view, keep existing background, do not add outdoor scenery`;

      console.log('FLUX Depth Pro workflow:', { roomType, furnitureStyle });

      // Step 1: Generate depth map
      console.log('Step 1: Generating depth map...');
      const depthMapUrl = await generateDepthMap(imageUrl);
      console.log('Depth map generated successfully');

      // Step 2: Use depth map with FLUX Depth Pro
      console.log('Step 2: Running FLUX Depth Pro with depth conditioning...');

      // FLUX Depth Pro requires:
      // - control_image: must be a valid URI (we have depthMapUrl)
      // - output_format: must be 'jpg' or 'png' (not 'webp')
      // Lower guidance_scale = more adherence to depth map structure
      // Higher steps = better structure preservation
      const result = await replicate.run(
        "black-forest-labs/flux-depth-pro",
        {
          input: {
            control_image: depthMapUrl,
            prompt: prompt,
            num_inference_steps: 30,
            guidance_scale: 2.5,
            output_format: 'jpg',
            output_quality: 90,
          },
        }
      );

      // Handle output - could be FileOutput or array
      if (Array.isArray(result) && result.length > 0) {
        const first = result[0];
        if (first && typeof first.url === 'function') {
          resultUrl = first.url();
        } else {
          resultUrl = String(first);
        }
      } else if (result && typeof result === 'object' && typeof (result as any).url === 'function') {
        resultUrl = (result as any).url();
      } else if (typeof result === 'string') {
        resultUrl = result;
      } else {
        resultUrl = String(result);
      }

      if (!resultUrl || resultUrl === '[object Object]') {
        throw new Error('No output from FLUX Depth Pro');
      }
    } else {
      // Fallback to SDXL for other models
      // Note: SDXL doesn't preserve structure as well as depth-based models
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
      .from('zestio_users')
      .select('credits, used_credits')
      .eq('id', user.id)
      .single();

    if (userData) {
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
