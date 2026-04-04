'use client';

import { useFloorPlanStore } from '@/store/floorplan/store';

const FURNITURE_ITEMS = [
  { id: 'sofa', name: 'Sofa', category: 'living', width: 2, depth: 1 },
  { id: 'bed-double', name: 'Double Bed', category: 'bedroom', width: 2, depth: 2 },
  { id: 'dining-table', name: 'Dining Table', category: 'dining', width: 1.5, depth: 1 },
  { id: 'desk', name: 'Desk', category: 'office', width: 1.2, depth: 0.6 },
  { id: 'chair', name: 'Chair', category: 'living', width: 0.5, depth: 0.5 },
  { id: 'kitchen-counter', name: 'Kitchen Counter', category: 'kitchen', width: 2, depth: 0.6 },
  { id: 'toilet', name: 'Toilet', category: 'bathroom', width: 0.5, depth: 0.7 },
  { id: 'bathtub', name: 'Bathtub', category: 'bathroom', width: 1.7, depth: 0.8 },
];

export function FurnitureLibraryCompact() {
  const { activeTool, setTool, addFurniture } = useFloorPlanStore();

  const handleDragStart = (itemId: string) => {
    setTool('furniture');
  };

  const handleClick = (itemId: string) => {
    setTool('furniture');
  };

  return (
    <div className="h-full">
      <h4 className="text-xs font-semibold text-slate-500 mb-2">FURNITURE</h4>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FURNITURE_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center gap-1 ${
              activeTool === 'furniture'
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            title={item.name}
          >
            <span className="material-symbols-outlined text-slate-600">
              {item.category === 'living' && 'weekend'}
              {item.category === 'bedroom' && 'bed'}
              {item.category === 'dining' && 'table_restaurant'}
              {item.category === 'office' && 'desk'}
              {item.category === 'kitchen' && 'kitchen'}
              {item.category === 'bathroom' && 'bathtub'}
            </span>
            <span className="text-xs text-slate-600">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
