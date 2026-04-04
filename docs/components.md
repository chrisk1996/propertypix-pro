# PropertyPix Pro - Component Documentation

Reusable UI components located in `src/components/`.

---

## Layout Components

### AppLayout

**Location:** `src/components/layout/AppLayout.tsx`

Main application wrapper with navigation.

```tsx
import { AppLayout } from '@/components/layout';

<AppLayout title="Floor Planner">
  {/* Page content */}
</AppLayout>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Page title shown in header |
| `children` | `ReactNode` | Page content |

---

### Navigation

**Location:** `src/components/layout/Navigation.tsx`

Top navigation bar with logo, links, and user menu.

**Features:**
- Responsive design (mobile hamburger menu)
- Active link highlighting
- User dropdown with logout

---

## Image Components

### ImageUploader

**Location:** `src/components/ImageUploader.tsx`

Drag-and-drop image upload with preview.

```tsx
<ImageUploader
  onUpload={(file) => handleFile(file)}
  accept="image/*"
  maxSize={10} // MB
  preview
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onUpload` | `(file: File) => void` | required | Upload callback |
| `accept` | `string` | `"image/*"` | Accepted file types |
| `maxSize` | `number` | `10` | Max file size in MB |
| `preview` | `boolean` | `true` | Show preview |
| `multiple` | `boolean` | `false` | Allow multiple files |

---

### BeforeAfterSlider

**Location:** `src/components/BeforeAfterSlider.tsx`

Comparison slider for before/after images.

```tsx
<BeforeAfterSlider
  beforeImage="/before.jpg"
  afterImage="/after.jpg"
  label={{ before: "Original", after: "Enhanced" }}
/>
```

---

## Floor Planner Components

### FloorPlanCanvas2D

**Location:** `src/components/floorplan/FloorPlanCanvas2D.tsx`

2D canvas for drawing floor plans using Konva.

```tsx
<FloorPlanCanvas2D
  tool="wall"
  walls={walls}
  rooms={rooms}
  furniture={furniture}
  onWallsChange={setWalls}
  onFurniturePlace={handlePlace}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `tool` | `'select' \| 'wall' \| 'room' \| 'door' \| 'window' \| 'furniture' \| 'pan'` | Active tool |
| `walls` | `WallSegment[]` | Wall data |
| `rooms` | `RoomPolygon[]` | Room data |
| `furniture` | `PlacedFurniture2D[]` | Furniture data |
| `onWallsChange` | `(walls: WallSegment[]) => void` | Wall update callback |
| `onFurniturePlace` | `(x: number, y: number) => void` | Furniture placement |

**Key Features:**
- Grid snapping (20px = 10cm)
- Touch support for mobile
- Zoom/pan with mouse wheel
- Keyboard shortcuts

---

### FloorPlan3DViewer

**Location:** `src/components/FloorPlan3DViewer.tsx`

3D visualization using Three.js.

```tsx
<FloorPlan3DViewer
  floorPlanData={floorPlanData}
  furniture={furniture}
  cameraPreset="perspective"
  lightingMode="day"
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `floorPlanData` | `FloorPlanData` | Room/wall data |
| `furniture` | `PlacedFurniturePiece[]` | 3D furniture |
| `cameraPreset` | `'perspective' \| 'top' \| 'front' \| 'side' \| 'walkthrough'` | Camera angle |
| `lightingMode` | `'day' \| 'night'` | Lighting preset |

---

### FurnitureLibrary

**Location:** `src/components/FurnitureLibrary.tsx`

Furniture picker with categories.

```tsx
<FurnitureLibrary
  selectedFurniture={selected}
  onSelectFurniture={handleSelect}
  compact // Bottom bar mode
/>
```

**Furniture Categories:**
- Living Room: Sofa, Armchair, Coffee Table, TV Stand
- Bedroom: Bed, Nightstand, Wardrobe, Dresser
- Kitchen: Dining Table, Chair, Counter, Refrigerator
- Bathroom: Toilet, Sink, Bathtub, Shower
- Office: Desk, Office Chair, Bookshelf

---

### ToolPalette

**Location:** `src/components/floorplan/ToolPalette.tsx`

Tool selection sidebar.

```tsx
<ToolPalette
  activeTool={tool}
  onToolChange={setTool}
/>
```

**Tools:**
| Tool | Icon | Shortcut |
|------|------|----------|
| Select | Mouse | V |
| Wall | Wall | W |
| Room | Square | R |
| Door | Door | D |
| Pan | Hand | H |
| Furniture | Chair | F |

---

### PropertiesPanel

**Location:** `src/components/floorplan/PropertiesPanel.tsx`

Right sidebar for editing selected element properties.

```tsx
<PropertiesPanel
  selectedId={selectedId}
  selectedType="wall"
  wall={selectedWall}
  onWallUpdate={updateWall}
  onDelete={deleteElement}
/>
```

---

## UI Components

### QuickActions

**Location:** `src/components/floorplan/QuickActions.tsx`

Floating action bar with shortcuts.

```tsx
<QuickActions
  actions={[
    { id: 'undo', icon: 'undo', label: 'Undo', shortcut: '⌘Z', onClick: undo },
    { id: 'save', icon: 'save', label: 'Save', onClick: save, variant: 'primary' }
  ]}
  position="top"
/>
```

---

### ExportModal

**Location:** `src/components/floorplan/ExportModal.tsx`

Export options dialog.

```tsx
<ExportModal
  isOpen={showExport}
  onClose={() => setShowExport(false)}
  canvasRef={canvasRef}
  walls={walls}
  rooms={rooms}
/>
```

**Export Formats:**
- PNG — High-resolution image
- PDF — Print-ready document
- SVG — Vector graphics
- GLTF — 3D model
- GLB — Binary 3D model

---

## Form Components

### Input

Standard text input with label and validation.

```tsx
<Input
  label="Email"
  type="email"
  placeholder="user@example.com"
  error={errors.email}
/>
```

### Button

```tsx
<Button variant="primary" size="lg" loading={isLoading}>
  Submit
</Button>
```

**Variants:** `primary`, `secondary`, `outline`, `ghost`, `danger`

---

*Last updated: April 2026*
