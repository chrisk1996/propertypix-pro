// Background Worker Entry Point
// Run with: npm run worker
// This processes jobs from BullMQ queues

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';

import { QUEUES, SyndicationJob, VideoJob, StagingJob } from '../lib/queue';
import { VIDEO_PIPELINE_QUEUE, VideoPipelineJob } from '../lib/video-pipeline-queue';
import { processSyndication } from './processors/syndication';
import { processVideo } from './processors/video';
import { processStaging } from './processors/staging';
import { processVideoPipeline } from './processors/video-pipeline';

// Redis connection for workers
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Supabase client for workers (service role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Syndication Worker
const syndicationWorker = new Worker<SyndicationJob>(
  QUEUES.SYNDICATION,
  async (job: Job<SyndicationJob>) => {
    console.log(`[Syndication] Processing job ${job.id}:`, job.data);
    return processSyndication(job.data, supabase);
  },
  {
    connection: redisConnection,
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 60000, // 10 jobs per minute
    },
  }
);

// Video Processing Worker
const videoWorker = new Worker<VideoJob>(
  QUEUES.VIDEO,
  async (job: Job<VideoJob>) => {
    console.log(`[Video] Processing job ${job.id}:`, job.data);
    return processVideo(job.data, supabase);
  },
  {
    connection: redisConnection,
    concurrency: 1, // Videos are resource-intensive
    limiter: {
      max: 5,
      duration: 60000, // 5 videos per minute
    },
  }
);

// Virtual Staging Worker
const stagingWorker = new Worker<StagingJob>(
  QUEUES.STAGING,
  async (job: Job<StagingJob>) => {
    console.log(`[Staging] Processing job ${job.id}:`, job.data);
    return processStaging(job.data, supabase);
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 20,
      duration: 60000, // 20 stagings per minute
    },
  }
);

// Video Pipeline Worker
// Handles the 4-stage property renovation video generation pipeline
const videoPipelineWorker = new Worker<VideoPipelineJob>(
  VIDEO_PIPELINE_QUEUE,
  async (job: Job<VideoPipelineJob>) => {
    console.log(`[VideoPipeline] Processing job ${job.id}:`, job.data);
    return processVideoPipeline(job);
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process 2 video pipelines concurrently
    limiter: {
      max: 5,
      duration: 60000, // 5 jobs per minute
    },
  }
);

// Worker event handlers
function setupWorkerHandlers(worker: Worker, name: string) {
  worker.on('completed', (job: Job) => {
    console.log(`[${name}] Job ${job.id} completed successfully`);
  });
  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[${name}] Job ${job?.id} failed:`, err.message);
  });
  worker.on('error', (err: Error) => {
    console.error(`[${name}] Worker error:`, err);
  });
}

setupWorkerHandlers(syndicationWorker, 'Syndication');
setupWorkerHandlers(videoWorker, 'Video');
setupWorkerHandlers(stagingWorker, 'Staging');
setupWorkerHandlers(videoPipelineWorker, 'VideoPipeline');

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down workers...');
  await Promise.all([
    syndicationWorker.close(),
    videoWorker.close(),
    stagingWorker.close(),
    videoPipelineWorker.close(),
  ]);
  await redisConnection.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('🚀 Workers started and listening for jobs...');
console.log(' - Syndication: concurrency=3');
console.log(' - Video: concurrency=1');
console.log(' - Staging: concurrency=5');
console.log(' - VideoPipeline: concurrency=2');
