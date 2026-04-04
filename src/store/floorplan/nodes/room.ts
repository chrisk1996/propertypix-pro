// Room node schema
import { z } from 'zod';
import { BaseNode, nodeType, objectId } from './base';

export const RoomNode = BaseNode.extend({
  id: objectId('room'),
  type: nodeType('room'),
  // Polygon points (flat array: [x1, y1, x2, y2, ...])
  points: z.array(z.number()),
  // Room type
  roomType: z.enum([
    'living',
    'bedroom',
    'kitchen',
    'bathroom',
    'dining',
    'office',
    'storage',
    'hallway',
    'garage',
    'other',
  ]).default('living'),
  // Floor material
  floorMaterialId: z.string().optional(),
  // Room height (for vaulted ceilings)
  height: z.number().optional(),
});

export type RoomNode = z.infer<typeof RoomNode>;

// Room type colors for rendering
export const ROOM_COLORS: Record<string, string> = {
  living: 'rgba(129, 199, 132, 0.4)',
  bedroom: 'rgba(100, 181, 246, 0.4)',
  kitchen: 'rgba(255, 183, 77, 0.4)',
  bathroom: 'rgba(77, 208, 225, 0.4)',
  dining: 'rgba(240, 98, 146, 0.4)',
  office: 'rgba(186, 104, 200, 0.4)',
  storage: 'rgba(158, 158, 158, 0.4)',
  hallway: 'rgba(238, 238, 238, 0.4)',
  garage: 'rgba(121, 85, 72, 0.4)',
  other: 'rgba(189, 189, 189, 0.4)',
};

// Helper to create a room
export function createRoom(
  points: number[],
  options?: Partial<RoomNode>
): RoomNode {
  return RoomNode.parse({
    id: `room_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: 'room',
    name: 'New Room',
    points,
    ...options,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

// Helper to get bounding box from points
export function getRoomBounds(room: RoomNode): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const xs = room.points.filter((_, i) => i % 2 === 0);
  const ys = room.points.filter((_, i) => i % 2 === 1);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}
