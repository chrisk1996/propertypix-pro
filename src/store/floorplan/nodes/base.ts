// Base types for floor plan nodes
import { z } from 'zod';

// Object ID with prefix
export const objectId = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[a-zA-Z0-9]+$`));

// Node type
export const nodeType = (type: string) =>
  z.literal(type);

// Base node schema
export const BaseNode = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export type BaseNode = z.infer<typeof BaseNode>;

// Vector types
export const Point2D = z.tuple([z.number(), z.number()]);
export type Point2D = z.infer<typeof Point2D>;

export const Point3D = z.tuple([z.number(), z.number(), z.number()]);
export type Point3D = z.infer<typeof Point3D>;
