'use client';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  onSave?: () => void;
  onExport?: () => void;
  hideTopNav?: boolean;
}

import SideNavBar from './SideNavBar';
import TopNavBar from './TopNavBar';

export default function AppLayout({ children, title, onSave, onExport, hideTopNav }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-['Inter'] text-slate-900">
      <SideNavBar />
      <div className="ml-64">
        {!hideTopNav && <TopNavBar title={title} onSave={onSave} onExport={onExport} />}
        <main className={hideTopNav ? '' : 'pt-20'}>
          {children}
        </main>
      </div>
    </div>
  );
}
