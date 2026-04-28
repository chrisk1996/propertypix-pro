'use client';

import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout';
import { useTranslations } from 'next-intl';
import { SocialMediaPanel } from '@/components/media/SocialMediaPanel';
import { createClient } from '@/utils/supabase/client';

export default function SocialPage() {
  const t = useTranslations('social');
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [propertyTitle, setPropertyTitle] = useState('');
  const [propertyPrice, setPropertyPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [city, setCity] = useState('');
  const [bedrooms, setBedrooms] = useState<number | ''>('');
  const [highlights, setHighlights] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const highlightsList = highlights
    .split(',')
    .map(h => h.trim())
    .filter(Boolean);

  return (
    <AppLayout title={t("title")}>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 text-sm mt-1">Generate platform-ready captions and images for your listing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Image + Property Info */}
          <div className="space-y-4">
            {/* Image Upload */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed transition-colors ${
                dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'
              } ${imagePreview ? 'aspect-auto' : 'aspect-[4/3]'} flex items-center justify-center overflow-hidden`}
            >
              {imagePreview ? (
                <div className="relative w-full">
                  <img src={imagePreview} alt="Property" className="w-full h-auto max-h-96 object-contain" />
                  <button
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="text-center p-8">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">photo_camera</span>
                  <p className="text-sm text-slate-500">Drop a property photo here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">{t("propertyDetails")}</h3>
              <input
                type="text"
                value={propertyTitle}
                onChange={e => setPropertyTitle(e.target.value)}
                placeholder="Property title (e.g. Modern Downtown Loft)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={propertyPrice}
                  onChange={e => setPropertyPrice(e.target.value)}
                  placeholder="Price (e.g. $450,000)"
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="City"
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  placeholder="Type (e.g. Apartment)"
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="number"
                  value={bedrooms}
                  onChange={e => setBedrooms(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Bedrooms"
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <textarea
                value={highlights}
                onChange={e => setHighlights(e.target.value)}
                placeholder="Highlights (comma-separated: e.g. Rooftop terrace, Smart home, City views)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Right: Social Media Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Generate Kit</h3>
            <SocialMediaPanel
              image={image}
              propertyTitle={propertyTitle}
              propertyPrice={propertyPrice}
              propertyType={propertyType}
              city={city}
              bedrooms={typeof bedrooms === 'number' ? bedrooms : undefined}
              highlights={highlightsList}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
