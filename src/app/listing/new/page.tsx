'use client';

import { AppLayout } from '@/components/layout';
import { ListingWizard } from '@/components/listing-wizard/ListingWizard';

export default function NewListingPage() {
  return (
    <AppLayout hideTopNav>
      <ListingWizard />
    </AppLayout>
  );
}
