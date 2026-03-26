// BullMQ Queue Configuration for Background Jobs
// Handles syndication, video processing, and other long-running tasks

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

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

// Create queues
export const syndicationQueue = new Queue<SyndicationJob>(QUEUES.SYNDICATION, {
  connection: redisConnection,
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

export const videoQueue = new Queue<VideoJob>(QUEUES.VIDEO, {
  connection: redisConnection,
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

export const stagingQueue = new Queue<StagingJob>(QUEUES.STAGING, {
  connection: redisConnection,
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

// Helper to add syndication job
export async function queueSyndication(job: SyndicationJob): Promise<Job<SyndicationJob>> {
  return syndicationQueue.add(`syndicate-${job.portalName}-${job.listingId}`, job, {
    jobId: `synd-${job.syndicationLogId}`,
  });
}

// Helper to add video job
export async function queueVideoProcessing(job: VideoJob): Promise<Job<VideoJob>> {
  return videoQueue.add(`video-${job.jobId}`, job, {
    jobId: job.jobId,
  });
}

// Helper to add staging job
export async function queueVirtualStaging(job: StagingJob): Promise<Job<StagingJob>> {
  return stagingQueue.add(`staging-${job.jobId}`, job, {
    jobId: job.jobId,
  });
}

// Export Redis connection for workers
export { redisConnection };
