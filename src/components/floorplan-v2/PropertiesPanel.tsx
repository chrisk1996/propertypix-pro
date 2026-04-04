'use client';

import { useFloorPlanStore } from '@/store/floorplan/store';

export function PropertiesPanel() {
  const { walls, rooms, doors, windows, furniture, selectedId, selectedType, updateWall, updateRoom, updateFurniture, deleteWall, deleteRoom, deleteFurniture } =
    useFloorPlanStore();

  if (!selectedId || !selectedType) {
    return (
      <div className="w-72 bg-white border-l border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-600 mb-4">Properties</h3>
        <p className="text-sm text-slate-400">Select an element to inspect</p>
      </div>
    );
  }

  const renderProperties = () => {
    if (selectedType === 'wall') {
      const wall = walls.find((w) => w.id === selectedId);
      if (!wall) return null;
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500">Thickness (m)</label>
            <input
              type="number"
              step="0.01"
              value={wall.thickness}
              onChange={(e) => updateWall(wall.id, { thickness: parseFloat(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Height (m)</label>
            <input
              type="number"
              step="0.1"
              value={wall.height}
              onChange={(e) => updateWall(wall.id, { height: parseFloat(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Type</label>
            <select
              value={wall.wallType}
              onChange={(e) => updateWall(wall.id, { wallType: e.target.value as 'exterior' | 'interior' })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            >
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
            </select>
          </div>
          <button
            onClick={() => deleteWall(wall.id)}
            className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Delete Wall
          </button>
        </div>
      );
    }

    if (selectedType === 'room') {
      const room = rooms.find((r) => r.id === selectedId);
      if (!room) return null;
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500">Name</label>
            <input
              type="text"
              value={room.name || ''}
              onChange={(e) => updateRoom(room.id, { name: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Type</label>
            <select
              value={room.roomType}
              onChange={(e) => updateRoom(room.id, { roomType: e.target.value as any })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            >
              <option value="living">Living Room</option>
              <option value="bedroom">Bedroom</option>
              <option value="kitchen">Kitchen</option>
              <option value="bathroom">Bathroom</option>
              <option value="dining">Dining</option>
              <option value="office">Office</option>
              <option value="storage">Storage</option>
              <option value="hallway">Hallway</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            onClick={() => deleteRoom(room.id)}
            className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Delete Room
          </button>
        </div>
      );
    }

    if (selectedType === 'furniture') {
      const furn = furniture.find((f) => f.id === selectedId);
      if (!furn) return null;
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500">Rotation (°)</label>
            <input
              type="number"
              step="15"
              value={furn.rotation}
              onChange={(e) => updateFurniture(furn.id, { rotation: parseFloat(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Scale</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5"
              value={furn.scale}
              onChange={(e) => updateFurniture(furn.id, { scale: parseFloat(e.target.value) })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <button
            onClick={() => updateFurniture(furn.id, { rotation: (furn.rotation + 90) % 360 })}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            Rotate 90°
          </button>
          <button
            onClick={() => deleteFurniture(furn.id)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Delete Furniture
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-72 bg-white border-l border-slate-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-slate-600 mb-4">
        {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Properties
      </h3>
      {renderProperties()}
    </div>
  );
}
