'use client';

import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-16 h-4" />
      </div>
      <Skeleton className="w-20 h-8 mb-2" />
      <Skeleton className="w-24 h-4" />
    </div>
  );
}

export function EnhancementCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <Skeleton className="w-full aspect-video" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="w-24 h-5" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="flex gap-2 mt-3">
          <Skeleton className="flex-1 h-9 rounded-lg" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function QuickActionSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 rounded-xl">
      <Skeleton className="w-12 h-12 rounded-full" />
      <Skeleton className="w-24 h-5" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="w-full h-4" />
        </td>
      ))}
    </tr>
  );
}

export function PricingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-20 h-6" />
      </div>
      <Skeleton className="w-16 h-10 mb-2" />
      <Skeleton className="w-24 h-4 mb-6" />
      <div className="space-y-3 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-5 h-5 flex-shrink-0" />
            <Skeleton className="flex-1 h-4" />
          </div>
        ))}
      </div>
      <Skeleton className="w-full h-12 rounded-lg mt-auto" />
    </div>
  );
}

export function CreditUsageSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <Skeleton className="w-32 h-6 mb-4" />
      <Skeleton className="w-full h-4 rounded-full mb-4" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="w-16 h-8 mb-1" />
          <Skeleton className="w-20 h-4" />
        </div>
        <div>
          <Skeleton className="w-16 h-8 mb-1" />
          <Skeleton className="w-20 h-4" />
        </div>
      </div>
    </div>
  );
}
