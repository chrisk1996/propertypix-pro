'use client';
import { useState, useRef, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Text, Group } from 'react-konva';
import WallEditor from './WallEditor';
import RoomEditor from './RoomEditor';
import DoorWindowEditor from './DoorWindowEditor';

export type Tool = 'select' | 'wall' | 'room' | 'door' | 'window' | 'furniture' | 'pan';
export type WallType = 'exterior' | 'interior';

export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: WallType;
  thickness: number;
}

export interface RoomPolygon {
  id: string;
  name: string;
  type: string;
  points: number[];
}

export interface DoorData {
  id: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
}

export interface WindowData {
  id: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
}

interface FloorPlanCanvas2DProps {
  tool?: Tool;
  width?: number;
  height?: number;
  walls?: WallSegment[];
  rooms?: RoomPolygon[];
  doors?: DoorData[];
  windows?: WindowData[];
  onWallsChange?: (walls: WallSegment[]) => void;
  onRoomsChange?: (rooms: RoomPolygon[]) => void;
  onSelectionChange?: (id: string | null, type: 'wall' | 'room' | 'door' | 'window' | null) => void;
}

const GRID_SIZE = 20; // 20px = 10cm at 1:50 scale
const SNAP_THRESHOLD = 10;
const WALL_COLORS = { exterior: '#333333', interior: '#666666' };
const ROOM_COLORS: Record<string, string> = {
  living: 'rgba(129, 199, 132, 0.3)',
  kitchen: 'rgba(255, 183, 77, 0.3)',
  bedroom: 'rgba(100, 181, 246, 0.3)',
  bathroom: 'rgba(77, 208, 225, 0.3)',
  dining: 'rgba(240, 98, 146, 0.3)',
  office: 'rgba(186, 104, 200, 0.3)',
  default: 'rgba(189, 189, 189, 0.3)',
};

