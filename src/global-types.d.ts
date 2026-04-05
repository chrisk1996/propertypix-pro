// Global type overrides for Pascal Editor compatibility
// These override strict array type checking

declare global {
  // Allow loose array types to be assigned to strict tuple types
  interface Array<T> {
    // Make arrays compatible with tuple types
    length: number
    [n: number]: T
  }
}

// Make position/rotation/polygon types compatible
type Position3D = [number, number, number] | number[]
type Position2D = [number, number] | number[]
type Rotation3D = [number, number, number] | number[]
type Polygon2D = [number, number][] | number[][]

export {}
