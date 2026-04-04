// Wall node schema
import { z } from 'zod';
import { BaseNode, nodeType, objectId } from './base';

export const WallNode = BaseNode.extend({
  id: objectId('wall'),
  type: nodeType('wall'),
  // Start and end points in 2D (grid units)
  start: z.tuple([z.number(), z.number()]),
  end: z.tuple([z.number(), z.number()]),
  // Wall properties
  thickness: z.number().default(0.15), // meters
  height: z.number().default(2.7), // meters
  // Wall type
  wallType: z.enum(['exterior', 'interior']).default('interior'),
  // Material reference
  materialId: z.string().optional(),
});

export type WallNode = z.infer<typeof WallNode>;

// Helper to create a wall
export function createWall(
  start: [number, number],
  end: [number, number],
  options?: Partial<WallNode>
): WallNode {
  return WallNode.parse({
    id: `wall_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: 'wall',
    start,
    end,
    ...options,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
