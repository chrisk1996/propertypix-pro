'use client';

import dynamic from 'next/dynamic';

const FloorPlanEditor = dynamic(
  () => import('@/components/floorplan-v2/FloorPlanEditor').then((mod) => mod.FloorPlanEditor),
  { ssr: false }
);

export default function FloorPlanPage() {
  return (
    <div className="h-screen">
      <FloorPlanEditor />
    </div>
  );
}
