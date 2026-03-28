'use client';

import { useState } from 'react';
import { Sofa, Bed, UtensilsCrossed, Bath, BookOpen } from 'lucide-react';

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  dimensions: { width: number; height: number; depth: number };
  color: string;
  icon: string;
  modelPath?: string;
  useGLTF?: boolean;
}

export const FURNITURE_CATEGORIES = [
  { id: 'living', name: 'Living Room', icon: Sofa },
  { id: 'bedroom', name: 'Bedroom', icon: Bed },
  { id: 'kitchen', name: 'Kitchen', icon: UtensilsCrossed },
  { id: 'bathroom', name: 'Bathroom', icon: Bath },
  { id: 'office', name: 'Office', icon: BookOpen },
];

export const GLTF_MODEL_MAP: Record<string, string> = {
  'sofa': '/models/furniture/loungeSofa.glb',
  'coffee-table': '/models/furniture/tableCoffee.glb',
  'tv-stand': '/models/furniture/cabinetTelevision.glb',
  'armchair': '/models/furniture/loungeChair.glb',
  'bed': '/models/furniture/bedDouble.glb',
  'nightstand': '/models/furniture/sideTable.glb',
  'wardrobe': '/models/furniture/bookcaseClosed.glb',
  'dresser': '/models/furniture/cabinetBedDrawer.glb',
  'dining-table': '/models/furniture/table.glb',
  'chair': '/models/furniture/chairCushion.glb',
  'counter': '/models/furniture/kitchenBar.glb',
  'refrigerator': '/models/furniture/kitchenFridge.glb',
  'toilet': '/models/furniture/toilet.glb',
  'sink': '/models/furniture/bathroomSink.glb',
  'bathtub': '/models/furniture/bathtub.glb',
  'shower': '/models/furniture/shower.glb',
  'desk': '/models/furniture/desk.glb',
  'office-chair': '/models/furniture/chairDesk.glb',
  'bookshelf': '/models/furniture/bookcaseOpen.glb',
};

export const FURNITURE_LIBRARY: FurnitureItem[] = [
  { id: 'sofa', name: 'Sofa', category: 'living', dimensions: { width: 2, height: 0.8, depth: 0.9 }, color: '#5d4037', icon: 'sofa', modelPath: GLTF_MODEL_MAP['sofa'], useGLTF: true },
  { id: 'coffee-table', name: 'Coffee Table', category: 'living', dimensions: { width: 1.2, height: 0.4, depth: 0.6 }, color: '#8d6e63', icon: 'coffee', modelPath: GLTF_MODEL_MAP['coffee-table'], useGLTF: true },
  { id: 'tv-stand', name: 'TV Stand', category: 'living', dimensions: { width: 1.5, height: 0.5, depth: 0.4 }, color: '#37474f', icon: 'tv', modelPath: GLTF_MODEL_MAP['tv-stand'], useGLTF: true },
  { id: 'armchair', name: 'Armchair', category: 'living', dimensions: { width: 0.8, height: 0.9, depth: 0.8 }, color: '#6d4c41', icon: 'armchair', modelPath: GLTF_MODEL_MAP['armchair'], useGLTF: true },
  { id: 'bed', name: 'Bed', category: 'bedroom', dimensions: { width: 2, height: 0.6, depth: 1.8 }, color: '#7986cb', icon: 'bed', modelPath: GLTF_MODEL_MAP['bed'], useGLTF: true },
  { id: 'nightstand', name: 'Nightstand', category: 'bedroom', dimensions: { width: 0.5, height: 0.5, depth: 0.5 }, color: '#8d6e63', icon: 'nightstand', modelPath: GLTF_MODEL_MAP['nightstand'], useGLTF: true },
  { id: 'wardrobe', name: 'Wardrobe', category: 'bedroom', dimensions: { width: 1.8, height: 2.2, depth: 0.6 }, color: '#5d4037', icon: 'wardrobe', modelPath: GLTF_MODEL_MAP['wardrobe'], useGLTF: true },
  { id: 'dresser', name: 'Dresser', category: 'bedroom', dimensions: { width: 1.2, height: 0.8, depth: 0.5 }, color: '#6d4c41', icon: 'dresser', modelPath: GLTF_MODEL_MAP['dresser'], useGLTF: true },
  { id: 'dining-table', name: 'Dining Table', category: 'kitchen', dimensions: { width: 1.8, height: 0.75, depth: 1 }, color: '#8d6e63', icon: 'table', modelPath: GLTF_MODEL_MAP['dining-table'], useGLTF: true },
  { id: 'chair', name: 'Chair', category: 'kitchen', dimensions: { width: 0.45, height: 0.9, depth: 0.45 }, color: '#a1887f', icon: 'chair', modelPath: GLTF_MODEL_MAP['chair'], useGLTF: true },
  { id: 'counter', name: 'Counter', category: 'kitchen', dimensions: { width: 2, height: 0.9, depth: 0.6 }, color: '#e0e0e0', icon: 'counter', modelPath: GLTF_MODEL_MAP['counter'], useGLTF: true },
  { id: 'refrigerator', name: 'Refrigerator', category: 'kitchen', dimensions: { width: 0.7, height: 1.8, depth: 0.7 }, color: '#cfd8dc', icon: 'fridge', modelPath: GLTF_MODEL_MAP['refrigerator'], useGLTF: true },
  { id: 'toilet', name: 'Toilet', category: 'bathroom', dimensions: { width: 0.5, height: 0.5, depth: 0.65 }, color: '#f5f5f5', icon: 'toilet', modelPath: GLTF_MODEL_MAP['toilet'], useGLTF: true },
  { id: 'sink', name: 'Sink', category: 'bathroom', dimensions: { width: 0.6, height: 0.3, depth: 0.5 }, color: '#f5f5f5', icon: 'sink', modelPath: GLTF_MODEL_MAP['sink'], useGLTF: true },
  { id: 'bathtub', name: 'Bathtub', category: 'bathroom', dimensions: { width: 1.7, height: 0.6, depth: 0.75 }, color: '#e0e0e0', icon: 'bathtub', modelPath: GLTF_MODEL_MAP['bathtub'], useGLTF: true },
  { id: 'shower', name: 'Shower', category: 'bathroom', dimensions: { width: 1, height: 0.1, depth: 1 }, color: '#b2ebf2', icon: 'shower', modelPath: GLTF_MODEL_MAP['shower'], useGLTF: true },
  { id: 'desk', name: 'Desk', category: 'office', dimensions: { width: 1.5, height: 0.75, depth: 0.8 }, color: '#8d6e63', icon: 'briefcase', modelPath: GLTF_MODEL_MAP['desk'], useGLTF: true },
  { id: 'office-chair', name: 'Office Chair', category: 'office', dimensions: { width: 0.5, height: 1, depth: 0.5 }, color: '#37474f', icon: 'chair', modelPath: GLTF_MODEL_MAP['office-chair'], useGLTF: true },
  { id: 'bookshelf', name: 'Bookshelf', category: 'office', dimensions: { width: 1, height: 1.8, depth: 0.35 }, color: '#5d4037', icon: 'bookshelf', modelPath: GLTF_MODEL_MAP['bookshelf'], useGLTF: true },
];

