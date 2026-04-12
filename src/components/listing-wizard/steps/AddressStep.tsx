'use client';

import { useState, useEffect } from 'react';
import { Loader2, MapPin, Building, School, ShoppingBag, Train, Trees, Bike, Hospital } from 'lucide-react';
import type { ListingData } from '../ListingWizard';

interface ProximityPOI {
  name: string;
  distance_meters: number;
  walking_minutes: number;
  type?: string;
}

interface AddressStepProps {
  data: ListingData;
  updateData: (data: Partial<ListingData>) => void;
  onNext: () => void;
}

export function AddressStep({ data, updateData, onNext }: AddressStepProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  const canProceed = data.latitude && data.longitude && data.city;

  const geocodeAddress = async () => {
    if (!data.city || data.city.length < 2) return;
    setIsGeocoding(true);
    try {
      const res = await fetch('/api/listings/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street: data.street,
          house_number: data.house_number,
          postal_code: data.postal_code,
          city: data.city,
          country: data.country || 'Germany',
        }),
      });
      if (res.ok) {
        const result = await res.json();
        updateData({
          latitude: result.latitude,
          longitude: result.longitude,
          proximity_data: result.proximity_data,
        });
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Auto-geocode when city is filled
  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.city && data.city.length > 2 && !data.latitude) {
        geocodeAddress();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [data.city, data.street, data.postal_code]);

  const proximity = data.proximity_data as Record<string, ProximityPOI[]> | undefined;

  // POI display configuration
  const poiConfig = [
    { key: 'hospital', label: 'Hospital', icon: <Hospital className="w-4 h-4 text-red-500" />, showName: true },
    { key: 'doctor', label: 'Doctor', icon: <Hospital className="w-4 h-4 text-blue-400" />, showName: false },
    { key: 'pharmacy', label: 'Pharmacy', icon: <span className="material-symbols-outlined text-green-500 text-base">medication</span>, showName: false },
    { key: 'primary_school', label: 'School', icon: <School className="w-4 h-4 text-blue-500" />, showName: false },
    { key: 'secondary_school', label: 'High School', icon: <School className="w-4 h-4 text-indigo-500" />, showName: false },
    { key: 'kindergarten', label: 'Kindergarten', icon: <School className="w-4 h-4 text-pink-400" />, showName: false },
    { key: 'supermarket', label: 'Supermarket', icon: <ShoppingBag className="w-4 h-4 text-orange-500" />, showName: true },
    { key: 'public_transport', label: 'Transit', icon: <Train className="w-4 h-4 text-purple-500" />, showName: false },
    { key: 'park', label: 'Park', icon: <Trees className="w-4 h-4 text-green-600" />, showName: false },
    { key: 'gym', label: 'Gym', icon: <Bike className="w-4 h-4 text-indigo-500" />, showName: false },
    { key: 'restaurant', label: 'Restaurant', icon: <span className="material-symbols-outlined text-amber-600 text-base">restaurant</span>, showName: false },
    { key: 'cafe', label: 'Café', icon: <span className="material-symbols-outlined text-amber-500 text-base">local_cafe</span>, showName: false },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-gray-900">Address & Auto-Enrichment</h2>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Auto-filled
            </span>
          </div>
          <p className="text-gray-600">
            Enter the property address. We'll automatically fetch nearby POIs from OpenStreetMap.
          </p>
        </div>
      </div>

      {/* Address Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={data.street}
              onChange={(e) => updateData({ street: e.target.value })}
              placeholder="Musterstraße"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="text"
              value={data.house_number}
              onChange={(e) => updateData({ house_number: e.target.value })}
              placeholder="123"
              className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
          <input
            type="text"
            value={data.postal_code}
            onChange={(e) => updateData({ postal_code: e.target.value })}
            placeholder="10115"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
            placeholder="Berlin"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
          <input
            type="text"
            value={data.district}
            onChange={(e) => updateData({ district: e.target.value })}
            placeholder="Mitte"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input
            type="text"
            value={data.country}
            onChange={(e) => updateData({ country: e.target.value })}
            placeholder="Deutschland"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Geocoding Status */}
      {isGeocoding && (
        <div className="flex items-center gap-2 text-indigo-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Looking up address and nearby amenities...</span>
        </div>
      )}

      {/* Enrichment Results */}
      {data.latitude && data.proximity_data && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-800">
              Address enriched successfully
            </span>
          </div>

          {/* POI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {poiConfig.map(({ key, label, icon, showName }) => {
              const items = proximity?.[key];
              if (!items || items.length === 0) return null;
              const item = items[0];
              return (
                <div key={key} className="flex items-center gap-2">
                  {icon}
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">{label}:</span>{' '}
                    <span className="text-gray-600">
                      {showName && item.name ? `${item.name} · ` : ''}
                      {item.walking_minutes} min walk
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Preview */}
          <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 h-40 bg-gray-100">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude! - 0.01}%2C${data.latitude! - 0.005}%2C${data.longitude! + 0.01}%2C${data.latitude! + 0.005}&layer=mapnik&marker=${data.latitude}%2C${data.longitude}`}
              className="w-full h-full border-0"
              title="Map preview"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Basics
        </button>
      </div>
    </div>
  );
}
