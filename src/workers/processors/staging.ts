// Virtual Staging Processor
// Handles AI-powered virtual furniture placement

import { SupabaseClient } from '@supabase/supabase-js';
import { StagingJob } from '../../lib/queue';
import Replicate from 'replicate';

export async function processStaging(
  job: StagingJob,
  supabase: SupabaseClient
): Promise<{ success: boolean; stagedImageUrl?: string; error?: string }> {
  const { jobId, userId, imageUrl, roomType, style } = job;

  try {
    // Update job status
    await supabase
      .from('zestio_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId);

    // Initialize Replicate
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    console.log(`[Staging] Processing job ${jobId}: roomType=${roomType}, style=${style}`);

    // Use virtual staging model
    // Popular options: controlnet, interior-ai, or custom fine-tuned models
    const prompt = generateStagingPrompt(roomType, style);

    const output = await replicate.run(
      'stability-ai/stable-diffusion-img2img:15a3689d6c4d6c4d6c4d6c4d6c4d6c4d6c4d6c4d', // Placeholder
      {
        input: {
          image: imageUrl,
          prompt: prompt,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 30,
          strength: 0.75, // How much to transform the image
        },
      }
    );

    // Alternative: Use specialized virtual staging models
    // - interior-ai/model-name for room-specific staging
    // - controlnet for precise furniture placement
    // - segment-anything + inpainting for selective staging

    const stagedImageUrl = Array.isArray(output) ? output[0] : output;

    // Update job with result
    await supabase
      .from('zestio_jobs')
      .update({
        status: 'completed',
        output_url: stagedImageUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Deduct credits (virtual staging costs 2 credits)
    await deductCredits(supabase, userId, 2);

    console.log(`[Staging] Job ${jobId} completed successfully`);

    return { success: true, stagedImageUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('zestio_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    throw error;
  }
}

function generateStagingPrompt(roomType: string, style: string): string {
  const styleDescriptions: Record<string, string> = {
    modern: 'modern minimalist furniture, clean lines, neutral colors',
    scandinavian: 'Scandinavian style, light wood, cozy textiles, white and beige',
    industrial: 'industrial style, metal accents, leather furniture, exposed brick',
    bohemian: 'bohemian style, colorful textiles, plants, eclectic decor',
    luxury: 'luxury high-end furniture, elegant materials, sophisticated design',
    contemporary: 'contemporary style, trendy furniture, bold accents',
  };

  const roomDescriptions: Record<string, string> = {
    living_room: 'living room with sofa, coffee table, TV unit',
    bedroom: 'bedroom with bed, nightstands, wardrobe',
    kitchen: 'kitchen with modern appliances, dining area',
    bathroom: 'bathroom with vanity, mirror, accessories',
    dining_room: 'dining room with table, chairs, sideboard',
    office: 'home office with desk, chair, shelving',
  };

  const styleDesc = styleDescriptions[style] || styleDescriptions.modern;
  const roomDesc = roomDescriptions[roomType] || roomDescriptions.living_room;

  return `${styleDesc}, ${roomDesc}, professional real estate photography, bright and inviting, 4k, photorealistic`;
}

async function deductCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number
): Promise<void> {
  const { data: user } = await supabase
    .from('zestio_users')
    .select('credits_remaining, credits_used')
    .eq('id', userId)
    .single();

  if (user && user.credits_remaining >= amount) {
    await supabase
      .from('zestio_users')
      .update({
        credits_remaining: user.credits_remaining - amount,
        credits_used: user.credits_used + amount,
      })
      .eq('id', userId);
  }
}
