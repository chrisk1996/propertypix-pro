'use client';

import { Suspense } from 'react';
import { ListingWizard } from '@/components/listing-builder/ListingWizard';
import { Loader2 } from 'lucide-react';

function NewListingContent() {
  return <ListingWizard />;
}

export default function NewListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <NewListingContent />
    </Suspense>
  );
}
