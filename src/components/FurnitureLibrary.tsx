'use client';

import { useState } from 'react';
import { Sofa, Bed, UtensilsCrossed, Bath, Armchair, Coffee, Tv, BookOpen } from 'lucide-react';

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  dimensions: { width: number; height: number; depth: number };
  color: string;
  icon: string;
}

export const FURNITURE_CATEGORIES = [
  { id: 'living', name: 'Living Room', icon: Sofa },
  { id: 'bedroom', name: 'Bedroom', icon: Bed },
  { id: 'kitchen', name: 'Kitchen', icon: UtensilsCrossed },
  { id: 'bathroom', name: 'Bathroom', icon: Bath },
  { id: 'office', name: 'Office', icon: BookOpen },
];

export const FURNITURE_LIBRARY: FurnitureItem[] = [
  // Living Room
  { id: 'sofa', name: 'Sofa', category: 'living', dimensions: { width: 2, height: 0.8, depth: 0.9 }, color: '#5d4037', icon: 'sofa' },
  { id: 'coffee-table', name: 'Coffee Table', category: 'living', dimensions: { width: 1.2, height: 0.4, depth: 0.6 }, color: '#8d6e63', icon: 'coffee' },
  { id: 'tv-stand', name: 'TV Stand', category: 'living', dimensions: { width: 1.5, height: 0.5, depth: 0.4 }, color: '#37474f', icon: 'tv' },
  { id: 'armchair', name: 'Armchair', category: 'living', dimensions: { width: 0.8, height: 0.9, depth: 0.8 }, color: '#6d4c41', icon: 'armchair' },
  
  // Bedroom
  { id: 'bed', name: 'Bed', category: 'bedroom', dimensions: { width: 2, height: 0.6, depth: 1.8 }, color: '#7986cb', icon: 'bed' },
  { id: 'nightstand', name: 'Nightstand', category: 'bedroom', dimensions: { width: 0.5, height: 0.5, depth: 0.5 }, color: '#8d6e63', icon: 'nightstand' },
  { id: 'wardrobe', name: 'Wardrobe', category: 'bedroom', dimensions: { width: 1.8, height: 2.2, depth: 0.6 }, color: '#5d4037', icon: 'wardrobe' },
  { id: 'dresser', name: 'Dresser', category: 'bedroom', dimensions: { width: 1.2, height: 0.8, depth: 0.5 }, color: '#6d4c41', icon: 'dresser' },
  
  // Kitchen
  { id: 'dining-table', name: 'Dining Table', category: 'kitchen', dimensions: { width: 1.8, height: 0.75, depth: 1 }, color: '#8d6e63', icon: 'table' },
  { id: 'chair', name: 'Chair', category: 'kitchen', dimensions: { width: 0.45, height: 0.9, depth: 0.45 }, color: '#a1887f', icon: 'chair' },
  { id: 'counter', name: 'Counter', category: 'kitchen', dimensions: { width: 2, height: 0.9, depth: 0.6 }, color: '#e0e0e0', icon: 'counter' },
  { id: 'refrigerator', name: 'Refrigerator', category: 'kitchen', dimensions: { width: 0.7, height: 1.8, depth: 0.7 }, color: '#cfd8dc', icon: 'fridge' },
  
  // Bathroom
  { id: 'toilet', name: 'Toilet', category: 'bathroom', dimensions: { width: 0.5, height: 0.5, depth: 0.65 }, color: '#f5f5f5', icon: 'toilet' },
  { id: 'sink', name: 'Sink', category: 'bathroom', dimensions: { width: 0.6, height: 0.3, depth: 0.5 }, color: '#f5f5f5', icon: 'sink' },
  { id: 'bathtub', name: 'Bathtub', category: 'bathroom', dimensions: { width: 1.7, height: 0.6, depth: 0.75 }, color: '#e0e0e0', icon: 'bathtub' },
  { id: 'shower', name: 'Shower', category: 'bathroom', dimensions: { width: 1, height: 0.1, depth: 1 }, color: '#b2ebf2', icon: 'shower' },
  
  // Office
  { id: 'desk', name: 'Desk', category: 'office', dimensions: { width: 1.5, height: 0.75, depth: 0.8 }, color: '#8d6e63', icon: 'briefcase' },
  { id: 'office-chair', name: 'Office Chair', category: 'office', dimensions: { width: 0.5, height: 1, depth: 0.5 }, color: '#37474f', icon: 'chair' },
  { id: 'bookshelf', name: 'Bookshelf', category: 'office', dimensions: { width: 1, height: 1.8, depth: 0.35 }, color: '#5d4037', icon: 'bookshelf' },
];

interface FurnitureLibraryProps {
  selectedFurniture: FurnitureItem | null;
  onSelectFurniture: (item: FurnitureItem | null) => void;
}

export default function FurnitureLibrary({ selectedFurniture, onSelectFurniture }: FurnitureLibraryProps) {
  const [activeCategory, setActiveCategory] = useState('living');
  
  const filteredItems = FURNITURE_LIBRARY.filter(item => item.category === activeCategory);
  
  return (
    <div className="w-72 bg-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white font-semibold text-lg">Furniture Library</h2>
        <p className="text-gray-400 text-sm mt-1">Click to select, then click to place</p>
      </div>
      
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-700">
        {FURNITURE_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.name}
            </button>
          );
        })}
      </div>
      
      {/* Furniture Items */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => onSelectFurniture(selectedFurniture?.id === item.id ? null : item)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedFurniture?.id === item.id
                  ? 'border-indigo-500 bg-indigo-600/20'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div
                className="w-10 h-10 mx-auto rounded mb-2 flex items-center justify-center"
                style={{ backgroundColor: item.color }}
              >
                <span className="text-white text-xs font-medium">
                  {item.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <p className="text-white text-xs text-center truncate">{item.name}</p>
              <p className="text-gray-400 text-[10px] text-center mt-0.5">
                {item.dimensions.width}m × {item.dimensions.depth}m
              </p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Selection Info */}
      {selectedFurniture && (
        <div className="p-3 bg-indigo-600/20 border-t border-indigo-500">
          <p className="text-indigo-300 text-sm">
            ✓ {selectedFurniture.name} selected
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Click on the floor plan to place
          </p>
        </div>
      )}
    </div>
  );
}
