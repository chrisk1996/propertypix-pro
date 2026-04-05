import { Object3D, BufferGeometry, Material, Light, Camera, Group, Mesh, Line, Points } from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // R3F Three.js elements
      group: { ref?: React.Ref<Group>; children?: React.ReactNode; [key: string]: unknown }
      scene: { [key: string]: unknown }

      // Geometries
      boxGeometry: { args?: [number, number, number] } & Record<string, unknown>
      planeGeometry: { args?: [number, number] } & Record<string, unknown>
      bufferGeometry: { [key: string]: unknown }
      circleGeometry: { [key: string]: unknown }
      cylinderGeometry: { [key: string]: unknown }
      sphereGeometry: { [key: string]: unknown }
      ringGeometry: { [key: string]: unknown }

      // Meshes & Lines (R3F versions)
      mesh: { ref?: React.Ref<Mesh>; children?: React.ReactNode; [key: string]: unknown }
      instancedMesh: { [key: string]: unknown }
      line: { ref?: React.Ref<Line>; children?: React.ReactNode; geometry?: BufferGeometry; [key: string]: unknown }
      lineSegments: { ref?: React.Ref<Line>; children?: React.ReactNode; [key: string]: unknown }
      points: { ref?: React.Ref<Points>; children?: React.ReactNode; [key: string]: unknown }

      // Materials
      meshStandardMaterial: { [key: string]: unknown }
      meshBasicMaterial: { [key: string]: unknown }
      lineBasicMaterial: { color?: string; [key: string]: unknown }
      lineBasicNodeMaterial: { color?: string; [key: string]: unknown }
      pointsMaterial: { [key: string]: unknown }
      meshPhysicalMaterial: { [key: string]: unknown }
      meshNormalMaterial: { [key: string]: unknown }

      // Lights
      ambientLight: { intensity?: number; [key: string]: unknown }
      directionalLight: { position?: [number, number, number]; [key: string]: unknown }
      pointLight: { position?: [number, number, number]; [key: string]: unknown }
      spotLight: { [key: string]: unknown }
      hemisphereLight: { [key: string]: unknown }

      // Cameras
      perspectiveCamera: { position?: [number, number, number]; [key: string]: unknown }
      orthographicCamera: { [key: string]: unknown }

      // Helpers
      gridHelper: { args?: [number, number]; [key: string]: unknown }
      axesHelper: { [key: string]: unknown }

      // Misc
      primitive: { object?: Object3D; [key: string]: unknown }
      color: { args?: [string]; [key: string]: unknown }
    }
  }
}

export {}
