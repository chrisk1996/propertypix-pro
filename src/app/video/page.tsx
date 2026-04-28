'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { VideoModeToggle } from '@/components/VideoModeToggle';
import { VideoPipelineProgress } from '@/components/VideoPipelineProgress';
import { VideoJobCard, VideoJobCardSkeleton, VideoJobCardEmpty } from '@/components/VideoJobCard';
import { useVideoJob, useVideoJobs } from '@/hooks/useVideoJob';
import { useListingVideoContext } from '@/hooks/useListingVideoContext';
import { createClient } from '@/utils/supabase/client';
import { cn } from '@/utils/cn';
import { useTranslations } from 'next-intl';
import type { VideoJob } from '@/types/video-job';
import { 
  PLATFORM_CONFIG, 
  VIDEO_STATUS_CONFIG,
  RENOVATION_STYLES, 
  MUSIC_GENRES,
  detectPlatform,
  statusToStage,
  type RenovationStyle,
  type MusicGenre,
  type VideoPlatform,
} from '@/types/video-job';

type Mode = 'url' | 'manual';

function CreditDisplay({ remaining, total }: { remaining: number; total: number }) {
  const percentage = total > 0 ? (remaining / total) * 100 : 0;
  
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">Credits Available</span>
        <span className="text-lg font-bold text-purple-600">{remaining}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              percentage > 50 ? 'bg-purple-500' : percentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      <p className="text-xs text-slate-500 mt-1">{remaining} {t('of')} {total} {t('remaining')}</p>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: VideoPlatform }) {
  const config = PLATFORM_CONFIG[platform];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-sm', config.bgColor, config.color, config.borderColor)}>
      <span className="material-symbols-outlined text-lg">language</span>
      {config.label}
    </span>
  );
}

function getFailedMessage(job: Record<string, unknown>): string {
  const metadata = job.metadata as Record<string, unknown> | null;
  const metaError = metadata?.error as string | undefined;
  const stageLabels: Record<string, string> = {
    scraping: t('stageScraping'),
    sorting: t('stageSorting'),
    renovating: t('stageRenovating'),
    animating: t('stageAnimating'),
    stitching: t('stageStitching'),
  };
  if (metaError) {
    const stage = metaError.split(':')[0];
    const detail = metaError.split(':').slice(1).join(':').trim();
    return `${t('failedAt')} ${stageLabels[stage] || stage}: ${detail || t('unknownError')}`;
  }
  return t('failedProcessing');
}

