import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

// Room type prompts for virtual staging
const ROOM_PROMPTS: Record<string, string> = {
  living: 'furnished living room with comfortable sofa, coffee table, rug, lamps, wall art, plants, curtains',
  bedroom: 'furnished bedroom with bed, nightstands, lamps, dresser, rug, curtains, pillows',
  kitchen: 'furnished kitchen with dining table, chairs, countertop decorations, pendant lights',
  bathroom: 'furnished bathroom with towels, plants, soap dispensers, mirror, rug',
  dining: 'furnished dining room with dining table, chairs, sideboard, centerpiece, pendant light',
  office: 'furnished home office with desk, office chair, bookshelf, desk lamp, computer, rug',
  basement: 'furnished basement with entertainment center, sofa, game table, rug, lighting',
  patio: 'furnished patio with outdoor furniture, plants, string lights, rug, cushions',
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
};

// Generate depth map using Marigold
async function generateDepthMap(imageUrl: string): Promise<string> {
  const result = await replicate.run(
    "adirik/marigold:1a363593bc4882684fc58042d19db5e13a810e44e02f8d4c32afd1eb30464818",
    {
      input: {
        image: imageUrl,
      },
    }
  );

  console.log('Marigold result:', JSON.stringify(result, null, 2));

  // Marigold returns an array of URLs [grayscale, spectral]
  if (Array.isArray(result) && result.length > 0) {
    const first = result[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.url === 'function') {
      const url = first.url();
      return typeof url === 'string' ? url : url.toString();
    }
  }

  // Try common property names
  const r = result as any;
  if (r.url) return r.url;
  if (r.output) return typeof r.output === 'string' ? r.output : r.output.url;
  if (r.image) return r.image;
  if (typeof result === 'string') return result;

  throw new Error('Failed to generate depth map - no valid URL returned. Result: ' + JSON.stringify(result));
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has credits
    const { data: userData } = await supabase
      .from('zestio_users')
      .select('credits, used_credits, subscription_tier')
      .eq('id', user.id)
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

    let resultUrl: string | null = null;
    let creditsUsed = 1;

    try {
      if (model === 'decor8') {
        // Use Decor8 API for virtual staging
        creditsUsed = 2;

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
        resultUrl = decor8Data?.info?.images?.[0]?.url;
        if (!resultUrl) {
          throw new Error('No output from Decor8 API');
        }
      } else if (model === 'flux-depth') {
        // FLUX Depth Pro workflow: depth map + FLUX
        creditsUsed = 2;
        
        const roomPrompt = ROOM_PROMPTS[roomType] || ROOM_PROMPTS.living;
        const stylePrompt = STYLE_PROMPTS[furnitureStyle] || STYLE_PROMPTS.modern;
        const prompt = `${roomPrompt}, ${stylePrompt}, professional real estate photography, well-lit, high quality`;
        
        console.log('FLUX Depth Pro workflow:', { roomType, furnitureStyle });
        
        // Step 1: Generate depth map
        console.log('Step 1: Generating depth map...');
        const depthMapUrl = await generateDepthMap(image);
        console.log('Depth map generated:', depthMapUrl);
        
        // Step 2: Use depth map with FLUX Depth Pro
        console.log('Step 2: Running FLUX Depth Pro...');
        const result = await replicate.run(
          "black-forest-labs/flux-depth-pro",
          {
            input: {
              control_image: depthMapUrl,
              prompt: prompt,
              num_inference_steps: 30,
              guidance_scale: 2.5,
              output_format: 'jpg',
            },
          }
        );
        
        if (Array.isArray(result) && result.length > 0) {
          const first = result[0];
          resultUrl = first && typeof first.url === 'function' ? first.url() : String(first);
        } else if (typeof result === 'string') {
          resultUrl = result;
        } else {
          resultUrl = String(result);
        }
        
        if (!resultUrl || resultUrl === '[object Object]') {
          throw new Error('No output from FLUX Depth Pro');
        }
      } else if (model === 'interior-design') {
        // Use adirik/interior-design - ControlNet-based virtual staging
        creditsUsed = 2;
        
        const roomPrompt = ROOM_PROMPTS[roomType] || ROOM_PROMPTS.living;
        const stylePrompt = STYLE_PROMPTS[furnitureStyle] || STYLE_PROMPTS.modern;
        const prompt = `${roomPrompt}, ${stylePrompt}, professional real estate photography, well-lit, high quality, interior design magazine`;
        const negativePrompt = 'empty room, unfurnished, blurry, low quality, distorted, watermark, text, dark, structural changes, different room';
        
        console.log('Interior design model:', { roomType, furnitureStyle });
        
        const result = await replicate.run(
          "adirik/interior-design",
          {
            input: {
              image: image,
              prompt: prompt,
              negative_prompt: negativePrompt,
              num_inference_steps: 50,
              guidance_scale: 7.5,
              prompt_strength: 0.8,
            },
          }
        );
        
        if (Array.isArray(result) && result.length > 0) {
          const first = result[0];
          resultUrl = first && typeof first.url === 'function' ? first.url() : String(first);
        } else if (typeof result === 'string') {
          resultUrl = result;
        } else {
          resultUrl = String(result);
        }
        
        if (!resultUrl || resultUrl === '[object Object]') {
          throw new Error('No output from interior design model');
        }
      } else {
        // Fallback to SDXL
        creditsUsed = 2;
        const roomPrompt = ROOM_PROMPTS[roomType] || ROOM_PROMPTS.living;
        const stylePrompt = STYLE_PROMPTS[furnitureStyle] || STYLE_PROMPTS.modern;
        const prompt = `${roomPrompt}, ${stylePrompt}, professional real estate photography, well-lit, high quality`;
        const negativePrompt = 'empty room, unfurnished, blurry, low quality, distorted, watermark, text, dark';

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
            used_credits: (userData.used_credits || 0) + creditsUsed,
          })
          .eq('id', user.id);
      }

      return NextResponse.json({
        success: true,
        resultUrl,
        creditsUsed,
        creditsRemaining: hasUnlimitedCredits ? -1 : Math.max(0, userData!.credits - creditsUsed),
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
