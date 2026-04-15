// Video Processing Processor
// Handles property video generation

import { SupabaseClient } from '@supabase/supabase-js';
import { VideoJob } from '../../lib/queue';
import Replicate from 'replicate';

export async function processVideo(
  job: VideoJob,
  supabase: SupabaseClient
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  const { jobId, userId, imageUrls, style } = job;

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

    // Use Stable Video Diffusion or similar model
    // Model: stability-ai/stable-video-diffusion or zeroshot
    console.log(`[Video] Generating video for job ${jobId} with ${imageUrls.length} images`);

    // For property videos, we typically want a smooth zoom/pan effect
    // Using Stable Video Diffusion for single-image animation
    const output = await replicate.run(
      'stability-ai/stable-video-diffusion:3f0507d0bd8d4c0b6f1e2f2f2f2f2f2f2f2f2f2f2', // Placeholder model
      {
        input: {
          input_image: imageUrls[0],
          fps: 24,
          motion_bucket_id: 127,
          cond_aug: 0.02,
          decoding_t: 14, // Number of frames
        },
      }
    );

    // In production, you'd use a more sophisticated video generation:
    // 1. Create shot sequence from multiple images
    // 2. Add transitions, text overlays
    // 3. Combine into final video with ffmpeg

    const videoUrl = Array.isArray(output) ? output[0] : output;

    // Update job with result
    await supabase
      .from('zestio_jobs')
      .update({
        status: 'completed',
        output_url: videoUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Deduct credits (video costs 3 credits)
    await deductCredits(supabase, userId, 3);

    console.log(`[Video] Job ${jobId} completed successfully`);

    return { success: true, videoUrl };
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
