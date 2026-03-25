'use client';

import { Suspense } from 'react';
import { ListingWizard } from '@/components/listing-builder/ListingWizard';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

function EditListingContent() {
  const params = useParams();
  const listingId = params.id as string;

  return <ListingWizard listingId={listingId} />;
}

export default function EditListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <EditListingContent />
    </Suspense>
  );
}
