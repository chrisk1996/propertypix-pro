'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Library, Image, Download, Trash2, Clock, Video, Sofa, Sparkles, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useTranslations } from 'next-intl';

interface EnhancementJob {
  id: string;
  user_id: string;
  input_url: string;
  output_url: string | null;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
}

type FilterType = 'all' | 'enhance' | 'staging' | 'video' | 'floorplan';

const filterOptions: { id: FilterType; labelKey: string; icon: React.ReactNode }[] = [
  { id: 'all', labelKey: 'filterAll', icon: null },
  { id: 'enhance', labelKey: 'filterEnhance', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'staging', labelKey: 'typeStaging', icon: <Sofa className="w-4 h-4" /> },
  { id: 'video', labelKey: 'filterVideo', icon: <Video className="w-4 h-4" /> },
  { id: 'floorplan', labelKey: 'filterFloorplan', icon: <Image className="w-4 h-4" /> },
];

export default function LibraryPage() {
  const t = useTranslations('library');
  const tc = useTranslations('common');
  const [jobs, setJobs] = useState<EnhancementJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const supabase = createClient();

  const [compareJob, setCompareJob] = useState<EnhancementJob | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(t('loginRequired'));
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('zestio_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setJobs(data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (job: EnhancementJob) => {
    if (!job.output_url) return;

    try {
      const response = await fetch(job.output_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enhanced-${job.job_type}-${job.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(job.output_url, '_blank');
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const { error: deleteError } = await supabase
        .from('zestio_jobs')
        .delete()
        .eq('id', jobId);

      if (deleteError) throw deleteError;
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
      alert(t('deleteFailed'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('justNow');
    if (minutes < 60) return t('minAgo', { min: minutes });
    if (hours < 24) return t('hourAgo', { hours: hours });
    if (days < 7) return t('dayAgo', { days: days });
    return date.toLocaleDateString();
  };

  const getTypeInfo = (type: string) => {
    const typeMap: Record<string, { labelKey: string; icon: React.ReactNode; color: string }> = {
      auto: { labelKey: 'typeAuto', icon: <Wand2 className="w-4 h-4" />, color: 'text-purple-600 bg-purple-100' },
      sky: { labelKey: 'typeSky', icon: <Sparkles className="w-4 h-4" />, color: 'text-blue-600 bg-blue-100' },
      hdr: { labelKey: 'typeHdr', icon: <Sparkles className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-100' },
      seasons: { labelKey: 'typeSeasons', icon: <Sparkles className="w-4 h-4" />, color: 'text-green-600 bg-green-100' },
      declutter: { labelKey: 'typeDeclutter', icon: <Wand2 className="w-4 h-4" />, color: 'text-gray-600 bg-gray-100' },
      staging: { labelKey: 'typeStaging', icon: <Sofa className="w-4 h-4" />, color: 'text-amber-600 bg-amber-100' },
      video: { labelKey: 'typeVideo', icon: <Video className="w-4 h-4" />, color: 'text-red-600 bg-red-100' },
      floorplan: { labelKey: 'typeFloorplan', icon: <Image className="w-4 h-4" />, color: 'text-green-600 bg-green-100' },
      upscale: { labelKey: 'typeUpscale', icon: <Sparkles className="w-4 h-4" />, color: 'text-cyan-600 bg-cyan-100' },
      object_removal: { labelKey: 'typeObjectRemoval', icon: <Wand2 className="w-4 h-4" />, color: 'text-gray-600 bg-gray-100' },
      enhance: { labelKey: 'typeAuto', icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-600 bg-purple-100' },
      renovate: { labelKey: 'typeRenovate', icon: <Wand2 className="w-4 h-4" />, color: 'text-orange-600 bg-orange-100' },
    };
    return typeMap[type] || { label: type, icon: <Image className="w-4 h-4" />, color: 'text-gray-600 bg-gray-100' };
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  // Filter jobs based on active filter
  const filteredJobs = jobs.filter(job => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'enhance') return ['auto', 'sky', 'object_removal', 'hdr', 'seasons', 'declutter', 'upscale', 'enhance', 'renovate'].includes(job.job_type);
    if (activeFilter === 'staging') return job.job_type === 'staging';
    if (activeFilter === 'video') return job.job_type === 'video';
    if (activeFilter === 'floorplan') return job.job_type === 'floorplan';
    return true;
  });

  // Count items per category
  const getCounts = () => {
    return {
      all: jobs.length,
      enhance: jobs.filter(j => ['auto', 'sky', 'object_removal', 'hdr', 'seasons', 'declutter', 'upscale', 'enhance', 'renovate'].includes(j.job_type)).length,
      staging: jobs.filter(j => j.job_type === 'staging').length,
      video: jobs.filter(j => j.job_type === 'video').length,
      floorplan: jobs.filter(j => j.job_type === 'floorplan').length,
    };
  };

  const counts = getCounts();

  return (
    <AppLayout title="Image and Video Library">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Library className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-600">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Filter Tags */}
        {!loading && jobs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filter.icon}
                {filter.label}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === filter.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {counts[filter.id]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noItems')}</h3>
            <p className="text-gray-500 mb-6">{t('noItems')}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/enhance"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Enhance Photo
              </Link>
              <Link
                href="/staging"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Sofa className="w-4 h-4" />
                Virtual Staging
              </Link>
              <Link
                href="/video"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Video className="w-4 h-4" />
                Create Video
              </Link>
            </div>
          </div>
        )}

        {/* No Results for Filter */}
        {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">{t('noCategory')}</p>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const typeInfo = getTypeInfo(job.job_type);
              return (
                <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Image Preview */}
                  <div className="relative aspect-video bg-gray-100">
                    {job.output_url && job.input_url && job.job_type !== 'video' ? (
                      <>
                        <div className="relative w-full h-full">
                          <img src={job.output_url} alt="Result" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                            <img src={job.input_url} alt="Original" className="absolute inset-0 h-full object-cover" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }} />
                          </div>
                          <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                              <span className="text-gray-600 text-xs">⇔</span>
                            </div>
                          </div>
                        </div>
                        <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                          {job.status}
                        </span>
                      </>
                    ) : job.output_url ? (
                      <>
                        {job.job_type === 'video' ? (
                          <video src={job.output_url} className="w-full h-full object-cover" controls muted />
                        ) : (
                          <img src={job.output_url} alt="Output" className="w-full h-full object-cover" />
                        )}
                        <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                          {job.status}
                        </span>
                      </>
                    ) : job.input_url ? (
                      <>
                        <img src={job.input_url} alt="Original" className="w-full h-full object-cover opacity-50" />
                        <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                          {job.status}
                        </span>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${typeInfo.color}`}>
                          {typeInfo.icon}
                        </span>
                        <h3 className="font-medium text-gray-900">{t(typeInfo.labelKey)}</h3>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(job.created_at)}
                      </span>
                    </div>

                    {/* Metadata details */}
                    {job.metadata && typeof job.metadata === 'object' && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.metadata.enhancementType && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{String(job.metadata.enhancementType)}</span>
                        )}
                        {job.metadata.model && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{String(job.metadata.model)}</span>
                        )}
                        {job.metadata.scale && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{String(job.metadata.scale)}x upscale</span>
                        )}
                        {job.metadata.roomType && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{String(job.metadata.roomType)}</span>
                        )}
                        {job.metadata.furnitureStyle && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{String(job.metadata.furnitureStyle)}</span>
                        )}
                        {job.metadata.creditsUsed && (
                          <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">{String(job.metadata.creditsUsed)} credits</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {job.status === 'completed' && job.output_url && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleDownload(job)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                          {t('download')}
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {job.status === 'failed' && (
                      <p className="text-sm text-red-600 mt-2">{t('processingFailed')}</p>
                    )}

                    {job.status === 'processing' && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        {tc('processing')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