interface FurnitureLibraryProps {
  selectedFurniture: FurnitureItem | null;
  onSelectFurniture: (item: FurnitureItem | null) => void;
  compact?: boolean;
}

export default function FurnitureLibrary({ selectedFurniture, onSelectFurniture, compact }: FurnitureLibraryProps) {
  const [activeCategory, setActiveCategory] = useState('living');
  const filteredItems = FURNITURE_LIBRARY.filter(item => item.category === activeCategory);

  if (compact) {
    return (
      <div className="flex gap-2 items-center overflow-x-auto pb-2">
        {FURNITURE_LIBRARY.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectFurniture(selectedFurniture?.id === item.id ? null : item)}
            className={`flex-shrink-0 w-20 p-2 rounded-lg border-2 transition-all ${
              selectedFurniture?.id === item.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-transparent bg-slate-100 hover:border-slate-300'
            }`}
          >
            <div
              className="w-12 h-12 mx-auto rounded-lg mb-1 flex items-center justify-center"
              style={{ backgroundColor: item.color }}
            >
              <span className="text-white text-xs font-bold">
                {item.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-medium text-center truncate">{item.name}</p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-72 bg-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white font-semibold text-lg">Furniture Library</h2>
        <p className="text-gray-400 text-sm mt-1">Click to select, then click to place</p>
      </div>
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-700">
        {FURNITURE_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.name}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => onSelectFurniture(selectedFurniture?.id === item.id ? null : item)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedFurniture?.id === item.id ? 'border-indigo-500 bg-indigo-600/20' : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="w-10 h-10 mx-auto rounded mb-2 flex items-center justify-center" style={{ backgroundColor: item.color }}>
                <span className="text-white text-xs font-medium">{item.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <p className="text-white text-xs text-center truncate">{item.name}</p>
              <p className="text-gray-400 text-[10px] text-center mt-0.5">{item.dimensions.width}m × {item.dimensions.depth}m</p>
            </button>
          ))}
        </div>
      </div>
      {selectedFurniture && (
        <div className="p-3 bg-indigo-600/20 border-t border-indigo-500">
          <p className="text-indigo-300 text-sm">✓ {selectedFurniture.name} selected</p>
          <p className="text-gray-400 text-xs mt-1">Click on the floor plan to place</p>
        </div>
      )}
    </div>
  );
}
