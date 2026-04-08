import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PropertyPix | Floor Plan Projects',
  description: 'Create stunning 3D floor plans for your real estate listings',
};

export default function FloorplanPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-outline-variant/20">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-on-primary font-bold text-sm">PP</span>
            </div>
            <span className="font-serif text-xl text-primary">PropertyPix</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Header Section */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <h1 className="font-serif text-5xl text-primary tracking-tight">Floor Plans</h1>
            <p className="text-on-surface-variant text-sm uppercase tracking-widest mt-2">
              Manage your 3D floor plan projects
            </p>
          </div>
          <Link
            href="/floorplan-v2"
            className="flex items-center gap-3 px-5 py-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            <span className="text-xs uppercase tracking-widest font-bold">Start New Design</span>
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {/* Placeholder projects - these would be fetched from Supabase */}
          {[
            { name: 'Mercer Residence', status: 'Rendered', modified: '2 hours ago' },
            { name: 'Skyline Penthouse', status: 'Draft', modified: 'Yesterday' },
            { name: 'Belvedere Estate', status: 'Published', modified: 'Oct 24, 2023' },
            { name: 'Coastal Villa', status: 'Rendered', modified: 'Oct 20, 2023' },
            { name: 'Oak Ridge Loft', status: 'Draft', modified: 'Oct 15, 2023' },
          ].map((project, i) => (
            <div key={i} className="group flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-container-low mb-6">
                {/* Project thumbnail */}
                <div className="w-full h-full bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">
                    floor_plan
                  </span>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 bg-surface/70 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    project.status === 'Published' ? 'text-secondary' : 
                    project.status === 'Rendered' ? 'text-secondary' : 'text-primary'
                  }`}>
                    {project.status}
                  </span>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <Link
                    href="/floorplan-v2"
                    className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </Link>
                  <Link
                    href="/floorplan-v2"
                    className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </Link>
                </div>
              </div>

              {/* Project Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-xl text-primary mb-1">{project.name}</h3>
                  <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">
                    Modified {project.modified}
                  </p>
                </div>
                <button className="material-symbols-outlined text-slate-300 hover:text-error transition-colors">
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Meta */}
        <div className="mt-24 pt-8 border-t border-outline-variant/10 flex justify-between items-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-bold">
            Displaying 5 of 5 Projects
          </p>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/20 hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/20 bg-primary text-on-primary font-bold text-xs">
              1
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant/20 hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </main>

      {/* FAB */}
      <Link
        href="/floorplan-v2"
        className="fixed bottom-10 right-10 w-16 h-16 bg-secondary text-on-secondary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </Link>
    </div>
  );
}
