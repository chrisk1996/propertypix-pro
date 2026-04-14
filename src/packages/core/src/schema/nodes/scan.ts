import { z } from 'zod'
import { BaseNode, nodeType, objectId } from '../base'

export const ScanNode = BaseNode.extend({
  id: objectId('scan'),
  type: nodeType('scan'),
  url: z.string(),
  position: z.array(z.number()).length(3).default([0, 0, 0]),
  rotation: z.array(z.number()).length(3).default([0, 0, 0]),
  scale: z.number().default(1),
  opacity: z.number().min(0).max(100).default(100),
})

export type ScanNode = z.infer<typeof ScanNode>
