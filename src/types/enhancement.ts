export type EnhancementType = 'auto' | 'sky' | 'staging' | 'object_removal';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface UserUpload {
  id: string;
  user_id: string;
  original_url: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  created_at: string;
}

export interface EnhancementJob {
  id: string;
  upload_id: string;
  user_id: string;
  enhancement_type: EnhancementType;
  status: JobStatus;
  progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface EnhancementResult {
  id: string;
  job_id: string;
  result_url: string;
  result_type: 'image' | 'comparison';
  width?: number;
  height?: number;
  file_size: number;
  created_at: string;
}

export interface EnhancementWithResults {
  job: EnhancementJob;
  upload: UserUpload;
  results: EnhancementResult[];
}

export interface UploadResponse {
  success: boolean;
  upload?: UserUpload;
  error?: string;
}

export interface ProcessEnhancementRequest {
  uploadId: string;
  enhancementType: EnhancementType;
}

export interface ProcessEnhancementResponse {
  success: boolean;
  job?: EnhancementJob;
  error?: string;
}

export interface StatusResponse {
  success: boolean;
  job?: EnhancementJob;
  upload?: UserUpload;
  results?: EnhancementResult[];
  error?: string;
}

export const ENHANCEMENT_CONFIG = {
  auto: {
    label: 'Auto Enhance',
    description: 'AI-powered one-click enhancement',
    icon: 'Sparkles',
  },
  sky: {
    label: 'Sky Replace',
    description: 'Replace dull skies with beautiful ones',
    icon: 'Sun',
  },
  staging: {
    label: 'Virtual Staging',
    description: 'Add virtual furniture to empty rooms',
    icon: 'Home',
  },
  object_removal: {
    label: 'Object Removal',
    description: 'Remove unwanted objects from photos',
    icon: 'Eraser',
  },
} as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
