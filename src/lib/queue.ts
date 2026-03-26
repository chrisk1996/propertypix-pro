// BullMQ Queue Configuration for Background Jobs
// Handles syndication, video processing, and other long-running tasks
// NOTE: Redis connection is lazy-loaded to avoid build-time errors

import { Queue } from 'bullmq';

// Queue names
export const QUEUES = {
  SYNDICATION: 'syndication',
  VIDEO: 'video-processing',
  STAGING: 'virtual-staging',
} as const;

// Job types
export interface SyndicationJob {
  listingId: string;
  agentId: string;
  portalName: string;
  syndicationLogId: string;
  retryCount?: number;
}

export interface VideoJob {
  jobId: string;
  userId: string;
  imageUrls: string[];
  style: string;
}

export interface StagingJob {
  jobId: string;
  userId: string;
  imageUrl: string;
  roomType: string;
  style: string;
}

// Lazy-load Redis connection to avoid build errors
async function getRedisConnection() {
  const { default: Redis } = await import('ioredis');
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    lazyConnect: true, // Don't connect immediately
  });
}

// Queue cache
let _syndicationQueue: Queue<SyndicationJob> | null = null;
let _videoQueue: Queue<VideoJob> | null = null;
let _stagingQueue: Queue<StagingJob> | null = null;

// Get or create syndication queue
async function getSyndicationQueue(): Promise<Queue<SyndicationJob>> {
  if (!_syndicationQueue) {
    _syndicationQueue = new Queue<SyndicationJob>(QUEUES.SYNDICATION, {
      connection: await getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return _syndicationQueue;
}

// Get or create video queue
async function getVideoQueue(): Promise<Queue<VideoJob>> {
  if (!_videoQueue) {
    _videoQueue = new Queue<VideoJob>(QUEUES.VIDEO, {
      connection: await getRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: 50,
        removeOnFail: 25,
      },
    });
  }
  return _videoQueue;
}

// Get or create staging queue
async function getStagingQueue(): Promise<Queue<StagingJob>> {
  if (!_stagingQueue) {
    _stagingQueue = new Queue<StagingJob>(QUEUES.STAGING, {
      connection: await getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return _stagingQueue;
}

// Helper to add syndication job
export async function queueSyndication(job: SyndicationJob) {
  const queue = await getSyndicationQueue();
  return queue.add(`syndicate-${job.portalName}-${job.listingId}`, job, {
    jobId: `synd-${job.syndicationLogId}`,
  });
}

// Helper to add video job
export async function queueVideoProcessing(job: VideoJob) {
  const queue = await getVideoQueue();
  return queue.add(`video-${job.jobId}`, job, {
    jobId: job.jobId,
  });
}

// Helper to add staging job
export async function queueVirtualStaging(job: StagingJob) {
  const queue = await getStagingQueue();
  return queue.add(`staging-${job.jobId}`, job, {
    jobId: job.jobId,
  });
}

// Export queue getters for worker access
export { getSyndicationQueue, getVideoQueue, getStagingQueue };
