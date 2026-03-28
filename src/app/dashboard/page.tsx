'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout';

const quickActions = [
  {
    title: 'Image Enhancer',
    description: 'Studio-grade visual elevation. Perfect exposure, sky replacement, and color correction.',
    icon: 'auto_awesome',
    href: '/enhance',
    gradient: 'from-blue-600 to-cyan-500',
    featured: true,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  },
  {
    title: 'Virtual Staging',
    description: 'Turn empty properties into curated luxury homes.',
    icon: 'chair',
    href: '/staging',
    badge: '98% Accuracy',
  },
  {
    title: 'Video Creator',
    description: 'Generate cinematic drone-style tours from static imagery.',
    icon: 'movie_filter',
    href: '/video',
    tags: ['4K Cinematic', 'AI Voice'],
  },
  {
    title: '3D Floor Plans',
    description: 'Convert 2D blueprints into immersive 3D models.',
    icon: 'polyline',
    href: '/floorplan',
    featured: true,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0b?w=800&q=80',
  },
];

const recentProjects = [
  {
    title: 'Azure Horizon Estate',
    location: 'Beverly Hills, CA',
    time: '2h ago',
    status: 'processing',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63afd811?w=400&q=80',
  },
  {
    title: 'The Obsidian Penthouse',
    location: 'Manhattan, NY',
    time: '1d ago',
    status: 'completed',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80',
  },
  {
    title: 'Willow Creek Retreat',
    location: 'Aspen, CO',
    time: '3d ago',
    status: 'inactive',
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb78b95?w=400&q=80',
  },
];

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard" hideTopNav>
      <div className="px-12 py-8">
        {/* Hero Section */}
        <section className="mb-16">
          <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold text-slate-900 text-5xl tracking-tight mb-4 leading-tight">
            Elevating listings,<br/>
            <span className="text-blue-600">Pixel by pixel.</span>
          </h1>
          <p className="text-slate-600 max-w-xl text-lg">
            Professional AI toolset designed for modern real estate marketing. Transform your visuals into high-converting assets instantly.
          </p>
        </section>

        {/* Bento Grid: Quick Actions */}
        <section className="grid grid-cols-12 gap-6 mb-20">
          {/* Image Enhancer - Primary Card */}
          <div className="col-span-12 lg:col-span-7 group relative overflow-hidden bg-slate-900 rounded-2xl aspect-[16/7] p-10 flex flex-col justify-between shadow-xl transition-all hover:shadow-2xl">
            <div className="absolute inset-0 z-0 opacity-60">
              <img
                src={quickActions[0].image}
                alt="Luxury modern house"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="relative z-10">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600/20 text-white text-[10px] font-bold tracking-widest uppercase mb-4 backdrop-blur-md border border-white/20">
                SMART ENGINE V4
              </span>
              <h3 className="text-white font-['Plus_Jakarta_Sans'] text-4xl font-extrabold mb-3">Image Enhancer</h3>
              <p className="text-slate-300 text-sm max-w-sm leading-relaxed">
                Studio-grade visual elevation. Perfect exposure, sky replacement, and color correction in seconds.
              </p>
            </div>
            <div className="relative z-10 flex justify-end">
              <Link
                href="/enhance"
                className="group/btn flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-sm transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/30 active:scale-95"
              >
                Launch Studio
                <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Virtual Staging */}
          <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-white rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all border border-slate-200">
            <div className="flex justify-between items-start">
              <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-3xl">chair</span>
              </div>
              <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full">98% Accuracy</span>
            </div>
            <div className="mt-8">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-slate-900 mb-2">Virtual Staging</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Turn empty properties into curated luxury homes with our advanced neural furniture rendering.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link href="/staging" className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">
                Start New Session
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
            </div>
          </div>

          {/* Video Creator */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all border border-slate-200">
            <div className="bg-slate-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-slate-700 text-3xl">movie_filter</span>
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-slate-900 mb-2">Video Creator</h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Generate cinematic drone-style tours from static imagery automatically.
            </p>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">4K Cinematic</span>
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">AI Voice</span>
            </div>
          </div>

          {/* 3D Floor Plans */}
          <div className="col-span-12 lg:col-span-8 bg-slate-50 rounded-2xl p-1 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-all border border-slate-200">
            <div className="p-10 flex-1 flex flex-col justify-center">
              <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-blue-600 text-3xl">polyline</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-slate-900 mb-2">3D Floor Plan Editor</h3>
              <p className="text-slate-600 text-sm mb-8 max-w-xs leading-relaxed">
                Convert 2D blueprints into immersive 3D dollhouse models and interactive walkthroughs.
              </p>
              <Link
                href="/floorplan"
                className="bg-slate-900 text-white w-fit px-8 py-3 rounded-xl font-bold text-sm hover:bg-black active:scale-95 transition-all"
              >
                Open Editor
              </Link>
            </div>
            <div className="md:w-1/2 min-h-[250px] relative">
              <img
                src={quickActions[3].image}
                alt="3D Floor Plan"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-transparent" />
            </div>
          </div>
        </section>

        {/* Recent Projects Section */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] font-extrabold text-3xl text-slate-900 tracking-tight">Recent Projects</h2>
              <p className="text-slate-600 text-sm mt-1">Review your latest property marketing materials.</p>
            </div>
            <Link href="/library" className="text-blue-600 text-sm font-bold flex items-center gap-1 group">
              View All Library
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {recentProjects.map((project, idx) => (
              <div key={idx} className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300">
                <div className="relative overflow-hidden aspect-[16/10]">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm ${
                    project.status === 'processing'
                      ? 'bg-white/80 backdrop-blur border border-white/50'
                      : project.status === 'completed'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {project.status === 'processing' && (
                      <>
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-800 tracking-wider uppercase">Processing...</span>
                      </>
                    )}
                    {project.status === 'completed' && (
                      <>
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="text-[10px] font-bold tracking-wider uppercase">Completed</span>
                      </>
                    )}
                    {project.status === 'inactive' && (
                      <>
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Inactive</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-lg">{project.title}</h4>
                      <p className="text-slate-500 text-xs mt-1">Edited {project.time} • {project.location}</p>
                    </div>
                    <button className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-slate-400">more_vert</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-10 right-10 z-50">
        <button className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-black transition-all active:scale-95 group">
          <span className="material-symbols-outlined text-3xl">auto_fix_high</span>
          <div className="absolute right-full mr-4 bg-slate-900 text-white text-[11px] font-bold py-2.5 px-5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
            Expert AI Assistant
          </div>
        </button>
      </div>
    </AppLayout>
  );
}
