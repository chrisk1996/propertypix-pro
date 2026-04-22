'use client';

import { AppLayout } from '@/components/layout';
import { ImageStudio } from '@/components/media/ImageStudio';

export default function StudioPage() {
  return (
    <AppLayout title="Image Studio">
      <div className="h-[calc(100vh-4rem)] p-4">
        <ImageStudio className="h-full" />
      </div>
    </AppLayout>
  );
}
