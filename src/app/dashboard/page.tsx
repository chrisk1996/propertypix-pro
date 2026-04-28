'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { createClient } from '@/utils/supabase/client';
import { useTranslations } from 'next-intl';

interface DashboardData {
  credits: number;
  creditsUsed: number;
  creditsTotal: number;
  plan: string;
  recentVideos: number;
  recentListings: number;
}

const toolDefs = [
  { titleKey: 'tools.imageStudio' as const, descKey: 'tools.imageStudioDesc' as const, icon: 'auto_awesome', href: '/studio', color: 'bg-emerald-50 text-emerald-600' },
  { titleKey: 'tools.videoCreator' as const, descKey: 'tools.videoCreatorDesc' as const, icon: 'movie', href: '/video', color: 'bg-blue-50 text-blue-600' },
  { titleKey: 'tools.listingBuilder' as const, descKey: 'tools.listingBuilderDesc' as const, icon: 'description', href: '/listing/new', color: 'bg-purple-50 text-purple-600' },
  { titleKey: 'tools.smartCaptions' as const, descKey: 'tools.smartCaptionsDesc' as const, icon: 'share', href: '/social', color: 'bg-orange-50 text-orange-600' },
  { titleKey: 'tools.floorPlans' as const, descKey: 'tools.floorPlansDesc' as const, icon: 'architecture', href: '/floorplan', color: 'bg-teal-50 text-teal-600' },
  { titleKey: 'tools.apiDocs' as const, descKey: 'tools.apiDocsDesc' as const, icon: 'code', href: '/docs', color: 'bg-slate-100 text-slate-600' },
];

export default function DashboardPage() {
  const t = useTranslations('dashboard');
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
            {t('creatingToday')}
          </h1>
          <p className="text-[#43474c] max-w-xl">
            {t('pickTool')} {loading ? '...' : <span className="font-medium text-[#006c4d]">{data.credits} {t('creditsRemaining2')}</span>}
          </p>
        </section>

        {/* Stats Bar */}
        {!loading && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white rounded-xl p-5 border border-[#c4c6cd]/10">
              <span className="text-xs text-[#43474c] font-manrope uppercase tracking-wider">{t('plan')}</span>
              <p className="text-xl font-bold text-[#1d2832] mt-1 capitalize">{data.plan}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#c4c6cd]/10">
              <span className="text-xs text-[#43474c] font-manrope uppercase tracking-wider">{t('creditsLeft')}</span>
              <p className="text-xl font-bold text-[#006c4d] mt-1">{data.credits} <span className="text-sm text-[#43474c] font-normal">/ {data.creditsTotal}</span></p>
              <div className="h-1.5 bg-[#edf4ff] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#006c4d] rounded-full transition-all" style={{ width: `${creditPercent}%` }} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#c4c6cd]/10">
              <span className="text-xs text-[#43474c] font-manrope uppercase tracking-wider">{t('videosCreated')}</span>
              <p className="text-xl font-bold text-[#1d2832] mt-1">{data.recentVideos}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#c4c6cd]/10">
              <span className="text-xs text-[#43474c] font-manrope uppercase tracking-wider">{t('listings')}</span>
              <p className="text-xl font-bold text-[#1d2832] mt-1">{data.recentListings}</p>
            </div>
          </section>
        )}

        {/* Tool Grid */}
        <section className="mb-16">
          <h2 className="font-serif text-2xl text-[#1d2832] mb-6">{t('toolsLabel')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {toolDefs.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="bg-white rounded-xl p-6 border border-[#c4c6cd]/10 hover:shadow-md hover:border-[#006c4d]/20 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-4`}>
                  <span className="material-symbols-outlined text-2xl">{tool.icon}</span>
                </div>
                <h3 className="font-medium text-[#1d2832] mb-1 group-hover:text-[#006c4d] transition-colors">{t(tool.titleKey)}</h3>
                <p className="text-sm text-[#43474c] leading-relaxed">{t(tool.descKey)}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="flex flex-wrap gap-3">
          <Link href="/billing" className="px-5 py-2.5 bg-white border border-[#c4c6cd]/20 rounded-lg text-sm text-[#1d2832] hover:bg-[#edf4ff] transition-all">
            {t('manageBilling')}
          </Link>
          <Link href="/settings" className="px-5 py-2.5 bg-white border border-[#c4c6cd]/20 rounded-lg text-sm text-[#1d2832] hover:bg-[#edf4ff] transition-all">
            {t('settingsApiKeys')}
          </Link>
          <Link href="/help" className="px-5 py-2.5 bg-white border border-[#c4c6cd]/20 rounded-lg text-sm text-[#1d2832] hover:bg-[#edf4ff] transition-all">
            {t('helpSupport')}
          </Link>
        </section>
      </div>
    </AppLayout>
  );
}
