// Window node schema
import { z } from 'zod';
import { BaseNode, nodeType, objectId } from './base';

export const WindowNode = BaseNode.extend({
  id: objectId('window'),
  type: nodeType('window'),
  // Position on a wall (0-1)
  position: z.number().min(0).max(1),
  // Reference to the wall this window is on
  wallId: z.string(),
  // Window dimensions
  width: z.number().default(1.2), // meters
  height: z.number().default(1.4), // meters
  // Height from floor (sill height)
  sillHeight: z.number().default(0.9), // meters
  // Window type
  windowType: z.enum(['single', 'double', 'sliding', 'bay']).default('single'),
});

export type WindowNode = z.infer<typeof WindowNode>;

export function createWindow(
  wallId: string,
  position: number,
  options?: Partial<WindowNode>
): WindowNode {
  return WindowNode.parse({
    id: `window_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: 'window',
    wallId,
    position,
    ...options,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
