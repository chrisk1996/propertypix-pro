import { AppLayout } from '@/components/layout';
import { Metadata } from 'next';
import Link from 'next/link';
import ProjectsGrid from './ProjectsGrid';

export const metadata: Metadata = {
  title: 'Zestio | Floor Plan Projects',
  description: 'Manage your 3D floor plan projects',
};

export default function FloorplanPage() {
  return (
    <AppLayout title="3D Floor Plans">
      <ProjectsGrid />
    </AppLayout>
  );
}
