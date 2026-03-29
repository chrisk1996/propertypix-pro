'use client';

export interface ExportOptions {
  format: 'png' | 'pdf' | 'svg' | 'gltf';
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
  walls: any[],
  rooms: any[],
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

// Export as GLTF (for 3D)
export async function exportAsGLTF(
  scene: any,
  filename: string = 'floorplan.glb'
): Promise<void> {
  // This would require Three.js GLTFExporter
  // For now, just log
  console.log('GLTF export not yet implemented');
}
