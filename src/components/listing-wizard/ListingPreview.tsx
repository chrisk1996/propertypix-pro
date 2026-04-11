'use client';

import type { ListingData } from './ListingWizard';

interface ListingPreviewProps {
  data: ListingData;
}

export function ListingPreview({ data }: ListingPreviewProps) {
  const formatPrice = () => {
    if (data.transaction_type === 'rent') {
      const warmRent = data.warm_rent || data.cold_rent || 0;
      return {
        main: warmRent > 0 ? `€${warmRent.toLocaleString()}` : '€0',
        period: '/Monat',
        sub: data.cold_rent ? `Kaltmiete €${data.cold_rent.toLocaleString()}` : null
      };
    }
    return {
      main: data.price > 0 ? `€${data.price.toLocaleString()}` : '€0',
      period: '',
      sub: data.hoa_fees ? `Hausgeld €${data.hoa_fees.toLocaleString()}/mo` : null
    };
  };

  const activeFeatures = Object.entries(data.features)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const price = formatPrice();
  const hasImages = data.media_ids && data.media_ids.length > 0;

  // Generate title preview
  const titlePreview = data.title || (
    data.rooms && data.living_area
      ? `${data.rooms}-Zimmer ${data.property_type === 'apartment' ? 'Wohnung' : 'Haus'} in ${data.city || 'Berlin'}`
      : 'Objekttitel'
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">
            Live Portal Preview
          </span>
        </div>
        <div className="flex gap-1.5">
          <button className="p-1.5 bg-white rounded shadow-sm">
            <span className="text-sm">💻</span>
          </button>
          <button className="p-1.5 bg-white/50 rounded opacity-50">
            <span className="text-sm">📱</span>
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200/50">
        
        {/* Hero Section */}
        <div className="relative h-56 w-full bg-gradient-to-br from-slate-100 to-slate-200">
          {hasImages ? (
            <img 
              src={data.media_ids[0]} 
              alt="Property" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <div className="text-4xl mb-2">🏡</div>
                <p className="text-xs">Upload photos to preview</p>
              </div>
            </div>
          )}
          
          {/* Price Overlay - Top Right */}
          <div className="absolute top-4 right-4 backdrop-blur-md bg-white/80 px-4 py-2 rounded-sm">
            <span className="font-serif font-bold text-xl text-slate-900">
              {price.main}
            </span>
            <span className="text-sm text-slate-600">{price.period}</span>
          </div>

          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute bottom-3 left-4">
            <span className="text-white/70 text-[10px] uppercase tracking-widest block mb-0.5">
              {data.transaction_type === 'rent' ? 'Miete' : 'Kauf'}
            </span>
            <h2 className="text-white font-serif text-xl leading-tight">
              {titlePreview}
            </h2>
          </div>
        </div>

        {/* Editorial Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          
          {/* Key Stats */}
          <div className="flex justify-between border-b border-slate-200/50 pb-4">
            <div className="text-center">
              <span className="block font-serif text-xl text-slate-900">
                {data.rooms || '—'}
              </span>
              <span className="block text-[10px] uppercase tracking-tight text-slate-500">
                Zimmer
              </span>
            </div>
            <div className="text-center">
              <span className="block font-serif text-xl text-slate-900">
                {data.living_area || '—'}
              </span>
              <span className="block text-[10px] uppercase tracking-tight text-slate-500">
                m²
              </span>
            </div>
            <div className="text-center">
              <span className="block font-serif text-xl text-slate-900">
                {data.bedrooms || '—'}
              </span>
              <span className="block text-[10px] uppercase tracking-tight text-slate-500">
                Schlafz.
              </span>
            </div>
            <div className="text-center">
              <span className="block font-serif text-xl text-slate-900">
                {data.bathrooms || '—'}
              </span>
              <span className="block text-[10px] uppercase tracking-tight text-slate-500">
                Bad
              </span>
            </div>
          </div>

          {/* Asymmetric Layout - Title + Description */}
          {data.description && (
            <div className="flex gap-5 items-start">
              <div className="w-1/3">
                <h3 className="font-serif text-lg text-slate-900 leading-snug">
                  {data.city || 'Ihr neues Zuhause'}
                </h3>
              </div>
              <div className="w-2/3">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {data.description}
                </p>
              </div>
            </div>
          )}

          {/* Photo Bento Grid */}
          {hasImages && data.media_ids.length > 1 && (
            <div className="grid grid-cols-2 gap-2 h-32">
              <div className="bg-slate-100 rounded overflow-hidden">
                <img 
                  src={data.media_ids[1]} 
                  alt="Interior" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-rows-2 gap-2">
                <div className="bg-slate-100 rounded overflow-hidden">
                  {data.media_ids[2] && (
                    <img 
                      src={data.media_ids[2]} 
                      alt="Detail" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="bg-slate-100 rounded overflow-hidden flex items-center justify-center relative">
                  {data.media_ids.length > 3 && (
                    <>
                      <img 
                        src={data.media_ids[3]} 
                        alt="More" 
                        className="w-full h-full object-cover opacity-40 blur-[1px]"
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                        +{data.media_ids.length - 3} Fotos
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Feature Badges */}
          {activeFeatures.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {activeFeatures.slice(0, 4).map((feature) => (
                <span 
                  key={feature}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full"
                >
                  {feature.replace(/_/g, ' ')}
                </span>
              ))}
              {activeFeatures.length > 4 && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  +{activeFeatures.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Location & POI */}
          {data.proximity_data && Object.keys(data.proximity_data).length > 0 && (
            <div className="pt-3 border-t border-slate-200/50">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-medium">
                Lage & Infrastruktur
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {(Object.entries(data.proximity_data) as [string, { walking_minutes?: number }[]][])
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span>
                        {key === 'hospital' && '🏥'}
                        {key === 'primary_school' && '🏫'}
                        {key === 'supermarket' && '🛒'}
                        {key === 'public_transport' && '🚇'}
                        {key === 'park' && '🌳'}
                        {!['hospital', 'primary_school', 'supermarket', 'public_transport', 'park'].includes(key) && '📍'}
                      </span>
                      <span>{value?.[0]?.walking_minutes ? `${value[0].walking_minutes} Min` : '—'}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