export default function FloorPlanCanvas2D({
  tool,
  width = 800,
  height = 600,
  walls = [],
  rooms = [],
  doors = [],
  windows = [],
  onWallsChange,
  onRoomsChange,
  onSelectionChange,
}: FloorPlanCanvas2DProps) {
  // Tool is now passed as prop
  const activeTool = tool ?? 'select';
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'wall' | 'room' | 'door' | 'window' | null>(null);
  
  const stageRef = useRef<any>(null);

  // Snap to grid
  const snapToGrid = useCallback((value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  // Get mouse position relative to stage
  const getPointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    return {
      x: snapToGrid((pos.x - position.x) / scale),
      y: snapToGrid((pos.y - position.y) / scale),
    };
  }, [scale, position, snapToGrid]);

  // Handle mouse down for drawing
  const handleMouseDown = useCallback((e: any) => {
    if (activeTool === 'select' || activeTool === 'pan') return;
    
    const pos = getPointerPosition();
    setIsDrawing(true);
    setDrawPoints([pos.x, pos.y]);
  }, [tool, getPointerPosition]);

  // Handle mouse move for drawing
  const handleMouseMove = useCallback((e: any) => {
    if (!isDrawing) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = getPointerPosition();
    setDrawPoints(prev => [...prev, pos.x, pos.y]);
  }, [isDrawing, getPointerPosition]);

  // Handle mouse up to finish drawing
  const handleMouseUp = useCallback((e: any) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (activeTool === 'wall' && drawPoints.length >= 4) {
      const newWall: WallSegment = {
        id: `wall-${Date.now()}`,
        x1: drawPoints[0],
        y1: drawPoints[1],
        x2: drawPoints[drawPoints.length - 2],
        y2: drawPoints[drawPoints.length - 1],
        type: 'interior',
        thickness: 15,
      };
      onWallsChange?.([...walls, newWall]);
    }
    
    if (activeTool === 'room' && drawPoints.length >= 6) {
      const newRoom: RoomPolygon = {
        id: `room-${Date.now()}`,
        name: `Room ${(rooms?.length || 0) + 1}`,
        type: 'living',
        points: drawPoints,
      };
      onRoomsChange?.([...rooms, newRoom]);
    }
    
    setDrawPoints([]);
  }, [isDrawing, tool, drawPoints, walls, rooms, onWallsChange, onRoomsChange]);

  // Handle selection
  const handleSelect = useCallback((id: string, type: 'wall' | 'room' | 'door' | 'window') => {
    if (tool !== 'select') return;
    setSelectedId(id);
    setSelectedType(type);
    onSelectionChange?.(id, type);
  }, [tool, onSelectionChange]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!selectedId || !selectedType) return;
    
    if (selectedType === 'wall') {
      onWallsChange?.(walls.filter(w => w.id !== selectedId));
    } else if (selectedType === 'room') {
      onRoomsChange?.(rooms.filter(r => r.id !== selectedId));
    }
    
    setSelectedId(null);
    setSelectedType(null);
    onSelectionChange?.(null, null);
  }, [selectedId, selectedType, walls, rooms, onWallsChange, onRoomsChange, onSelectionChange]);

  // Zoom with wheel
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const oldScale = scale;
    const pointer = stageRef.current.getPointerPosition();
    
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
    
    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, [scale, position]);

  // Pan
  const handleDragEnd = useCallback((e: any) => {
    if (tool !== 'pan') return;
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, [tool]);

  return (
    <div className="relative w-full h-full bg-slate-50">
      {/* Grid background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
          backgroundPosition: `${position.x}px ${position.y}px`,
        }}
      />
      
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        draggable={activeTool === 'pan'}
        onDragEnd={handleDragEnd}
        tabIndex={0}
        onKeyDown={(e: any) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
            handleDelete();
          }
        }}
      >
        <Layer>
          {/* Rooms */}
          {rooms.map(room => (
            <Group key={room.id}>
              <Line
                points={room.points}
                closed
                fill={ROOM_COLORS[room.type] || ROOM_COLORS.default}
                stroke={selectedId === room.id ? '#3b82f6' : '#9ca3af'}
                strokeWidth={selectedId === room.id ? 2 / scale : 1 / scale}
                onClick={() => handleSelect(room.id, 'room')}
              />
              <Text
                text={room.name}
                x={room.points.reduce((a, b, i) => i % 2 === 0 ? a + b : a, 0) / (room.points.length / 2)}
                y={room.points.reduce((a, b, i) => i % 2 === 1 ? a + b : a, 0) / (room.points.length / 2)}
                fontSize={14 / scale}
                fill="#374151"
              />
            </Group>
          ))}
          
          {/* Walls */}
          {walls.map(wall => (
            <Line
              key={wall.id}
              points={[wall.x1, wall.y1, wall.x2, wall.y2]}
              stroke={selectedId === wall.id ? '#3b82f6' : WALL_COLORS[wall.type]}
              strokeWidth={(wall.thickness || 15) / scale}
              lineCap="square"
              onClick={() => handleSelect(wall.id, 'wall')}
            />
          ))}
          
          {/* Current drawing */}
          {isDrawing && drawPoints.length > 0 && (
            <Line
              points={drawPoints}
              stroke="#3b82f6"
              strokeWidth={2 / scale}
              dash={[5 / scale, 5 / scale]}
            />
          )}
          
          {/* Doors */}
          {doors.map(door => (
            <Rect
              key={door.id}
              x={door.x - door.width / 2}
              y={door.y - 5}
              width={door.width}
              height={10}
              fill="#8b5cf6"
              stroke={selectedId === door.id ? '#3b82f6' : '#6d28d9'}
              strokeWidth={1 / scale}
              rotation={door.rotation}
              onClick={() => handleSelect(door.id, 'door')}
            />
          ))}
          
          {/* Windows */}
          {windows.map(win => (
            <Rect
              key={win.id}
              x={win.x - win.width / 2}
              y={win.y - 3}
              width={win.width}
              height={6}
              fill="#06b6d4"
              stroke={selectedId === win.id ? '#3b82f6' : '#0891b2'}
              strokeWidth={1 / scale}
              rotation={win.rotation}
              onClick={() => handleSelect(win.id, 'window')}
            />
          ))}
        </Layer>
      </Stage>
      
      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded shadow text-xs font-mono">
        Scale 1:{Math.round(50 / scale)} | {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
