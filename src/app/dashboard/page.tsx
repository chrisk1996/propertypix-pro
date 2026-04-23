'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { createClient } from '@/utils/supabase/client';

interface DashboardData {
  credits: number;
  creditsUsed: number;
  creditsTotal: number;
  plan: string;
  recentVideos: number;
  recentListings: number;
}

const tools = [
  {
    title: 'Image Studio',
    description: 'Enhance, stage, replace skies, change seasons — 13 AI tools in one.',
    icon: 'auto_awesome',
    href: '/studio',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Video Creator',
    description: 'Upload photos → get a cinematic video. AI sorts, stages, animates.',
    icon: 'movie',
    href: '/video',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Listing Builder',
    description: 'AI-generated property descriptions in English & German.',
    icon: 'description',
    href: '/listing/new',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'Smart Captions',
    description: 'AI captions for Instagram, Facebook & more. Free, no credits.',
    icon: 'share',
    href: '/social',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    title: '3D Floor Plans',
    description: 'Convert 2D blueprints into interactive 3D models.',
    icon: 'architecture',
    href: '/floorplan',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    title: 'API Docs',
    description: 'Build with Zestio. REST API, keys, full documentation.',
    icon: 'code',
    href: '/docs',
    color: 'bg-slate-100 text-slate-600',
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    credits: 0,
    creditsUsed: 0,
    creditsTotal: 0,
    plan: 'free',
    recentVideos: 0,
    recentListings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [creditsRes, videosRes, listingsRes] = await Promise.all([
          fetch('/api/credits'),
          supabase.from('video_jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);

        const creditsData = await creditsRes.json();
        setData({
          credits: creditsData.credits || 0,
          creditsUsed: creditsData.used || 0,
          creditsTotal: creditsData.total || 5,
          plan: creditsData.plan || 'free',
          recentVideos: videosRes.count || 0,
          recentListings: listingsRes.count || 0,
        });
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const creditPercent = data.creditsTotal > 0 ? Math.round((data.credits / data.creditsTotal) * 100) : 0;

  return (
    <AppLayout title="Dashboard" hideTopNav>
      <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto">

        {/* Welcome */}
        <section className="mb-10">
          <h1 className="font-serif text-4xl md:text-5xl text-[#1d2832] mb-3 leading-tight">
            What are we<br />creating today?
          </h1>
          <p className="text-[#43474c] max-w-xl">
            Pick a tool below to get started. Everything runs on AI credits — you have {loading ? '...' : <span className="font-medium text-[#006c4d]">{data.credits} credits</span>} remaining.
          </p>
        </section>

        {/* Stats Bar */}
        {!loading && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white rounded-xl p-5 border border-[#c4c6cd]/10">
              <span className="text-xs text-[#43474c] font-manrope uppercase tracking-wider">Plan</span>
              <p className="text-xl font-bold text-[#1d2832] mt-1 capitalize">{data.plan}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#c4c6cd]/10">
              <span className="text-xs text-[#43474c] font-manrope uppercase tracking-wider">Credits Left</span>
              <p className="text-xl font-bold text-[#006c4d] mt-1">{data.credits} <span className="text-sm text-[#43474c] font-normal">/ {data.creditsTotal}</span></p>
              <div className="h-1.5 bg-[#edf4ff] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#006c4d] rounded-full transition-all" style={{ width: `${creditPercent}%` }} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#c4c6cd]/10">
              <span className="text-xs text-[#43474c] font-manrope uppercase tracking-wider">Videos Created</span>
              <p className="text-xl font-bold text-[#1d2832] mt-1">{data.recentVideos}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#c4c6cd]/10">
              <span className="text-xs text-[#43474c] font-manrope uppercase tracking-wider">Listings</span>
              <p className="text-xl font-bold text-[#1d2832] mt-1">{data.recentListings}</p>
            </div>
          </section>
        )}

        {/* Tool Grid */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-6">Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="bg-white rounded-xl p-6 border border-[#c4c6cd]/10 hover:shadow-md hover:border-[#006c4d]/20 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-4`}>
                  <span className="material-symbols-outlined text-2xl">{tool.icon}</span>
                </div>
                <h3 className="font-medium text-[#1d2832] mb-1 group-hover:text-[#006c4d] transition-colors">{tool.title}</h3>
                <p className="text-sm text-[#43474c] leading-relaxed">{tool.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="flex flex-wrap gap-3">
          <Link href="/billing" className="px-5 py-2.5 bg-white border border-[#c4c6cd]/20 rounded-lg text-sm text-[#1d2832] hover:bg-[#edf4ff] transition-all">
            Manage Billing
          </Link>
          <Link href="/settings" className="px-5 py-2.5 bg-white border border-[#c4c6cd]/20 rounded-lg text-sm text-[#1d2832] hover:bg-[#edf4ff] transition-all">
            Settings & API Keys
          </Link>
          <Link href="/help" className="px-5 py-2.5 bg-white border border-[#c4c6cd]/20 rounded-lg text-sm text-[#1d2832] hover:bg-[#edf4ff] transition-all">
            Help & Support
          </Link>
        </section>
      </div>
    </AppLayout>
  );
}
