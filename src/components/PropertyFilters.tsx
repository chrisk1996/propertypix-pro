'use client';

import { PropertyStatus } from '@/types/property';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';

interface PropertyFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: PropertyStatus | 'all';
  onStatusChange: (status: PropertyStatus | 'all') => void;
  priceSort: 'asc' | 'desc' | null;
  onPriceSortChange: (sort: 'asc' | 'desc' | null) => void;
  locationFilter: string;
  onLocationChange: (location: string) => void;
  locations: string[];
}

export function PropertyFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priceSort,
  onPriceSortChange,
  locationFilter,
  onLocationChange,
  locations,
}: PropertyFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by address..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Location Filter */}
        <div className="relative min-w-[160px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white text-sm"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as PropertyStatus | 'all')}
          className="min-w-[140px] px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
        </select>

        {/* Price Sort */}
        <select
          value={priceSort || 'default'}
          onChange={(e) => {
            const val = e.target.value;
            onPriceSortChange(val === 'default' ? null : val as 'asc' | 'desc');
          }}
          className="min-w-[140px] px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        >
          <option value="default">Sort by Price</option>
          <option value="asc">Price: Low to High</option>
          <option value="desc">Price: High to Low</option>
        </select>

        {/* Filter indicator */}
        <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm">Filters</span>
        </div>
      </div>
    </div>
  );
}
