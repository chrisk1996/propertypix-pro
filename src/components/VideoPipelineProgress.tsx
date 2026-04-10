'use client';

import { cn } from '@/utils/cn';
import type { PipelineStage, StageStatus } from '@/types/video-job';
import { PIPELINE_STAGES } from '@/types/video-job';

interface VideoPipelineProgressProps {
  currentStage: PipelineStage;
  stageStatus: StageStatus;
  className?: string;
}

export function VideoPipelineProgress({
  currentStage,
  stageStatus,
  className,
}: VideoPipelineProgressProps) {
  // Determine which stages are complete
  const stageOrder: PipelineStage[] = ['scrape', 'enhance', 'generate', 'complete'];
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
                  {stage.description}
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
                <p className="text-xs text-slate-500 truncate">{stage.description}</p>
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
