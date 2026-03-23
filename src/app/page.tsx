'use client';

import { useState, useMemo } from 'react';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyFilters } from '@/components/PropertyFilters';
import { UploadModal } from '@/components/UploadModal';
import { Header } from '@/components/Header';
import { Property, PropertyStatus } from '@/types/property';
import { mockProperties } from '@/lib/api';
import { Grid3X3, List, Building2, TrendingUp, Clock, DollarSign } from 'lucide-react';

type ViewMode = 'grid' | 'list';

export default function Home() {
  const [properties] = useState<Property[]>(mockProperties);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'all'>('all');
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | null>(null);
  const [locationFilter, setLocationFilter] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  const locations = useMemo(() => {
    const locs = new Set(properties.map((p) => p.location).filter((l): l is string => typeof l === 'string'));
    return Array.from(locs);
  }, [properties]);

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (locationFilter !== 'all') {
      result = result.filter((p) => p.location === locationFilter);
    }

    if (priceSort) {
      result.sort((a, b) =>
        priceSort === 'asc' ? a.price - b.price : b.price - a.price
      );
    }

    return result;
  }, [properties, searchQuery, statusFilter, priceSort, locationFilter]);

  const stats = {
    total: properties.length,
    active: properties.filter((p) => p.status === 'active').length,
    pending: properties.filter((p) => p.status === 'pending').length,
    sold: properties.filter((p) => p.status === 'sold').length,
    totalValue: properties.reduce((sum, p) => sum + p.price, 0),
  };

  const handleUpload = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setUploadModalOpen(true);
  };

  const handleView3D = (propertyId: string) => {
    // Navigate to 3D viewer
    window.location.href = `/viewer/${propertyId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center text-gray-500 mb-2">
              <Building2 className="w-4 h-4 mr-2" />
              <span className="text-sm">Total Properties</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center text-green-600 mb-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="text-sm">Active</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.active}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center text-yellow-600 mb-2">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm">Pending</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center text-indigo-600 mb-2">
              <DollarSign className="w-4 h-4 mr-2" />
              <span className="text-sm">Total Value</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              €{(stats.totalValue / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>

        {/* Filters */}
        <PropertyFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priceSort={priceSort}
          onPriceSortChange={setPriceSort}
          locationFilter={locationFilter}
          onLocationChange={setLocationFilter}
          locations={locations}
        />

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredProperties.length} Properties
          </h2>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Property Grid/List */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-500">Try adjusting your filters or add a new property.</p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onUpload={handleUpload}
                onView3D={handleView3D}
              />
            ))}
          </div>
        )}
      </main>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setSelectedPropertyId('');
        }}
        propertyId={selectedPropertyId}
      />
    </div>
  );
}
