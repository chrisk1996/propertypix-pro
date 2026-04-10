'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { VideoJob, VideoJobStatus } from '@/types/video-job';

interface UseVideoJobOptions {
  jobId?: string;
  autoSubscribe?: boolean;
}

interface UseVideoJobReturn {
  job: VideoJob | null;
  isLoading: boolean;
  error: string | null;
  status: VideoJobStatus | null;
  progress: number;
  subscribe: (id: string) => void;
  unsubscribe: () => void;
  refetch: () => Promise<void>;
}

// Calculate progress percentage based on status
function calculateProgress(status: VideoJobStatus): number {
  const progressMap: Record<VideoJobStatus, number> = {
    queued: 0,
    scraping: 20,
    renovating: 45,
    animating: 70,
    stitching: 90,
    done: 100,
    failed: 0,
  };
  return progressMap[status] ?? 0;
}

export function useVideoJob(options: UseVideoJobOptions = {}): UseVideoJobReturn {
  const { jobId, autoSubscribe = true } = options;
  
  const [job, setJob] = useState<VideoJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const supabase = createClient();
  
  // Calculate derived values
  const status = job?.status ?? null;
  const progress = status ? calculateProgress(status) : 0;
  
  // Fetch job by ID
  const fetchJob = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('video_jobs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      setJob(data as VideoJob);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch job';
      setError(message);
      console.error('[useVideoJob] Fetch error:', message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);
  
  // Subscribe to realtime updates
  const subscribe = useCallback((id: string) => {
    // Unsubscribe from existing channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    
    // Create new channel subscription
    const channel = supabase
      .channel(`video-job-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_jobs',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('[useVideoJob] Realtime update:', payload);
          setJob(payload.new as VideoJob);
          
          // Auto-unsubscribe when job is done or failed
          if (payload.new.status === 'done' || payload.new.status === 'failed') {
            channel.unsubscribe();
          }
        }
      )
      .subscribe((status) => {
        console.log('[useVideoJob] Subscription status:', status);
      });
    
    channelRef.current = channel;
  }, [supabase]);
  
  // Unsubscribe from realtime
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, []);
  
  // Refetch job data
  const refetch = useCallback(async () => {
    if (jobId) {
      await fetchJob(jobId);
    }
  }, [jobId, fetchJob]);
  
  // Initial fetch and subscribe
  useEffect(() => {
    if (jobId) {
      fetchJob(jobId);
      if (autoSubscribe) {
        subscribe(jobId);
      }
    }
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [jobId, autoSubscribe, fetchJob, subscribe, unsubscribe]);
  
  return {
    job,
    isLoading,
    error,
    status,
    progress,
    subscribe,
    unsubscribe,
    refetch,
  };
}

// Hook for listing user's video jobs
interface UseVideoJobsOptions {
  limit?: number;
  status?: VideoJobStatus;
}

interface UseVideoJobsReturn {
  jobs: VideoJob[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVideoJobs(options: UseVideoJobsOptions = {}): UseVideoJobsReturn {
  const { limit = 10, status } = options;
  
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }
      
      let query = supabase
        .from('video_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      setJobs((data as VideoJob[]) ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch jobs';
      setError(message);
      console.error('[useVideoJobs] Fetch error:', message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, limit, status]);
  
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  
  return {
    jobs,
    isLoading,
    error,
    refetch: fetchJobs,
  };
}
