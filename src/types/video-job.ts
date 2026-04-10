// Video Job Types

// Platform types for property listing URLs
export type VideoPlatform = 'zillow' | 'immobilienscout24' | 'redfin' | 'rightmove' | 'other';

// Video job status - matches backend pipeline stages
export type VideoJobStatus = 
  | 'queued'
  | 'scraping'
  | 'renovating'
  | 'animating'
  | 'stitching'
  | 'done'
  | 'failed';

// Pipeline stage for progress indicator
export type PipelineStage = 'scrape' | 'enhance' | 'generate' | 'complete';

// Stage status for progress tracking
export type StageStatus = 'pending' | 'active' | 'complete' | 'error';

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

// Video Job interface - matches Supabase table
export interface VideoJob {
  id: string;
  user_id: string;
  listing_url: string;
  platform: VideoPlatform;
  renovation_style: RenovationStyle;
  music_genre: MusicGenre;
  status: VideoJobStatus;
  credits_used: number;
  output_video_url?: string;
  thumbnail_url?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  completed_at?: string;
}

// Platform display configuration
export const PLATFORM_CONFIG: Record<VideoPlatform, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
}> = {
  zillow: {
    label: 'Zillow',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  immobilienscout24: {
    label: 'ImmobilienScout24',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
  redfin: {
    label: 'Redfin',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
  },
  rightmove: {
    label: 'Rightmove',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  other: {
    label: 'Other',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
  },
};

// Video job status display configuration
export const VIDEO_STATUS_CONFIG: Record<VideoJobStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  queued: {
    label: 'Queued',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    icon: 'schedule',
  },
  scraping: {
    label: 'Scraping',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'downloading',
  },
  renovating: {
    label: 'Enhancing',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: 'auto_fix_high',
  },
  animating: {
    label: 'Generating',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'movie_creation',
  },
  stitching: {
    label: 'Finalizing',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    icon: 'video_settings',
  },
  done: {
    label: 'Complete',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'check_circle',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: 'error',
  },
};

// Pipeline stage configuration for progress indicator
export const PIPELINE_STAGES: Array<{
  id: PipelineStage;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    id: 'scrape',
    label: 'Scrape',
    icon: 'downloading',
    description: 'Extracting listing photos',
  },
  {
    id: 'enhance',
    label: 'Enhance',
    icon: 'auto_fix_high',
    description: 'AI virtual renovation',
  },
  {
    id: 'generate',
    label: 'Generate',
    icon: 'movie_creation',
    description: 'Creating video clips',
  },
  {
    id: 'complete',
    label: 'Complete',
    icon: 'check_circle',
    description: 'Final video assembly',
  },
];

// Map backend status to pipeline stage
export function statusToStage(status: VideoJobStatus): { 
  stage: PipelineStage; 
  stageStatus: StageStatus 
} {
  switch (status) {
    case 'queued':
      return { stage: 'scrape', stageStatus: 'pending' };
    case 'scraping':
      return { stage: 'scrape', stageStatus: 'active' };
    case 'renovating':
      return { stage: 'enhance', stageStatus: 'active' };
    case 'animating':
      return { stage: 'generate', stageStatus: 'active' };
    case 'stitching':
      return { stage: 'complete', stageStatus: 'active' };
    case 'done':
      return { stage: 'complete', stageStatus: 'complete' };
    case 'failed':
      return { stage: 'complete', stageStatus: 'error' };
    default:
      return { stage: 'scrape', stageStatus: 'pending' };
  }
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
