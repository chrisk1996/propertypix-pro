'use client';

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Rect, Group, Text } from 'react-konva';
import { useFloorPlanStore } from '@/store/floorplan/store';
import { ROOM_COLORS } from '@/store/floorplan/nodes/room';

export function FloorPlanCanvas2D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  
  const {
    walls,
    rooms,
    furniture,
    activeTool,
    scale,
    offset,
    gridSize,
    snapEnabled,
    selectedId,
    select,
    addWall,
    addRoom,
    setScale,
    setOffset,
  } = useFloorPlanStore();

  const dimensionsRef = useRef({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      dimensionsRef.current = { width: width || 800, height: height || 600 };
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Snap to grid
  const snap = (val: number): number => {
    if (!snapEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  };

  // Get pointer position
  const getPos = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: snap((pos.x - offset.x) / scale),
      y: snap((pos.y - offset.y) / scale),
    };
  };

  const handleMouseDown = () => {
    if (activeTool === 'wall' || activeTool === 'room') {
      const pos = getPos();
      setIsDrawing(true);
      setDrawStart(pos);
      setDrawEnd(pos);
    }
  };

  const handleMouseMove = () => {
    if (!isDrawing) return;
    setDrawEnd(getPos());
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawStart) return;
    setIsDrawing(false);
    
    if (activeTool === 'wall' && drawEnd) {
      addWall([drawStart.x, drawStart.y], [drawEnd.x, drawEnd.y]);
    }
    
    if (activeTool === 'room' && drawEnd) {
      const points = [
        drawStart.x, drawStart.y,
        drawEnd.x, drawStart.y,
        drawEnd.x, drawEnd.y,
        drawStart.x, drawEnd.y,
      ];
      addRoom(points);
    }
    
    setDrawStart(null);
    setDrawEnd(null);
  };

  // Wheel zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const delta = e.evt.deltaY > 0 ? 0.9 : 1.1;
    setScale(scale * delta);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 relative">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize * scale}px ${gridSize * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      />

      <Stage
        ref={stageRef}
        width={dimensionsRef.current.width}
        height={dimensionsRef.current.height}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        draggable={activeTool === 'pan'}
        onDragEnd={(e: any) => {
          setOffset({ x: e.target.x(), y: e.target.y() });
        }}
      >
        <Layer>
          {/* Rooms */}
          {rooms.map((room) => (
            <Group key={room.id}>
              <Line
                points={room.points}
                closed
                fill={ROOM_COLORS[room.roomType] || ROOM_COLORS.other}
                stroke={selectedId === room.id ? '#3b82f6' : '#9ca3af'}
                strokeWidth={selectedId === room.id ? 2 : 1}
                onClick={() => select(room.id, 'room')}
              />
              <Text
                text={room.name || 'Room'}
                x={Math.min(...room.points.filter((_, i) => i % 2 === 0))}
                y={Math.min(...room.points.filter((_, i) => i % 2 === 1))}
                fontSize={14}
                fill="#374151"
              />
            </Group>
          ))}

          {/* Walls */}
          {walls.map((wall) => (
            <Line
              key={wall.id}
              points={[wall.start[0], wall.start[1], wall.end[0], wall.end[1]]}
              stroke={selectedId === wall.id ? '#3b82f6' : wall.wallType === 'exterior' ? '#333' : '#666'}
              strokeWidth={wall.thickness * 100}
              lineCap="square"
              onClick={() => select(wall.id, 'wall')}
            />
          ))}

          {/* Current drawing */}
          {isDrawing && drawStart && drawEnd && (
            <Line
              points={[drawStart.x, drawStart.y, drawEnd.x, drawEnd.y]}
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[5, 5]}
            />
          )}

          {/* Furniture */}
          {furniture.map((f) => (
            <Rect
              key={f.id}
              x={f.position[0]}
              y={f.position[2]}
              width={2}
              height={2}
              fill={selectedId === f.id ? '#3b82f6' : '#8b5cf6'}
              stroke={selectedId === f.id ? '#1d4ed8' : '#6d28d9'}
              strokeWidth={selectedId === f.id ? 2 : 1}
              rotation={f.rotation}
              onClick={() => select(f.id, 'furniture')}
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
