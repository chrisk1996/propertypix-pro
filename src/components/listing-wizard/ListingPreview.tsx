'use client';

import type { ListingData } from './ListingWizard';
import { Hospital, School, ShoppingBag, Train, Trees, Bike } from 'lucide-react';

interface ProximityPOI {
  name: string;
  distance_meters: number;
  walking_minutes: number;
  type?: string;
}

interface ListingPreviewProps {
  data: ListingData;
}

export function ListingPreview({ data }: ListingPreviewProps) {
  const proximity = data.proximity_data as Record<string, ProximityPOI[]> | undefined;

  // Helper to check if field is filled
  const hasField = (value: string | number | undefined) => {
    if (typeof value === 'number') return value > 0;
    return !!value;
  };

  const formatPrice = () => {
    if (!hasField(data.price) && !hasField(data.warm_rent)) {
      return { main: '$12,450,000', period: '' }; // Example placeholder
    }
    
    if (data.transaction_type === 'rent') {
      const warmRent = data.warm_rent || data.cold_rent || 0;
      return {
        main: warmRent > 0 ? `€${warmRent.toLocaleString()}` : '€?',
        period: '/Monat'
      };
    }
    return {
      main: data.price > 0 ? `€${data.price.toLocaleString()}` : '€?',
      period: ''
    };
  };

  const activeFeatures = Object.entries(data.features)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const price = formatPrice();
  const hasImages = data.media_ids && data.media_ids.length > 0;

  // Title: use filled data or example
  const titlePreview = hasField(data.title)
    ? data.title
    : hasField(data.rooms) && hasField(data.city)
    ? `${data.rooms}-Zimmer ${data.property_type === 'apartment' ? 'Wohnung' : 'Haus'} in ${data.city}`
    : 'The Glass Pavilion'; // Example placeholder

  // Subtitle: use filled data or example
  const locationPreview = hasField(data.city)
    ? [data.street, data.house_number].filter(Boolean).join(' ') +
      (data.street ? ', ' : '') +
      [data.postal_code, data.city, data.district].filter(Boolean).join(' ')
    : '1242 Overlook Drive, Aspen, CO'; // Example placeholder

  // Stats: use filled or example
  const roomsDisplay = hasField(data.rooms) ? data.rooms : 5;
  const areaDisplay = hasField(data.living_area) ? data.living_area : '8,500';
  const bedsDisplay = hasField(data.bedrooms) ? data.bedrooms : 5;
  const bathsDisplay = hasField(data.bathrooms) ? data.bathrooms : '6.0';

  // POI config for proximity display
  const poiConfig = [
    { key: 'hospital', label: 'Hospital', icon: <Hospital className="w-3 h-3 text-red-500" /> },
    { key: 'doctor', label: 'Doctor', icon: <Hospital className="w-3 h-3 text-blue-400" /> },
    { key: 'pharmacy', label: 'Pharmacy', icon: <span className="material-symbols-outlined text-green-500 text-xs">medication</span> },
    { key: 'primary_school', label: 'School', icon: <School className="w-3 h-3 text-blue-500" /> },
    { key: 'kindergarten', label: 'Kindergarten', icon: <School className="w-3 h-3 text-pink-400" /> },
    { key: 'supermarket', label: 'Supermarket', icon: <ShoppingBag className="w-3 h-3 text-orange-500" /> },
    { key: 'public_transport', label: 'Transit', icon: <Train className="w-3 h-3 text-purple-500" /> },
    { key: 'park', label: 'Park', icon: <Trees className="w-3 h-3 text-green-600" /> },
    { key: 'gym', label: 'Gym', icon: <Bike className="w-3 h-3 text-indigo-500" /> },
    { key: 'restaurant', label: 'Restaurant', icon: <span className="material-symbols-outlined text-amber-600 text-xs">restaurant</span> },
    { key: 'cafe', label: 'Café', icon: <span className="material-symbols-outlined text-amber-500 text-xs">local_cafe</span> },
  ];

  const hasProximityData = proximity && Object.keys(proximity).some(k => proximity[k]?.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#006c4d] animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-[#006c4d] font-bold">
            Live Portal Preview
          </span>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-white rounded shadow-sm hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-sm text-[#1d2832]">laptop</span>
          </button>
          <button className="p-2 bg-white/50 rounded opacity-50">
            <span className="material-symbols-outlined text-sm text-[#1d2832]">smartphone</span>
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 bg-white rounded-xl shadow-xl overflow-hidden flex flex-col border border-slate-200/50">
        {/* Hero Section */}
        <div className="relative h-56 w-full bg-gradient-to-br from-slate-100 to-slate-200">
          {hasImages ? (
            <img src={data.media_ids[0]} alt="Property" className="w-full h-full object-cover" />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
              alt="Luxury property example"
              className="w-full h-full object-cover"
            />
          )}
          {/* Price Glass Panel */}
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-sm">
            <span className="font-serif font-bold text-lg text-[#1d2832]">
              {price.main}
            </span>
            <span className="text-sm text-slate-600">{price.period}</span>
          </div>
          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Status + Title */}
          <div className="absolute bottom-3 left-4">
            <span className="text-white/70 text-[10px] uppercase tracking-widest block mb-0.5">
              {hasField(data.transaction_type)
                ? (data.transaction_type === 'rent' ? 'Miete' : 'Kauf')
                : 'Active Listing'}
            </span>
            <h2 className="text-white font-serif text-2xl">{titlePreview}</h2>
          </div>
        </div>

        {/* Editorial Content Grid */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Key Facts Row */}
          <div className="flex justify-between border-b border-slate-200/50 pb-4">
            <div className="text-center">
              <span className="block font-serif text-xl text-[#1d2832]">{roomsDisplay}</span>
              <span className="block text-[10px] uppercase tracking-tight text-slate-500">Zimmer</span>
            </div>
            <div className="text-center">
              <span className="block font-serif text-xl text-[#1d2832]">{areaDisplay}</span>
              <span className="block text-[10px] uppercase tracking-tight text-slate-500">
                {hasField(data.living_area) ? 'm²' : 'SQ FT'}
              </span>
            </div>
            <div className="text-center">
              <span className="block font-serif text-xl text-[#1d2832]">{bedsDisplay}</span>
              <span className="block text-[10px] uppercase tracking-tight text-slate-500">Schlafz.</span>
            </div>
            <div className="text-center">
              <span className="block font-serif text-xl text-[#1d2832]">{bathsDisplay}</span>
              <span className="block text-[10px] uppercase tracking-tight text-slate-500">Bad</span>
            </div>
          </div>

          {/* Asymmetric Layout: Title + Description */}
          <div className="flex gap-6 items-start">
            <div className="w-1/3">
              <h3 className="font-serif text-lg text-[#1d2832] leading-snug">
                {hasField(data.city) ? data.city : 'Aspen'}
              </h3>
            </div>
            <div className="w-2/3">
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {hasField(data.description)
                  ? data.description
                  : "Situated on a pristine 2.4-acre lot in Aspen's most exclusive enclave, this architectural marvel redefines mountain luxury. Designed for seamless indoor-outdoor living, the residence features floor-to-ceiling glass that frames breathtaking panoramic views."
                }
              </p>
            </div>
          </div>

          {/* Proximity Section */}
          {hasProximityData && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#006c4d] text-sm">location_on</span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nearby</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {poiConfig.map(({ key, label, icon }) => {
                  const items = proximity?.[key];
                  if (!items || items.length === 0) return null;
                  const item = items[0];
                  return (
                    <div key={key} className="flex items-center gap-2">
                      {icon}
                      <span className="text-xs text-slate-600">
                        {label} · {item.walking_minutes} min walk
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photo Bento Grid */}
          {hasImages && data.media_ids.length > 1 ? (
            <div className="grid grid-cols-2 gap-3 h-36">
              <div className="bg-slate-100 rounded overflow-hidden">
                <img src={data.media_ids[1]} alt="Interior" className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-rows-2 gap-3">
                <div className="bg-slate-100 rounded overflow-hidden">
                  {data.media_ids[2] && (
                    <img src={data.media_ids[2]} alt="Detail" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="bg-slate-100 rounded overflow-hidden flex items-center justify-center relative">
                  {data.media_ids.length > 3 && (
                    <>
                      <img
                        src={data.media_ids[3]}
                        alt="More"
                        className="w-full h-full object-cover opacity-40 blur-[2px]"
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                        +{data.media_ids.length - 3} Fotos
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 h-36">
              <div className="bg-slate-100 rounded overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80"
                  alt="Interior example"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-rows-2 gap-3">
                <div className="bg-slate-100 rounded overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&q=80"
                    alt="Bathroom example"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-slate-100 rounded overflow-hidden flex items-center justify-center relative">
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-6f8dc5e4c4a1?w=400&q=80"
                    alt="More example"
                    className="w-full h-full object-cover opacity-40 blur-[2px]"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                    +14 Fotos
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2 pt-3">
            {activeFeatures.length > 0 ? (
              <>
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
              </>
            ) : (
              <>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Smart Home OS
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Geothermal HVAC
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Tesla Powerwall
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
