import dedent from 'dedent'
import { z } from 'zod'
import { BaseNode, nodeType, objectId } from '../base'
import { LevelNode } from './level'

export const BuildingNode = BaseNode.extend({
  id: objectId('building'),
  type: nodeType('building'),
  children: z.array(LevelNode.shape.id).default([]),
  position: z.array(z.number()).length(3).default([0, 0, 0]),
  rotation: z.array(z.number()).length(3).default([0, 0, 0]),
}).describe(
  dedent`
  Building node - used to represent a building
  - position: position in site coordinate system
  - rotation: rotation in site coordinate system
  - children: array of level nodes (each level is a tree of floor and wall nodes) 
  `,
)

export type BuildingNode = z.infer<typeof BuildingNode>
