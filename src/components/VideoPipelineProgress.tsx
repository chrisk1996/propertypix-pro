'use client';

import { cn } from '@/utils/cn';
import type { PipelineStage, StageStatus } from '@/types/video-job';
import { PIPELINE_STAGES } from '@/types/video-job';

interface VideoPipelineProgressProps {
  currentStage: PipelineStage;
  stageStatus: StageStatus;
  job?: Record<string, unknown> | null;
  className?: string;
}

// Get dynamic description based on job state
function getStageDescription(stageId: PipelineStage, job: Record<string, unknown> | null | undefined, isComplete: boolean): string {
  if (isComplete || !job) {
    // Use defaults when complete or no job data
    const defaults: Record<string, string> = {
      scrape: 'Extracting listing photos',
      sort: 'Auto-sorting images',
      twilight: 'Enhancing exterior shots',
      enhance: 'AI virtual renovation',
      generate: 'Creating video clips',
      complete: 'Final video assembly',
    };
    return defaults[stageId] || '';
  }

  const metadata = (job.metadata as Record<string, unknown>) || {};
  const status = job.status as string;

  if (stageId === 'scrape') {
    const count = Array.isArray(job.input_images) ? job.input_images.length : 0;
    if (status === 'scraping') return count > 0 ? `Found ${count} images` : 'Fetching listing...';
    return 'Extracting listing photos';
  }

  if (stageId === 'sort') {
    if (status === 'sorting') return 'Analyzing room types...';
    return 'Auto-sorting images';
  }

  if (stageId === 'twilight') {
    const twilightIdx = (metadata.twilightIndex as number) || 0;
    const sortLabels = (metadata.sortLabels as Array<{ label: string }>) || [];
    const exteriorLabels = ['exterior', 'facade', 'building', 'house', 'outside'];
    const exteriorCount = sortLabels.filter(l => exteriorLabels.includes(l.label)).length;
    if (status === 'twilighting' && exteriorCount > 0) return `Photo ${twilightIdx + 1} of ${exteriorCount}`;
    if (isComplete) return exteriorCount > 0 ? `${exteriorCount} photos enhanced` : 'No exterior photos';
    return 'Enhancing exterior shots';
  }

  if (stageId === 'enhance') {
    const idx = (metadata.renovateIndex as number) || 0;
    const total = Array.isArray(job.input_images) ? job.input_images.length : 0;
    if (status === 'renovating' && total > 0) return `Image ${Math.min(idx + 1, total)} of ${total}`;
    if (isComplete) return `${total} images enhanced`;
    return 'AI virtual renovation';
  }

  if (stageId === 'generate') {
    const idx = (metadata.animateIndex as number) || 0;
    const images = (metadata.renovatedImages as string[]) || [];
    if (status === 'animating' && images.length > 0) return `Clip ${Math.min(idx + 1, images.length)} of ${images.length}`;
    return 'Creating video clips';
  }

  return '';
}

export function VideoPipelineProgress({
  currentStage,
  stageStatus,
  job,
  className,
}: VideoPipelineProgressProps) {
  // Determine which stages are complete
  const stageOrder: PipelineStage[] = ['scrape', 'sort', 'twilight', 'enhance', 'generate', 'complete'];
  const currentIndex = stageOrder.indexOf(currentStage);
  
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop: horizontal layout */}
      <div className="hidden md:flex items-center justify-between">
        {PIPELINE_STAGES.map((stage, index) => {
          const isComplete = index < currentIndex;
          const isActive = index === currentIndex;
          const isPending = index > currentIndex;
          
          // Determine status for this stage
          let status: StageStatus = 'pending';
          if (isComplete) status = 'complete';
          else if (isActive) status = stageStatus;
          
          return (
            <div key={stage.id} className="flex-1 flex items-center">
              {/* Stage indicator */}
              <div className="flex flex-col items-center flex-1">
                {/* Icon circle */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                    status === 'pending' && 'bg-slate-100 border-slate-300',
                    status === 'active' && 'bg-purple-100 border-purple-500 animate-pulse',
                    status === 'complete' && 'bg-green-100 border-green-500',
                    status === 'error' && 'bg-red-100 border-red-500'
                  )}
                >
                  <span
                    className={cn(
                      'material-symbols-outlined text-2xl',
                      status === 'pending' && 'text-slate-400',
                      status === 'active' && 'text-purple-600',
                      status === 'complete' && 'text-green-600',
                      status === 'error' && 'text-red-600'
                    )}
                  >
                    {status === 'complete' ? 'check' : stage.icon}
                  </span>
                </div>
                
                {/* Label */}
                <span
                  className={cn(
                    'mt-2 font-semibold text-sm',
                    status === 'pending' && 'text-slate-500',
                    status === 'active' && 'text-purple-700',
                    status === 'complete' && 'text-green-700',
                    status === 'error' && 'text-red-700'
                  )}
                >
                  {stage.label}
                </span>
                
                {/* Description */}
                <span className="text-xs text-slate-500 text-center mt-0.5 max-w-[80px]">
                  {getStageDescription(stage.id, job, isComplete)}
                </span>
              </div>
              
              {/* Connector line */}
              {index < PIPELINE_STAGES.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 rounded transition-all',
                    index < currentIndex
                      ? 'bg-green-500'
                      : index === currentIndex
                      ? 'bg-gradient-to-r from-purple-500 to-slate-300'
                      : 'bg-slate-300'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Mobile: vertical layout */}
      <div className="md:hidden space-y-3">
        {PIPELINE_STAGES.map((stage, index) => {
          const isComplete = index < currentIndex;
          const isActive = index === currentIndex;
          const isPending = index > currentIndex;
          
          let status: StageStatus = 'pending';
          if (isComplete) status = 'complete';
          else if (isActive) status = stageStatus;
          
          return (
            <div key={stage.id} className="flex items-center gap-3">
              {/* Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0',
                  status === 'pending' && 'bg-slate-100 border-slate-300',
                  status === 'active' && 'bg-purple-100 border-purple-500 animate-pulse',
                  status === 'complete' && 'bg-green-100 border-green-500',
                  status === 'error' && 'bg-red-100 border-red-500'
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined text-xl',
                    status === 'pending' && 'text-slate-400',
                    status === 'active' && 'text-purple-600',
                    status === 'complete' && 'text-green-600',
                    status === 'error' && 'text-red-600'
                  )}
                >
                  {status === 'complete' ? 'check' : stage.icon}
                </span>
              </div>
              
              {/* Label & Description */}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'font-semibold text-sm',
                    status === 'pending' && 'text-slate-500',
                    status === 'active' && 'text-purple-700',
                    status === 'complete' && 'text-green-700',
                    status === 'error' && 'text-red-700'
                  )}
                >
                  {stage.label}
                </span>
                <p className="text-xs text-slate-500 truncate">{getStageDescription(stage.id, job, isComplete)}</p>
              </div>
              
              {/* Status indicator */}
              {status === 'active' && (
                <span className="text-xs text-purple-600 font-medium animate-pulse">
                  Processing...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
