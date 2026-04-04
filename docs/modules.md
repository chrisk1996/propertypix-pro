# PropertyPix Pro - Module Documentation

This document provides detailed functional and technical descriptions of all major modules.

---

## 1. Enhance Module

**Location:** `src/app/enhance/`, `src/app/api/enhance/`

### Functional Description

The Enhance module provides AI-powered image enhancement for real estate photography. Users can upload property photos and apply various improvements:

- **Sky Replacement** — Replace dull/overcast skies with clear blue, sunset, or dramatic clouds
- **Virtual Twilight** — Convert daytime exterior shots to twilight/dusk atmosphere
- **Lighting Correction** — Fix underexposed or overexposed areas
- **Noise Reduction** — Remove grain from low-light photos
- **Color Enhancement** — Boost vibrancy and color accuracy

### User Flow
1. User uploads image (drag-drop or file picker)
2. User selects enhancement type
3. System processes via FLUX model on Replicate
4. Before/After comparison displayed
5. User can download enhanced image

### Technical Details

**Frontend Components:**
- `EnhancePage` — Main page component
- `ImageUploader` — Drag-drop upload with validation
- `EnhanceControls` — Enhancement type selector
- `BeforeAfterSlider` — Comparison slider component

**API Endpoint:** `POST /api/enhance`
```typescript
Request: {
  image: string,      // Base64 or URL
  type: 'sky' | 'twilight' | 'enhance' | 'denoise',
  options?: {
    skyType?: 'clear' | 'sunset' | 'dramatic',
    intensity?: number  // 0-100
  }
}

Response: {
  originalUrl: string,
  enhancedUrl: string,
  id: string
}
```

**AI Models:**
- FLUX.1 Depth Pro — Primary enhancement model
- Custom sky segmentation for replacement
- Tone mapping for twilight conversion

---

## 2. Staging Module

**Location:** `src/app/staging/`, `src/app/api/staging/`

### Functional Description

Virtual staging transforms empty rooms into beautifully furnished spaces. This helps buyers visualize potential and increases listing appeal.

**Features:**
- 5 Room Types: Living, Bedroom, Dining, Office, Kitchen
- 5 Design Styles: Modern, Scandinavian, Luxury, Minimalist, Industrial
- Structure preservation (FLUX Depth Pro ensures architectural integrity)
- Multiple furniture arrangements per room

### User Flow
1. Upload empty room photo
2. Select room type (e.g., "Living Room")
3. Select design style (e.g., "Modern")
4. System generates staged version
5. Download or try different styles

### Technical Details

**Frontend Components:**
- `StagingPage` — Main page component
- `RoomTypeSelector` — Room type picker
- `StyleSelector` — Design style picker
- `StagingResult` — Result display with comparison

**API Endpoint:** `POST /api/staging`
```typescript
Request: {
  image: string,
  roomType: 'living' | 'bedroom' | 'dining' | 'office' | 'kitchen',
  style: 'modern' | 'scandinavian' | 'luxury' | 'minimalist' | 'industrial'
}

Response: {
  originalUrl: string,
  stagedUrl: string,
  id: string,
  roomType: string,
  style: string
}
```

**AI Model:**
- FLUX Depth Pro with depth-aware inpainting
- Preserves room structure, windows, doors
- Furniture style embeddings for consistent look

---

## 3. Floor Planner Module

**Location:** `src/app/floorplan/`, `src/components/floorplan/`

### Functional Description

Interactive floor plan creation tool with 2D editing and 3D visualization.

**Features:**
- Draw walls, rooms, doors, windows
- Furniture library with drag-drop placement
- 2D/3D/Split view toggle
- Export: PNG, PDF, SVG, GLTF, GLB
- Upload existing floor plan for auto-extraction

### User Flow
1. **Draw Mode:** Draw walls/rooms on 2D canvas
2. **Furniture Mode:** Place furniture from library
3. **3D Preview:** View rendered 3D model
4. **Export:** Download in various formats

### Technical Details

**Frontend Components:**

| Component | Purpose |
|-----------|---------|
| `FloorPlanClient` | Main page, orchestrates all state |
| `FloorPlanCanvas2D` | 2D drawing canvas (Konva) |
| `FloorPlan3DViewer` | 3D visualization (Three.js) |
| `ToolPalette` | Tool selection (select, wall, room, etc.) |
| `FurnitureLibrary` | Furniture picker |
| `PropertiesPanel` | Element properties editor |
| `ExportModal` | Export options dialog |

**State Management:**
- `useFurniture` — Furniture placement state
- `useUndoRedo` — Undo/redo history for walls/rooms
- Local state for tool selection, view mode

**2D Canvas (Konva):**
- Grid-based snapping (20px = 10cm at 1:50 scale)
- Layer structure: Grid → Rooms → Walls → Furniture → UI
- Touch support for mobile
- Zoom/pan with mouse wheel and drag

**3D Viewer (Three.js):**
- Room extrusion from 2D polygons
- Furniture as GLTF models
- Camera presets: perspective, top, front, side, walkthrough
- Lighting modes: day, night

**API Endpoint:** `POST /api/floorplan`
```typescript
Request: {
  image: string  // Uploaded floor plan image
}

Response: {
  walls: Array<{ start: [x,y], end: [x,y], type: 'exterior'|'interior' }>,
  rooms: Array<{ name, type, x, y, width, height }>
}
```

---

## 4. Video Module

**Location:** `src/app/video/`, `src/app/api/video/`

### Functional Description

Create property walkthrough videos from static images.

**Features:**
- Ken Burns effect (pan/zoom)
- Transition between rooms
- Background music
- Text overlays
- Export as MP4

### Technical Details

**Frontend Components:**
- `VideoPage` — Video creation interface
- `TimelineEditor` — Drag-drop timeline
- `PreviewPlayer` — Video preview

**API Endpoint:** `POST /api/video`
```typescript
Request: {
  images: string[],      // Image URLs
  transitions: Array<{ type: 'fade' | 'slide', duration: number }>,
  music?: string,       // Background music URL
  overlays?: Array<{ text, position, duration }>
}

Response: {
  videoUrl: string,
  duration: number
}
```

---

## 5. Dashboard Module

**Location:** `src/app/dashboard/`

### Functional Description

Central hub for managing listings, viewing history, and account settings.

**Sub-modules:**
- **Listings** — CRUD for property listings
- **History** — Processing job history
- **Portals** — External portal connections (ImmobilienScout24, ImmoWelt)
- **Settings** — Account preferences

### Technical Details

**Authentication:**
- Protected by middleware
- Supabase Auth session validation
- Row Level Security on all queries

**Database Tables:**
- `users` — User profiles
- `listings` — Property listings
- `jobs` — Processing job history
- `portals` — Portal credentials (encrypted)

---

## 6. Pricing Module

**Location:** `src/app/pricing/`

### Functional Description

Subscription plans and credit purchases.

**Plans:**
- Free: 5 enhances/month
- Pro: 100 enhances/month, priority processing
- Enterprise: Unlimited, API access

### Technical Details

- Stripe integration for payments
- Subscription status in `users` table
- Credit tracking in `credits` table

---

## Module Dependencies

```
Enhance ──────────────────┐
                          │
Staging ──────────────────┼──▶ Shared Components
                          │    - ImageUploader
Floor Planner ────────────┤    - Navigation
                          │    - Layout
Video ────────────────────┘    - AuthProvider

Dashboard ─────────────────────▶ All modules (history tracking)
```

---

*Last updated: April 2026*
