// Door node schema
import { z } from 'zod';
import { BaseNode, nodeType, objectId } from './base';

export const DoorNode = BaseNode.extend({
  id: objectId('door'),
  type: nodeType('door'),
  // Position on a wall (0-1, where 0 is start and 1 is end)
  position: z.number().min(0).max(1),
  // Reference to the wall this door is on
  wallId: z.string(),
  // Door dimensions
  width: z.number().default(0.9), // meters
  height: z.number().default(2.1), // meters
  // Door type
  doorType: z.enum(['single', 'double', 'sliding', 'folding']).default('single'),
  // Door swing direction (degrees, 0 = opens inward, 180 = opens outward)
  swing: z.number().default(90),
});

export type DoorNode = z.infer<typeof DoorNode>;

export function createDoor(
  wallId: string,
  position: number,
  options?: Partial<DoorNode>
): DoorNode {
  return DoorNode.parse({
    id: `door_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: 'door',
    wallId,
    position,
    ...options,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
