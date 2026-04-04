// Furniture node schema
import { z } from 'zod';
import { BaseNode, nodeType, objectId, Point3D } from './base';

export const FurnitureNode = BaseNode.extend({
  id: objectId('furniture'),
  type: nodeType('furniture'),
  // Reference to furniture catalog item
  catalogId: z.string(),
  // Position in 3D space (x, y, z) where y is height
  position: Point3D,
  // Rotation around Y axis (degrees)
  rotation: z.number().default(0),
  // Scale factor
  scale: z.number().default(1),
  // Custom color override
  color: z.string().optional(),
});

export type FurnitureNode = z.infer<typeof FurnitureNode>;

// Furniture catalog item (loaded from GLB files)
export const FurnitureCatalogItem = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    'living',
    'bedroom',
    'kitchen',
    'dining',
    'bathroom',
    'office',
    'outdoor',
    'decor',
  ]),
  // Dimensions in meters
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number(),
  }),
  // GLB file path
  modelPath: z.string(),
  // Default color
  color: z.string(),
  // Thumbnail
  thumbnail: z.string().optional(),
});

export type FurnitureCatalogItem = z.infer<typeof FurnitureCatalogItem>;

export function createFurniture(
  catalogId: string,
  position: [number, number, number],
  options?: Partial<FurnitureNode>
): FurnitureNode {
  return FurnitureNode.parse({
    id: `furniture_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: 'furniture',
    catalogId,
    position,
    ...options,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
