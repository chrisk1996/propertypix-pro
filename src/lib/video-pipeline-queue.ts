// Video Pipeline Queue Configuration
// Handles the 4-stage video renovation pipeline: scrape -> renovate -> animate -> stitch

import { Queue, DefaultJobOptions } from 'bullmq';

// Queue name for video pipeline
export const VIDEO_PIPELINE_QUEUE = 'video-pipeline';

// Video Pipeline Job Data
export interface VideoPipelineJob {
  jobId: string;
  userId: string;
  listingUrl: string;
  platform: string;
  renovationStyle: string;
  musicGenre: string;
}

// Pipeline stages
export type VideoPipelineStage = 'scrape' | 'renovate' | 'animate' | 'stitch';

// Platform types
export type VideoPlatform = 'zillow' | 'immobilienscout24' | 'redfin' | 'rightmove' | 'other';

// Supported renovation styles
export const RENOVATION_STYLES = [
  'modern',
  'luxury',
  'minimalist',
  'scandinavian',
  'industrial',
  'contemporary',
  'coastal',
  'midcentury',
] as const;

export type RenovationStyle = (typeof RENOVATION_STYLES)[number];

// Supported music genres
export const MUSIC_GENRES = [
  'cinematic',
  'uplifting',
  'ambient',
  'acoustic',
  'electronic',
  'jazz',
  'classical',
] as const;

export type MusicGenre = (typeof MUSIC_GENRES)[number];

// Apify actor IDs for different platforms
export const APIFY_ACTORS: Record<Exclude<VideoPlatform, 'other'>, string> = {
  immobilienscout24: 'epctex/immobilienscout24-scraper',
  zillow: 'maxcopell/zillow-scraper',
  redfin: 'epctex/redfin-scraper',
  rightmove: 'dtrungtin/rightmove-scraper',
};

// Lazy-load Redis connection to avoid build errors
async function getRedisConnection() {
  const { default: Redis } = await import('ioredis');
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
}

// Queue cache
let _videoPipelineQueue: Queue | null = null;

// Get or create video pipeline queue
export async function getVideoPipelineQueue(): Promise<Queue> {
  if (!_videoPipelineQueue) {
    const defaultJobOptions: DefaultJobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    };

    _videoPipelineQueue = new Queue(VIDEO_PIPELINE_QUEUE, {
      connection: await getRedisConnection(),
      defaultJobOptions,
    });
  }
  return _videoPipelineQueue;
}

// Helper to add video pipeline job
export async function queueVideoPipeline(job: VideoPipelineJob) {
  const queue = await getVideoPipelineQueue();
  return queue.add(`video-pipeline-${job.jobId}`, job, {
    jobId: job.jobId,
  });
}

// Detect platform from URL
export function detectPlatform(url: string): VideoPlatform {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('zillow.com')) return 'zillow';
  if (urlLower.includes('immobilienscout24.de')) return 'immobilienscout24';
  if (urlLower.includes('redfin.com')) return 'redfin';
  if (urlLower.includes('rightmove.co.uk')) return 'rightmove';
  return 'other';
}
