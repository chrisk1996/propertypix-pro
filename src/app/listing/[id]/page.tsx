'use client';

import { use } from 'react';
import { ListingWizard } from '@/components/listing-wizard/ListingWizard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditListingPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <div className="ml-64">
      <ListingWizard editId={id} />
    </div>
  );
}
