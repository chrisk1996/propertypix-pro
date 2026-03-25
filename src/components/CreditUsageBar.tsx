'use client';

import { Skeleton } from './LoadingSkeleton';

interface CreditUsageBreakdown {
  auto: number;
  sky: number;
  staging: number;
  object_removal: number;
}

interface CreditUsageProps {
  used: number;
  total: number | string;
  plan: string;
  breakdown?: CreditUsageBreakdown;
  loading?: boolean;
}

const featureLabels: Record<keyof CreditUsageBreakdown, { label: string; color: string }> = {
  auto: { label: 'Auto Enhance', color: 'bg-indigo-500' },
  sky: { label: 'Sky Replace', color: 'bg-amber-500' },
  staging: { label: 'Virtual Staging', color: 'bg-teal-500' },
  object_removal: { label: 'Object Removal', color: 'bg-rose-500' },
};

export function CreditUsageBar({
  used,
  total,
  plan,
  breakdown,
  loading = false,
}: CreditUsageProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Skeleton className="w-32 h-6 mb-4" />
        <Skeleton className="w-full h-3 rounded-full mb-3" />
        <div className="flex justify-between mb-4">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6" />
          ))}
        </div>
      </div>
    );
  }

  const isUnlimited = plan === 'enterprise' || total === '∞';
  const displayTotal = isUnlimited ? '∞' : total;
  const percentage = isUnlimited ? 0 : (used / Number(total)) * 100;

  // Default breakdown if not provided
  const usageBreakdown = breakdown || {
    auto: Math.round(used * 0.5),
    sky: Math.round(used * 0.25),
    staging: Math.round(used * 0.15),
    object_removal: Math.round(used * 0.1),
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Usage This Month</h3>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          {!isUnlimited && (
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          )}
          {isUnlimited && (
            <div className="h-full bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 animate-pulse" />
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="flex justify-between text-sm mb-4">
        <span className="text-gray-600">{used} used</span>
        <span className="font-medium text-gray-900">
          {isUnlimited ? 'Unlimited' : `${Number(total) - used} remaining`}
        </span>
      </div>

      {/* Breakdown by Feature */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Breakdown by Feature</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(featureLabels) as [keyof CreditUsageBreakdown, { label: string; color: string }][]).map(
            ([key, { label, color }]) => (
              <div
                key={key}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
              >
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-sm text-gray-600 flex-1">{label}</span>
                <span className="text-sm font-medium text-gray-900">{usageBreakdown[key] || 0}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Warning for low credits */}
      {!isUnlimited && percentage >= 80 && percentage < 100 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ You've used {Math.round(percentage)}% of your credits. Consider upgrading your plan.
          </p>
        </div>
      )}

      {!isUnlimited && percentage >= 100 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ❌ You've reached your monthly limit. Upgrade to continue enhancing photos.
          </p>
        </div>
      )}
    </div>
  );
}