export default function VideoPage() {
  const t = useTranslations('video');
  const [mode, setMode] = useState<Mode>('url');
  const [listingUrl, setListingUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<VideoPlatform | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [renovationStyle, setRenovationStyle] = useState<RenovationStyle>('modern');
  const [musicGenre, setMusicGenre] = useState<MusicGenre>('cinematic');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [credits, setCredits] = useState({ remaining: 0, total: 5 });
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  
  const { job: activeJob, refetch: refetchActiveJob } = useVideoJob({ jobId: activeJobId ?? undefined, autoSubscribe: true });
  const { jobs: recentJobs, isLoading: isLoadingJobs, refetch: refetchJobs } = useVideoJobs({ limit: 5 });
  const supabase = createClient();

  // Polling: trigger processing and refetch for active jobs
  useEffect(() => {
    if (!activeJob?.id) return;
    const activeStatuses = ['scraping', 'sorting', 'renovating', 'animating', 'stitching'];
    if (!activeStatuses.includes(activeJob.status)) return;

    const poll = async () => {
      try {
        await fetch(`/api/video-jobs/${activeJob.id}/process`, { method: 'POST' });
      } catch (err) {
        console.error('Process trigger failed:', err);
      }
      // Refetch both the active job and the jobs list
      refetchActiveJob();
      refetchJobs();
    };

    // Poll every 5 seconds while active
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status, refetchActiveJob, refetchJobs]);
  
  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch('/api/credits');
        const data = await res.json();
        setCredits({ remaining: data.credits || 0, total: data.total || 5 });
      } catch (err) {
        console.error('Failed to fetch credits:', err);
      } finally {
        setIsLoadingCredits(false);
      }
    }
    fetchCredits();
  }, []);
  
  useEffect(() => {
    if (listingUrl && mode === 'url') {
      const platform = detectPlatform(listingUrl);
      setDetectedPlatform(platform !== 'other' ? platform : null);
    } else {
      setDetectedPlatform(null);
    }
  }, [listingUrl, mode]);
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${user.id}/video-uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from('user-uploads').getPublicUrl(path);
        if (urlData.publicUrl) {
          newUrls.push(urlData.publicUrl);
        }
      }

      setUploadedImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
      // Reset file input so re-selecting the same file works
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const removeImage = (index: number) => setUploadedImages(prev => prev.filter((_, i) => i !== index));
  
  const handleCreateJob = useCallback(async () => {
    if (mode === 'url' && !listingUrl) {
      setCreateError(t('enterUrl'));
      return;
    }
    if (mode === 'manual' && uploadedImages.length < 5) {
      setCreateError(t('uploadMin5'));
      return;
    }
    if (credits.remaining < 5) {
      setCreateError(t('notEnoughCredits'));
      return;
    }
    
    setIsCreating(true);
    setCreateError(null);
    
    console.log('[Video] Creating job:', { mode, listingUrl, imageCount: uploadedImages.length, renovationStyle, musicGenre });
    try {
      const response = await fetch('/api/video-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_url: mode === 'url' ? listingUrl : undefined,
          renovation_style: renovationStyle,
          music_genre: musicGenre,
          ...(mode === 'manual' && { manual_images: uploadedImages }),
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('failedToCreate'));
      
      setActiveJobId(data.job_id);
      setListingUrl('');
      setUploadedImages([]);
      refetchJobs();
      setCredits(prev => ({ ...prev, remaining: Math.max(0, prev.remaining - 5) }));

      // Trigger first processing step immediately
      setTimeout(() => {
        fetch(`/api/video-jobs/${data.job_id}/process`, { method: 'POST' })
          .then(() => refetchJobs())
          .catch(err => console.error('Initial process trigger failed:', err));
      }, 1000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('failedToCreate'));
    } finally {
      setIsCreating(false);
    }
  }, [mode, listingUrl, uploadedImages, renovationStyle, musicGenre, credits.remaining, refetchJobs]);
  
  const handleCreateAnother = () => {
    setActiveJobId(null);
    setListingUrl('');
    setUploadedImages([]);
    setCreateError(null);
  };
  
  const remainingCredits = credits.remaining;
  const hasCredit = credits.remaining > 0;
  const canSubmit = hasCredit && credits.remaining >= 5 && ((mode === 'url' && listingUrl.length > 0) || (mode === 'manual' && uploadedImages.length >= 5));
  const currentStageInfo = activeJob ? statusToStage(activeJob.status) : null;
  const isJobComplete = activeJob?.status === 'done';
  const isJobFailed = activeJob?.status === 'failed' || activeJob?.status === 'needs_images';

  return (
    <AppLayout title={t("title")}>
      <div className="max-w-[1600px] mx-auto p-8">
        <header className="mb-8">
          <span className="text-purple-600 font-bold tracking-widest uppercase text-xs mb-2 block">AI Video Production</span>
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl text-slate-900 font-bold tracking-tighter mb-3">Video Creator</h1>
          <p className="max-w-xl text-slate-600 leading-relaxed">Generate cinematic property tour videos from listing URLs or uploaded images. AI-powered virtual renovation included.</p>
        </header>
        
        <div className="grid grid-cols-12 gap-8">
          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Jobs</h3>
            {!isLoadingCredits && <CreditDisplay remaining={credits.remaining} total={credits.total} />}
            <div className="space-y-3">
              {isLoadingJobs ? (<><VideoJobCardSkeleton /><VideoJobCardSkeleton /><VideoJobCardSkeleton /></>) 
               : recentJobs.length === 0 ? <VideoJobCardEmpty />
               : recentJobs.map(job => <VideoJobCard key={job.id} job={job} isActive={job.id === activeJobId} onClick={() => setActiveJobId(job.id)} />)}
            </div>
          </aside>
          
          <main className="col-span-12 lg:col-span-9">
            {activeJob ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isJobComplete && activeJob.output_video_url ? (
                  <div className="aspect-video bg-slate-900">
                    <video src={activeJob.output_video_url} controls className="w-full h-full object-contain" poster={activeJob.thumbnail_url} />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-8">
                    {activeJob.platform && activeJob.platform !== 'other' && <PlatformBadge platform={activeJob.platform} />}
                    <div className="w-full max-w-2xl mt-8">
                      <VideoPipelineProgress currentStage={currentStageInfo?.stage ?? 'scrape'} stageStatus={currentStageInfo?.stageStatus ?? 'pending'} job={activeJob} />
                    </div>
                    <div className="mt-8 text-center">
                      <span className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium', (VIDEO_STATUS_CONFIG[activeJob.status] || VIDEO_STATUS_CONFIG.queued)?.bgColor, (VIDEO_STATUS_CONFIG[activeJob.status] || VIDEO_STATUS_CONFIG.queued)?.color)}>
                        <span className={cn('material-symbols-outlined text-lg', !isJobFailed && 'animate-spin')}>{(VIDEO_STATUS_CONFIG[activeJob.status] || VIDEO_STATUS_CONFIG.queued)?.icon}</span>
                        {(VIDEO_STATUS_CONFIG[activeJob.status] || VIDEO_STATUS_CONFIG.queued)?.label}
                      </span>
                      <p className="text-slate-400 text-sm mt-2">{activeJob?.status === 'needs_images' ? t('couldNotExtract') : (activeJob?.status === 'failed' ? getFailedMessage(activeJob) : t('processing'))}</p>
                    </div>
                  </div>
                )}
                
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                  {isJobComplete ? (
                    <div className="flex gap-4">
                      <a href={activeJob.output_video_url} download className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors">
                        <span className="material-symbols-outlined">download</span> Download Video
                      </a>
                      <button type="button" className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                        <span className="material-symbols-outlined">share</span> Share
                      </button>
                      <button type="button" onClick={handleCreateAnother} className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                        <span className="material-symbols-outlined">add</span> Create Another
                      </button>
                    </div>
                  ) : isJobFailed ? (
                    <button type="button" onClick={handleCreateAnother} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
                      <span className="material-symbols-outlined">refresh</span> Try Again
                    </button>
                  ) : (
                    <p className="text-center text-sm text-slate-500">You can close this page. We&apos;ll notify you when your video is ready.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4">Input Method</h3>
                  <VideoModeToggle mode={mode} onChange={setMode} />
                </div>
                
                {mode === 'url' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">Listing URL</h3>
                    <div className="space-y-4">
                      <div className="relative">
                        <input type="url" value={listingUrl} onChange={(e) => setListingUrl(e.target.value)} placeholder={t('pasteUrl') } className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">link</span>
                      </div>
                      {detectedPlatform && (<div className="flex items-center gap-2"><span className="text-sm text-slate-600">Detected:</span><PlatformBadge platform={detectedPlatform} /></div>)}
                      {!listingUrl && (<div className="flex flex-wrap gap-2"><span className="text-xs text-slate-500">Supported:</span>{(['zillow', 'immobilienscout24', 'redfin', 'rightmove'] as VideoPlatform[]).map(p => (<span key={p} className={cn('text-xs px-2 py-0.5 rounded', PLATFORM_CONFIG[p].bgColor, PLATFORM_CONFIG[p].color)}>{PLATFORM_CONFIG[p].label}</span>))}</div>)}
                    </div>
                  </div>
                )}
                
                {mode === 'manual' && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">Upload Images</h3>
                    <div onClick={() => !isUploading && fileInputRef.current?.click()} className={cn("w-full aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all mb-4", isUploading && "opacity-60 pointer-events-none")}>
                      {isUploading ? (
                        <>
                          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          <p className="font-semibold text-slate-700">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-5xl text-slate-400">add_photo_alternate</span>
                          <div className="text-center"><p className="font-semibold text-slate-700">Drop your property images here</p><p className="text-sm text-slate-500">or click to browse (min 5 images)</p></div>
                        </>
                      )}
                    </div>
                    {uploadedImages.length > 0 && (<div className="grid grid-cols-5 gap-2 mb-4">{uploadedImages.map((img, idx) => (<div key={idx} className="relative aspect-square rounded-lg overflow-hidden group"><img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" /><button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-sm">close</span></button></div>))}</div>)}
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                    <p className="text-sm text-slate-500">{uploadedImages.length}/5 minimum images uploaded</p>
                  </div>
                )}
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4">Renovation Style</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {RENOVATION_STYLES.map(style => (<button key={style} type="button" onClick={() => setRenovationStyle(style)} className={cn('px-4 py-3 rounded-xl font-semibold text-sm capitalize transition-all', renovationStyle === style ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>{style}</button>))}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4">Background Music</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {MUSIC_GENRES.map(genre => (<button key={genre} type="button" onClick={() => setMusicGenre(genre)} className={cn('px-4 py-3 rounded-xl font-semibold text-sm capitalize transition-all', musicGenre === genre ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>{genre}</button>))}
                  </div>
                </div>
                
                {createError && (<div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"><span className="material-symbols-outlined text-red-600">error</span><div><p className="font-semibold text-red-900">Failed to create video</p><p className="text-sm text-red-700 mt-1">{createError}</p></div></div>)}
                
                <button type="button" onClick={handleCreateJob} disabled={!canSubmit || isCreating} className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-purple-600/20">
                  <span className="material-symbols-outlined">auto_awesome</span>{isCreating ? t('creating') : t('generateVideo')}
                </button>
                
                {!hasCredit || credits.remaining < 5 ? (<p className="text-center text-sm text-red-600">You need at least 5 credits to generate a video. Please purchase more credits.</p>) : null}
              </div>
            )}
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
