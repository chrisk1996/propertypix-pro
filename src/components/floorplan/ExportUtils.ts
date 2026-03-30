'use client';

import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

export interface ExportOptions {
  format: 'png' | 'pdf' | 'svg' | 'gltf' | 'glb';
  scale: number;
  showDimensions: boolean;
  showLabels: boolean;
  showFurniture: boolean;
  showGrid: boolean;
}

const DEFAULT_OPTIONS: ExportOptions = {
  format: 'png',
  scale: 1,
  showDimensions: true,
  showLabels: true,
  showFurniture: true,
  showGrid: false,
};

// Download helper
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export canvas as PNG
export async function exportAsPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'floorplan.png'
): Promise<void> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to create blob'));
    }, 'image/png');
  });
  downloadBlob(blob, filename);
}

// Export canvas as PDF (simple implementation)
export async function exportAsPDF(
  canvas: HTMLCanvasElement,
  filename: string = 'floorplan.pdf'
): Promise<void> {
  // For full PDF support, we'd need jsPDF
  // For now, we'll just use PNG and let browser print to PDF
  const url = canvas.toDataURL('image/png');
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head><title>${filename}</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
          <img src="${url}" style="max-width:100%;height:auto;">
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}

// Export as SVG (for 2D vector graphics)
export function exportAsSVG(
  walls: Array<{ x1: number; y1: number; x2: number; y2: number; type: string; thickness?: number }>,
  rooms: Array<{ points: number[]; name: string }>,
  filename: string = 'floorplan.svg'
): void {
  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  walls.forEach(w => {
    minX = Math.min(minX, w.x1, w.x2);
    minY = Math.min(minY, w.y1, w.y2);
    maxX = Math.max(maxX, w.x1, w.x2);
    maxY = Math.max(maxY, w.y1, w.y2);
  });

  const width = maxX - minX + 100;
  const height = maxY - minY + 100;
  const offsetX = 50 - minX;
  const offsetY = 50 - minY;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // Add rooms
  rooms.forEach(r => {
    const points = r.points.map((p: number, i: number) =>
      i % 2 === 0 ? p + offsetX : p + offsetY
    ).join(' ');
    svg += `<polygon points="${points}" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>`;
    svg += `<text x="${r.points.reduce((a: number, b: number, i: number) => i % 2 === 0 ? a + b : a, 0) / (r.points.length / 2) + offsetX}" y="${r.points.reduce((a: number, b: number, i: number) => i % 2 === 1 ? a + b : a, 0) / (r.points.length / 2) + offsetY}" font-family="sans-serif" font-size="12" text-anchor="middle">${r.name}</text>`;
  });

  // Add walls
  walls.forEach(w => {
    svg += `<line x1="${w.x1 + offsetX}" y1="${w.y1 + offsetY}" x2="${w.x2 + offsetX}" y2="${w.y2 + offsetY}" stroke="${w.type === 'exterior' ? '#333' : '#666'}" stroke-width="${w.thickness || 15}" stroke-linecap="square"/>`;
  });

  svg += '</svg>';

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  downloadBlob(blob, filename);
}

// Export as GLTF/GLB (for 3D)
export async function exportAsGLTF(
  scene: THREE.Scene | THREE.Object3D,
  filename: string = 'floorplan.glb',
  options: { binary?: boolean } = { binary: true }
): Promise<void> {
  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        const mimeType = options.binary ? 'application/octet-stream' : 'model/gltf+json';
        const extension = options.binary ? '.glb' : '.gltf';
        
        let output: ArrayBuffer | string;
        if (options.binary) {
          output = result as ArrayBuffer;
        } else {
          output = JSON.stringify(result, null, 2);
        }

        const blob = new Blob([output], { type: mimeType });
        const finalFilename = filename.endsWith(extension) ? filename : filename.replace(/\.[^.]+$/, '') + extension;
        downloadBlob(blob, finalFilename);
        resolve();
      },
      (error) => {
        console.error('GLTF export error:', error);
        reject(error);
      },
      { binary: options.binary }
    );
  });
}

// Create a 3D scene from floor plan data for export
export function createFloorPlan3DScene(data: {
  rooms: Array<{ name: string; x: number; y: number; width: number; height: number; type: string }>;
  walls: Array<{ start: [number, number]; end: [number, number]; type: 'exterior' | 'interior' }>;
}): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);

  // Room color mapping
  const roomColors: Record<string, string> = {
    living: '#e8f5e9',
    kitchen: '#fff3e0',
    bedroom: '#e3f2fd',
    bathroom: '#e0f7fa',
    dining: '#fce4ec',
    office: '#f3e5f5',
    garage: '#efebe9',
    default: '#f5f5f5',
  };

  const wallColors: Record<string, string> = {
    living: '#81c784',
    kitchen: '#ffb74d',
    bedroom: '#64b5f6',
    bathroom: '#4dd0e1',
    dining: '#f06292',
    office: '#ba68c8',
    garage: '#a1887f',
    default: '#bdbdbd',
  };

  const wallHeight = 2.8;
  const wallThickness = 0.15;

  // Add rooms with floors and walls
  data.rooms.forEach((room) => {
    const floorColor = roomColors[room.type] || roomColors.default;
    const wallColor = wallColors[room.type] || wallColors.default;

    const group = new THREE.Group();
    group.position.set(room.x, 0, room.y);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(room.width, room.height);
    const floorMat = new THREE.MeshStandardMaterial({ color: floorColor });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(room.width / 2, 0.01, room.height / 2);
    floor.receiveShadow = true;
    group.add(floor);

    // Walls (4 sides)
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor });

    // Front wall
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(room.width, wallHeight, wallThickness),
      wallMat
    );
    frontWall.position.set(room.width / 2, wallHeight / 2, 0);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    group.add(frontWall);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(room.width, wallHeight, wallThickness),
      wallMat
    );
    backWall.position.set(room.width / 2, wallHeight / 2, room.height);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, room.height),
      wallMat
    );
    leftWall.position.set(0, wallHeight / 2, room.height / 2);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, room.height),
      wallMat
    );
    rightWall.position.set(room.width, wallHeight / 2, room.height / 2);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    scene.add(group);
  });

  // Add ambient and directional light for better export
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  return scene;
}

// Re-export default options
export { DEFAULT_OPTIONS };
