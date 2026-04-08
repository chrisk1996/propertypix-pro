import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PropertyPix | Floor Plan Projects',
  description: 'Manage your 3D floor plan projects',
};

export default function FloorplanPage() {
  const projects = [
    { id: '1', name: 'Mercer Residence', status: 'Rendered', modified: '2 hours ago' },
    { id: '2', name: 'Skyline Penthouse', status: 'Draft', modified: 'Yesterday' },
    { id: '3', name: 'Belvedere Estate', status: 'Published', modified: 'Oct 24, 2023' },
    { id: '4', name: 'Coastal Villa', status: 'Rendered', modified: 'Oct 20, 2023' },
    { id: '5', name: 'Oak Ridge Loft', status: 'Draft', modified: 'Oct 15, 2023' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-900 flex flex-col py-8 border-r border-slate-200/10 z-50">
        <div className="px-6 mb-10">
          <Link href="/" className="block">
            <h1 className="font-serif text-xl tracking-tight text-slate-800 dark:text-slate-100">PropertyPix</h1>
            <p className="font-sans uppercase tracking-widest text-[11px] text-slate-500 mt-1">Editorial Dashboard</p>
          </Link>
        </div>
        <nav className="flex-1 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 px-6 py-3 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-sans uppercase tracking-widest text-[11px]">Dashboard</span>
          </Link>
          <Link
            href="/enhance"
            className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 px-6 py-3 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
          >
            <span className="material-symbols-outlined">auto_fix_high</span>
            <span className="font-sans uppercase tracking-widest text-[11px]">Image Enhancer</span>
          </Link>
          <Link
            href="/staging"
            className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 px-6 py-3 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
          >
            <span className="material-symbols-outlined">chair</span>
            <span className="font-sans uppercase tracking-widest text-[11px]">Virtual Staging</span>
          </Link>
          <Link
            href="/video"
            className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 px-6 py-3 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
          >
            <span className="material-symbols-outlined">movie_filter</span>
            <span className="font-sans uppercase tracking-widest text-[11px]">Video Creator</span>
          </Link>
          {/* Active State: 3D Floor Plans */}
          <Link
            href="/floorplan"
            className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold bg-slate-100 dark:bg-slate-800 border-r-4 border-emerald-700 px-6 py-3"
          >
            <span className="material-symbols-outlined">layers</span>
            <span className="font-sans uppercase tracking-widest text-[11px]">3D Floor Plans</span>
          </Link>
          <Link
            href="/listing"
            className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 px-6 py-3 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
          >
            <span className="material-symbols-outlined">edit_note</span>
            <span className="font-sans uppercase tracking-widest text-[11px]">Listing Builder</span>
          </Link>
        </nav>
        <div className="px-6 mt-auto">
          <Link
            href="/pricing"
            className="block w-full py-4 bg-primary text-on-primary text-center text-[11px] font-sans uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity"
          >
            Upgrade Plan
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* TopNavBar */}
        <header className="w-full sticky top-0 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-xl flex justify-between items-center px-12 py-6 z-40 border-b border-slate-200/20">
          <div className="flex items-center gap-8 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
              <input
                className="w-full bg-surface-container-low border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-secondary/30 transition-all"
                placeholder="Search projects..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="material-symbols-outlined text-slate-500 hover:text-primary transition-colors">notifications</button>
            <button className="material-symbols-outlined text-slate-500 hover:text-primary transition-colors">settings</button>
            <div className="h-10 w-10 rounded-full overflow-hidden border border-outline-variant/20 bg-primary flex items-center justify-center">
              <span className="text-on-primary font-medium">U</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="px-12 py-12 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div>
              <span className="font-sans uppercase tracking-widest text-[11px] text-secondary mb-2 block font-semibold">
                Project Management
              </span>
              <h2 className="font-serif text-5xl md:text-6xl text-primary tracking-tight">Floor Plan Projects</h2>
            </div>
            <Link
              href="/floorplan-v2"
              className="bg-primary text-on-primary px-8 py-4 rounded-lg flex items-center gap-3 hover:scale-[0.98] transition-transform duration-150"
            >
              <span className="material-symbols-outlined">add</span>
              <span className="font-sans uppercase tracking-widest text-xs font-bold">New Project</span>
            </Link>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-12 border-b border-outline-variant/10 pb-8">
            <button className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider">
              All Projects
            </button>
            <button className="px-5 py-2 rounded-full bg-surface-container-low text-slate-600 text-xs font-semibold uppercase tracking-wider hover:bg-surface-container-high transition-colors">
              Drafts
            </button>
            <button className="px-5 py-2 rounded-full bg-surface-container-low text-slate-600 text-xs font-semibold uppercase tracking-wider hover:bg-surface-container-high transition-colors">
              Rendered
            </button>
            <button className="px-5 py-2 rounded-full bg-surface-container-low text-slate-600 text-xs font-semibold uppercase tracking-wider hover:bg-surface-container-high transition-colors">
              Published
            </button>
            <div className="ml-auto flex items-center gap-2 text-slate-400">
              <span className="text-xs uppercase tracking-widest font-semibold mr-2">Sort by:</span>
              <button className="flex items-center gap-1 text-xs font-bold text-primary">
                Date Modified
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </button>
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Add New Project Card */}
            <Link
              href="/floorplan-v2"
              className="group relative aspect-[4/5] border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-secondary/50 hover:bg-surface-container-low transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">add_box</span>
              </div>
              <span className="font-sans uppercase tracking-widest text-xs font-bold text-primary">
                Start New Design
              </span>
            </Link>

            {/* Project Cards */}
            {projects.map((project) => (
              <div key={project.id} className="group flex flex-col">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-container-low mb-6">
                  {/* Project thumbnail placeholder */}
                  <div className="w-full h-full bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">floor_plan</span>
                  </div>

                  {/* Status Badge */}
                  <div className={`absolute top-4 right-4 backdrop-blur-md px-3 py-1.5 rounded-lg ${
                    project.status === 'Published' ? 'bg-secondary text-on-secondary shadow-lg' :
                    'bg-surface/70'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      project.status === 'Published' ? '' :
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
                    <h3 className="font-serif text-2xl text-primary mb-1">{project.name}</h3>
                    <p className="font-sans text-[11px] uppercase tracking-widest text-slate-400 font-medium">
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
              Displaying {projects.length} of {projects.length} Projects
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
