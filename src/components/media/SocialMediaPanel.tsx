'use client';

import { useState, useRef, useCallback } from 'react';

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter';
type PlatformFormat = 'instagram_post' | 'instagram_story' | 'facebook_post' | 'linkedin_post' | 'twitter_post' | 'pinterest' | 'whatsapp_status';

interface CaptionData {
  text: string;
  hashtags: string[];
}

interface SocialKitProps {
  image: string | null;
  propertyTitle?: string;
  propertyPrice?: string;
  propertyType?: string;
  city?: string;
  bedrooms?: number;
  highlights?: string[];
}

const platformIcons: Record<Platform, string> = {
  instagram: '📸',
  facebook: '👤',
  linkedin: '💼',
  twitter: '𝕏',
};

const platformColors: Record<Platform, string> = {
  instagram: 'from-purple-500 to-pink-500',
  facebook: 'from-blue-600 to-blue-500',
  linkedin: 'from-blue-700 to-blue-600',
  twitter: 'from-slate-800 to-slate-700',
};

const availableFormats: { id: PlatformFormat; label: string; size: string; platform: Platform }[] = [
  { id: 'instagram_post', label: 'Instagram Post', size: '1080×1080', platform: 'instagram' },
  { id: 'instagram_story', label: 'Instagram Story', size: '1080×1920', platform: 'instagram' },
  { id: 'facebook_post', label: 'Facebook Post', size: '1200×630', platform: 'facebook' },
  { id: 'linkedin_post', label: 'LinkedIn Post', size: '1200×627', platform: 'linkedin' },
  { id: 'twitter_post', label: 'X/Twitter Post', size: '1200×675', platform: 'twitter' },
  { id: 'pinterest', label: 'Pinterest Pin', size: '1000×1500', platform: 'instagram' },
  { id: 'whatsapp_status', label: 'WhatsApp Status', size: '1080×1920', platform: 'instagram' },
];

export function SocialMediaPanel({
  image,
  propertyTitle,
  propertyPrice,
  propertyType,
  city,
  bedrooms,
  highlights = [],
}: SocialKitProps) {
  const [captions, setCaptions] = useState<Record<string, CaptionData> | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<PlatformFormat[]>(['instagram_post', 'facebook_post', 'linkedin_post', 'twitter_post']);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [tone, setTone] = useState<'professional' | 'luxury' | 'casual' | 'urgency'>('professional');
  const [copied, setCopied] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toggleFormat = (format: PlatformFormat) => {
    setSelectedFormats(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const generateCaptions = async () => {
    if (!image) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/smart-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          property_type: propertyType,
          city,
          price: propertyPrice,
          bedrooms,
          highlights,
          platforms: ['instagram', 'facebook', 'linkedin', 'twitter'],
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCaptions(data.captions);
    } catch (err) {
      console.error('Caption generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = useCallback(async (format: typeof availableFormats[number]) => {
    if (!image) return;
    setDownloading(format.id);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Parse dimensions from size string
      const [w, h] = format.size.split('×').map(Number);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = image;
      });

      // Draw image covering the canvas (like object-fit: cover)
      const scale = Math.max(w / img.width, h / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (w - drawW) / 2;
      const offsetY = (h - drawH) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // Add subtle gradient overlay for text readability
      if (propertyTitle || propertyPrice) {
        const gradient = ctx.createLinearGradient(0, h * 0.6, 0, h);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Draw text
        const fontSize = Math.max(24, Math.min(w, h) / 18);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
        ctx.textAlign = 'left';

        const textY = h - 60;
        if (propertyTitle) {
          ctx.fillText(propertyTitle.substring(0, 40), 30, textY);
        }
        if (propertyPrice) {
          ctx.font = `${fontSize * 0.8}px -apple-system, sans-serif`;
          ctx.fillStyle = '#a5f3fc';
          ctx.fillText(propertyPrice, 30, textY + fontSize + 8);
        }
      }

      // Download
      const link = document.createElement('a');
      link.download = `${format.id}_${propertyTitle || 'property'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  }, [image, propertyTitle, propertyPrice]);

  const downloadAll = async () => {
    for (const formatId of selectedFormats) {
      const format = availableFormats.find(f => f.id === formatId);
      if (format) await downloadImage(format);
    }
  };

  const copyCaption = (platform: string, text: string) => {
    const full = captions?.[platform];
    const copyText = full ? `${full.text}\n\n${full.hashtags.join(' ')}` : text;
    navigator.clipboard.writeText(copyText);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  };

  const activePlatforms = [...new Set(selectedFormats.map(f => availableFormats.find(a => a.id === f)?.platform).filter(Boolean))] as Platform[];

  return (
    <div className="space-y-5">
      <canvas ref={canvasRef} className="hidden" />

      {/* Tone Selector */}
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-2 block">Caption Tone</label>
        <div className="grid grid-cols-2 gap-2">
          {(['professional', 'luxury', 'casual', 'urgency'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                tone === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-2 block">Formats</label>
        <div className="grid grid-cols-2 gap-2">
          {availableFormats.map(format => (
            <button
              key={format.id}
              onClick={() => toggleFormat(format.id)}
              className={`px-3 py-2.5 rounded-lg text-left transition-all ${
                selectedFormats.includes(format.id)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs font-medium">{format.label}</div>
              <div className={`text-[10px] ${selectedFormats.includes(format.id) ? 'text-indigo-200' : 'text-slate-400'}`}>
                {format.size}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateCaptions}
        disabled={generating || !image || activePlatforms.length === 0}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating Captions...
          </>
        ) : (
          <>✨ Generate Smart Captions</>
        )}
      </button>

      {/* Captions */}
      {captions && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500">Generated Captions</label>
            <button
              onClick={downloadAll}
              disabled={selectedFormats.length === 0}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
            >
              Download All Images ({selectedFormats.length})
            </button>
          </div>
          {Object.entries(captions).map(([platform, data]) => (
            <div key={platform} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className={`bg-gradient-to-r ${platformColors[platform as Platform] || 'from-slate-600 to-slate-500'} px-4 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span>{platformIcons[platform as Platform] || '📱'}</span>
                  <span className="text-white text-sm font-semibold capitalize">{platform}</span>
                </div>
                <button
                  onClick={() => copyCaption(platform, data.text)}
                  className="text-white/80 hover:text-white text-xs font-medium"
                >
                  {copied === platform ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.text}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {data.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Download Grid */}
      {image && selectedFormats.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-2 block">Download Images</label>
          <div className="grid grid-cols-2 gap-2">
            {selectedFormats.map(formatId => {
              const format = availableFormats.find(f => f.id === formatId);
              if (!format) return null;
              return (
                <button
                  key={format.id}
                  onClick={() => downloadImage(format)}
                  disabled={downloading === format.id}
                  className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {downloading === format.id ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  ) : (
                    <span className="text-sm">⬇️</span>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-medium text-slate-700">{format.label}</div>
                    <div className="text-[10px] text-slate-400">{format.size}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
