'use client';

import { useFloorPlanStore } from '@/store/floorplan/store';
import { ROOM_COLORS } from '@/store/floorplan/nodes/room';
import * as THREE from 'three';

export function FloorPlanScene3D() {
  const { walls, rooms, furniture } = useFloorPlanStore();

  return (
    <group>
      {/* Rooms (floors) */}
      {rooms.map((room) => {
        const xs = room.points.filter((_, i) => i % 2 === 0);
        const ys = room.points.filter((_, i) => i % 2 === 1);
        const minX = Math.min(...xs) / 20;
        const maxX = Math.max(...xs) / 20;
        const minY = Math.min(...ys) / 20;
        const maxY = Math.max(...ys) / 20;
        const width = maxX - minX;
        const height = maxY - minY;

        return (
          <mesh
            key={room.id}
            position={[minX + width / 2, 0, minY + height / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[width, height]} />
            <meshStandardMaterial color={ROOM_COLORS[room.roomType]?.replace('rgba(', '').replace(')', '').split(',').slice(0, 3).join(',') || '#bdbdbd'} />
          </mesh>
        );
      })}

      {/* Walls */}
      {walls.map((wall) => {
        const startX = wall.start[0] / 20;
        const startY = wall.start[1] / 20;
        const endX = wall.end[0] / 20;
        const endY = wall.end[1] / 20;
        const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const angle = Math.atan2(endY - startY, endX - startX);
        const centerX = (startX + endX) / 2;
        const centerZ = (startY + endY) / 2;

        return (
          <mesh
            key={wall.id}
            position={[centerX, wall.height / 2, centerZ]}
            rotation={[0, -angle, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[length, wall.height, wall.thickness]} />
            <meshStandardMaterial color={wall.wallType === 'exterior' ? '#8b7355' : '#d4c4b0'} />
          </mesh>
        );
      })}

      {/* Furniture */}
      {furniture.map((f) => (
        <mesh
          key={f.id}
          position={[f.position[0] / 20, 0.5, f.position[2] / 20]}
          rotation={[0, (f.rotation * Math.PI) / 180, 0]}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={f.color || '#8b5cf6'} />
        </mesh>
      ))}
    </group>
  );
}
