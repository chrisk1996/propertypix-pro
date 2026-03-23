'use client';

import { Property } from '@/types/property';
import { StatusBadge } from './StatusBadge';
import { MapPin, Bed, Bath, Square, Upload, Box } from 'lucide-react';
import Image from 'next/image';

interface PropertyCardProps {
  property: Property;
  onUpload?: (id: string) => void;
  onView3D?: (id: string) => void;
}

export function PropertyCard({ property, onUpload, onView3D }: PropertyCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative h-48 bg-gray-100">
        <Image
          src={property.images[0] || '/placeholder-house.jpg'}
          alt={property.address}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 right-3">
          <StatusBadge status={property.status} />
        </div>
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5">
          <span className="font-semibold text-gray-900">{formatPrice(property.price)}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
          {property.address}
        </h3>
        
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{property.location || 'Unknown location'}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.sqft !== undefined && (
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              <span>{property.sqft} m²</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onUpload?.(property.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload Images
          </button>
          <button
            onClick={() => onView3D?.(property.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            <Box className="w-4 h-4" />
            View 3D
          </button>
        </div>
      </div>
    </div>
  );
}
