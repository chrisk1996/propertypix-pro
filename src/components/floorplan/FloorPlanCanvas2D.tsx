'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Text, Group } from 'react-konva';
import WallEditor from './WallEditor';
import RoomEditor from './RoomEditor';
import DoorWindowEditor from './DoorWindowEditor';
import type { PlacedFurniture2D } from './useFurniture';

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
  furniture?: PlacedFurniture2D[];
  selectedFurnitureId?: string | null;
  onWallsChange?: (walls: WallSegment[]) => void;
  onRoomsChange?: (rooms: RoomPolygon[]) => void;
  onDoorsChange?: (doors: DoorData[]) => void;
  onWindowsChange?: (windows: WindowData[]) => void;
  onSelectionChange?: (id: string | null, type: 'wall' | 'room' | 'door' | 'window' | null) => void;
  onFurniturePlace?: (x: number, y: number) => void;
  onFurnitureSelect?: (id: string | null) => void;
  onFurnitureMove?: (id: string, x: number, y: number) => void;
  onFurnitureRotate?: (id: string) => void;
  onFurnitureDelete?: (id: string) => void;
}

const GRID_SIZE = 20; // 20px = 10cm at 1:50 scale
const SNAP_THRESHOLD = 10;

const WALL_COLORS = {
  exterior: '#333333',
  interior: '#666666'
};

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
  furniture = [],
  selectedFurnitureId,
  onWallsChange,
  onRoomsChange,
  onDoorsChange,
  onWindowsChange,
  onSelectionChange,
  onFurniturePlace,
  onFurnitureSelect,
  onFurnitureMove,
  onFurnitureRotate,
  onFurnitureDelete,
}: FloorPlanCanvas2DProps) {
  const activeTool = tool ?? 'select';
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'wall' | 'room' | 'door' | 'window' | null>(null);
  const stageRef = useRef<any>(null);

  // Resize observer for responsive canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width: width || 800, height: height || 600 });
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Snap to grid
  const snapToGrid = useCallback((value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  // Get mouse position relative to stage
  const getPointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
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
  }, [activeTool, getPointerPosition]);

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

    // Handle furniture placement
    if (activeTool === 'furniture') {
      const pos = getPointerPosition();
      onFurniturePlace?.(pos.x, pos.y);
      setDrawPoints([]);
      return;
    }

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
  }, [isDrawing, activeTool, drawPoints, walls, rooms, onWallsChange, onRoomsChange, onFurniturePlace, getPointerPosition]);

  // Handle selection
  const handleSelect = useCallback((id: string, type: 'wall' | 'room' | 'door' | 'window') => {
    if (activeTool !== 'select') return;
    setSelectedId(id);
    setSelectedType(type);
    onSelectionChange?.(id, type);
  }, [activeTool, onSelectionChange]);

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
    if (activeTool !== 'pan') return;
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, [activeTool]);

  // Handle furniture click
  const handleFurnitureClick = useCallback((id: string, e: any) => {
    e.cancelBubble = true;
    onFurnitureSelect?.(id === selectedFurnitureId ? null : id);
    onSelectionChange?.(null, null);
  }, [selectedFurnitureId, onFurnitureSelect, onSelectionChange]);

  // Handle furniture drag end
  const handleFurnitureDragEnd = useCallback((id: string, e: any) => {
    const snapped = {
      x: snapToGrid(e.target.x()),
      y: snapToGrid(e.target.y()),
    };
    onFurnitureMove?.(id, snapped.x, snapped.y);
  }, [snapToGrid, onFurnitureMove]);

  // Use dimensions from resize observer instead of fixed width/height
  const canvasWidth = dimensions.width;
  const canvasHeight = dimensions.height;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-50">
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
        width={canvasWidth}
        height={canvasHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
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

          {/* Furniture */}
          {furniture.map(piece => (
            <Group
              key={piece.id}
              x={piece.x}
              y={piece.y}
              rotation={piece.rotation}
              draggable
              onClick={(e) => handleFurnitureClick(piece.id, e)}
              onTap={(e) => handleFurnitureClick(piece.id, e)}
              onDragEnd={(e) => handleFurnitureDragEnd(piece.id, e)}
            >
              <Rect
                width={piece.width}
                height={piece.height}
                fill={selectedFurnitureId === piece.id ? `${piece.color}dd` : piece.color}
                stroke={selectedFurnitureId === piece.id ? '#3b82f6' : '#333'}
                strokeWidth={selectedFurnitureId === piece.id ? 2 / scale : 1 / scale}
                cornerRadius={3 / scale}
                shadowColor="rgba(0,0,0,0.3)"
                shadowBlur={selectedFurnitureId === piece.id ? 10 : 5}
                shadowOffset={{ x: 2 / scale, y: 2 / scale }}
              />
              <Text
                text={piece.name}
                x={0}
                y={piece.height / 2 - 7 / scale}
                width={piece.width}
                align="center"
                fontSize={10 / scale}
                fill="#fff"
                fontStyle="bold"
                shadowColor="rgba(0,0,0,0.5)"
                shadowBlur={2 / scale}
              />
              {/* Selection handles */}
              {selectedFurnitureId === piece.id && (
                <>
                  {/* Rotation handle */}
                  <Group
                    x={piece.width / 2}
                    y={-20 / scale}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      onFurnitureRotate?.(piece.id);
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      onFurnitureRotate?.(piece.id);
                    }}
                  >
                    <Line points={[0, 0, 0, 15 / scale]} stroke="#8b5cf6" strokeWidth={2 / scale} />
                    <Rect x={-6 / scale} y={-6 / scale} width={12 / scale} height={12 / scale} fill="#8b5cf6" cornerRadius={6 / scale} />
                    <Text text="↻" x={-5 / scale} y={-5 / scale} fontSize={10 / scale} fill="#fff" />
                  </Group>
                  {/* Delete button */}
                  <Group
                    x={piece.width + 5 / scale}
                    y={0}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      onFurnitureDelete?.(piece.id);
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      onFurnitureDelete?.(piece.id);
                    }}
                  >
                    <Rect x={0} y={0} width={16 / scale} height={16 / scale} fill="#ef4444" cornerRadius={8 / scale} />
                    <Text text="✕" x={4 / scale} y={2 / scale} fontSize={12 / scale} fill="#fff" />
                  </Group>
                </>
              )}
            </Group>
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
