'use client';

import { cn } from '@/utils/cn';
import type { VideoJob, VideoJobStatus } from '@/types/video-job';
import { VIDEO_STATUS_CONFIG, PLATFORM_CONFIG } from '@/types/video-job';

interface VideoJobCardProps {
  job: VideoJob;
  onClick?: () => void;
  isActive?: boolean;
  showThumbnail?: boolean;
}

export function VideoJobCard({
  job,
  onClick,
  isActive,
  showThumbnail = true,
}: VideoJobCardProps) {
  const statusConfig = VIDEO_STATUS_CONFIG[job.status] || VIDEO_STATUS_CONFIG.queued;
  const platformConfig = PLATFORM_CONFIG[job.platform] || PLATFORM_CONFIG.other;
  
  if (!platformConfig) {
    return null;
  }
  
  // Format created date
  const createdDate = new Date(job.created_at);
  const formattedDate = createdDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-xl border transition-all text-left',
        'hover:shadow-md hover:border-slate-300',
        isActive && 'border-purple-500 bg-purple-50 shadow-sm',
        !isActive && 'border-slate-200 bg-white'
      )}
    >
      {/* Top row: thumbnail + info */}
      <div className="flex gap-3">
        {/* Thumbnail */}
        {showThumbnail && (
          <div className="w-20 h-14 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden relative">
            {job.thumbnail_url ? (
              <img
                src={job.thumbnail_url}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <span className="material-symbols-outlined text-slate-400 text-xl">
                  movie
                </span>
              </div>
            )}
            
            {/* Play icon overlay for completed */}
            {job.status === 'done' && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white text-2xl">play_circle</span>
              </div>
            )}
          </div>
        )}
        
        {/* Job info */}
        <div className="flex-1 min-w-0">
          {/* Platform badge */}
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              platformConfig.bgColor,
              platformConfig.color
            )}
          >
            {platformConfig.label}
          </span>
          
          {/* Date */}
          <p className="text-xs text-slate-500 mt-1">{formattedDate}</p>
          
          {/* Style (if available) */}
          {job.renovation_style && (
            <p className="text-xs text-slate-500 capitalize mt-0.5">
              {job.renovation_style} style
            </p>
          )}
        </div>
      </div>
      
      {/* Status badge */}
      <div className="mt-2 flex items-center justify-between">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            statusConfig.bgColor,
            statusConfig.color
          )}
        >
          <span className="material-symbols-outlined text-sm">{statusConfig.icon}</span>
          {statusConfig.label}
        </span>
        
        {/* View button for completed jobs */}
        {job.status === 'done' && onClick && (
          <span className="text-xs text-purple-600 font-medium">View →</span>
        )}
      </div>
    </button>
  );
}

// Loading skeleton
export function VideoJobCardSkeleton() {
  return (
    <div className="w-full p-3 rounded-xl border border-slate-200 bg-white animate-pulse">
      <div className="flex gap-3">
        <div className="w-20 h-14 rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="w-16 h-4 rounded bg-slate-200" />
          <div className="w-20 h-3 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

// Empty state
export function VideoJobCardEmpty() {
  return (
    <div className="w-full p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
      <span className="material-symbols-outlined text-3xl text-slate-400 mb-2 block">movie</span>
      <p className="text-sm text-slate-600">No video jobs yet</p>
      <p className="text-xs text-slate-500 mt-1">Create your first video to see it here</p>
    </div>
  );
}
