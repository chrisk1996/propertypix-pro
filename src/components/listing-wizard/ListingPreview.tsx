'use client';

import type { ListingData } from './ListingWizard';
import { MapPin, Bed, Bath, Square, Calendar, Building, Home, Car, Trees, Wifi } from 'lucide-react';

interface ListingPreviewProps {
  data: ListingData;
}

export function ListingPreview({ data }: ListingPreviewProps) {
  const formatPrice = () => {
    if (data.transaction_type === 'rent') {
      const warmRent = data.warm_rent || data.cold_rent || 0;
      return {
        main: warmRent > 0 ? `€${warmRent.toLocaleString()}` : '€0',
        sub: data.cold_rent ? `Kalt: €${data.cold_rent.toLocaleString()}` : null,
        period: '/Monat'
      };
    }
    return {
      main: data.price > 0 ? `€${data.price.toLocaleString()}` : '€0',
      sub: data.hoa_fees ? `Hausgeld: €${data.hoa_fees.toLocaleString()}/mo` : null,
      period: data.transaction_type === 'sale' ? ' Kaufpreis' : ''
    };
  };

  const activeFeatures = Object.entries(data.features)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const price = formatPrice();

  // Simulated property image placeholder
  const hasImages = data.media_ids && data.media_ids.length > 0;

  return (
    <div className="space-y-0">
      {/* Main Listing Card - Portal Style */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        {/* Hero Image Area */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200">
          {hasImages ? (
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src={data.media_ids[0]} 
                alt="Property" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                <Home className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">No photos uploaded</p>
              <p className="text-xs text-slate-400 mt-1">Upload images to preview</p>
            </div>
          )}
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-semibold text-slate-700 rounded-md shadow-sm">
              {data.property_type ? (data.property_type.charAt(0).toUpperCase() + data.property_type.slice(1)) : 'Property'}
            </span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-md shadow-sm ${
              data.transaction_type === 'rent' 
                ? 'bg-emerald-500/90 text-white' 
                : 'bg-blue-600/90 text-white'
            }`}>
              {data.transaction_type === 'rent' ? 'Miete' : 'Kauf'}
            </span>
          </div>

          {/* Photo Count Badge */}
          {hasImages && (
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur text-white text-xs rounded-md">
              📸 {data.media_ids.length} Fotos
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Price Section */}
          <div className="mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{price.main}</span>
              <span className="text-sm text-slate-500">{price.period}</span>
            </div>
            {price.sub && (
              <p className="text-xs text-slate-500 mt-0.5">{price.sub}</p>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-slate-900 mb-2 line-clamp-2">
            {data.title || (
              <span className="text-slate-400 font-normal italic">
                {data.rooms && data.living_area 
                  ? `${data.rooms}-Zimmer-${data.property_type === 'apartment' ? 'Wohnung' : 'Haus'} in ${data.city || '...'}` 
                  : 'Titel wird hier angezeigt...'}
              </span>
            )}
          </h3>

          {/* Address */}
          <div className="flex items-start gap-1.5 text-sm text-slate-600 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
            <span className="line-clamp-2">
              {data.city 
                ? [
                    [data.street, data.house_number].filter(Boolean).join(' '),
                    [data.postal_code, data.city].filter(Boolean).join(' '),
                    data.district
                  ].filter(Boolean).join(', ')
                : 'Adresse eingeben...'
              }
            </span>
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-4 gap-2 py-3 border-t border-slate-100">
            <div className="text-center px-1">
              <Square className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-semibold text-slate-900">{data.living_area || '—'}</p>
              <p className="text-[10px] text-slate-500">m²</p>
            </div>
            <div className="text-center px-1">
              <Bed className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-semibold text-slate-900">{data.rooms || '—'}</p>
              <p className="text-[10px] text-slate-500">Zi.</p>
            </div>
            <div className="text-center px-1">
              <Bath className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-semibold text-slate-900">{data.bathrooms || '—'}</p>
              <p className="text-[10px] text-slate-500">Bad</p>
            </div>
            <div className="text-center px-1">
              <Calendar className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-semibold text-slate-900">{data.construction_year || '—'}</p>
              <p className="text-[10px] text-slate-500">Bauj.</p>
            </div>
          </div>

          {/* Features Chips */}
          {activeFeatures.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
              {activeFeatures.slice(0, 4).map((feature) => (
                <span 
                  key={feature}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md capitalize"
                >
                  {feature === 'parking' && <Car className="w-3 h-3" />}
                  {feature === 'balcony' && <Building className="w-3 h-3" />}
                  {feature === 'garden' && <Trees className="w-3 h-3" />}
                  {feature === 'wifi' && <Wifi className="w-3 h-3" />}
                  {feature.replace(/_/g, ' ')}
                </span>
              ))}
              {activeFeatures.length > 4 && (
                <span className="text-xs text-slate-400">+{activeFeatures.length - 4} weitere</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description Preview Card */}
      {data.description && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Objektbeschreibung
          </h4>
          <p className="text-sm text-slate-600 line-clamp-4">
            {data.description}
          </p>
        </div>
      )}

      {/* Location & POI Card */}
      {data.proximity_data && Object.keys(data.proximity_data).length > 0 && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Lage & Infrastruktur
          </h4>
          <div className="space-y-2">
            {(Object.entries(data.proximity_data) as [string, { walking_minutes?: number; name?: string }[]][])
              .slice(0, 5)
              .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 capitalize">
                    {key === 'hospital' && '🏥 Krankenhaus'}
                    {key === 'primary_school' && '🏫 Grundschule'}
                    {key === 'supermarket' && '🛒 Supermarkt'}
                    {key === 'public_transport' && '🚇 ÖPNV'}
                    {key === 'park' && '🌳 Park'}
                    {!['hospital', 'primary_school', 'supermarket', 'public_transport', 'park'].includes(key) && key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-medium text-slate-900">
                    {value?.[0]?.walking_minutes ? `${value[0].walking_minutes} Min.` : '—'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Energy Rating */}
      {data.energy_rating && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Energieausweis
          </h4>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
              ['A', 'A+', 'B'].includes(data.energy_rating) ? 'bg-green-100 text-green-700' :
              ['C', 'D'].includes(data.energy_rating) ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {data.energy_rating}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Energieeffizienzklasse</p>
              <p className="text-xs text-slate-500">
                {data.heating_type || 'Heizungstyp nicht angegeben'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
