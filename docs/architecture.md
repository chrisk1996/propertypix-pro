# Zestio Pro - Architecture Overview

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router) with Turbopack
- **React:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components + shadcn/ui patterns
- **3D Graphics:** Three.js (react-three-fiber v9)
- **2D Canvas:** Konva (react-konva)
- **State Management:** Zustand + Zundo (undo/redo)

### Backend
- **Runtime:** Node.js (Next.js API routes)
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **AI Processing:**
  - Replicate API (FLUX, SDXL, Ideogram models)
  - Decor8 AI (virtual staging)

### Infrastructure
- **Hosting:** Vercel
- **CDN:** Vercel Edge Network
- **Database Hosting:** Supabase Cloud

---

## AI Model Architecture

### Virtual Staging Pipeline

#### Budget Option: FLUX Depth Pro
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Input Image │────►│ Depth Anything   │────►│ Depth Map       │
│ (empty room)│     │ (cjwbw model)    │     │ (grayscale)     │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                      │
┌─────────────┐     ┌──────────────────┐              │
│ Staged Room │◄────│ FLUX Depth Pro   │◄─────────────┘
│ (furnished) │     │ (control_image)  │
└─────────────┘     └──────────────────┘
```

**Why depth conditioning?**
- Preserves room structure (walls, windows, doors)
- Furniture scaled correctly by distance
- No hallucinated walls or floating objects

#### Premium Option: Decor8 AI
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Input Image │────►│ Decor8 AI API    │────►│ Staged Image    │
│ (empty room)│     │ (internal depth) │     │ (high quality)  │
└─────────────┘     └──────────────────┘     └─────────────────┘
```
- Handles depth internally
- Trained specifically for real estate
- Best structure preservation

### Photo Enhancement Pipeline

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Input Image │────►│ Model Selector   │────►│ SDXL / Flux /   │
│             │     │                  │     │ Ideogram        │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                      │
                    ┌──────────────────┐              │
                    │ Enhanced Image   │◄─────────────┘
                    └──────────────────┘
```

**Model Selection:**
| Model | Use Case | Cost |
|-------|----------|------|
| SDXL | General enhancement | $0.005 |
| Flux Kontext | Instruction-based edits | $0.02 |
| Ideogram | Text/logos in images | $0.02 |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Enhance   │ │   Staging   │ │  Floor Plan │ │   Video   │ │
│  │    Page     │ │    Page     │ │     Page    │ │   Page    │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │
│         │               │               │               │       │
│  ┌──────▼───────────────▼───────────────▼───────────────▼──────┐│
│  │              Shared Components (Layout, Nav)                ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │/api/enhance │ │/api/staging │ │/api/floorplan│ │/api/video │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │
│         │               │               │               │       │
│  ┌──────▼───────────────▼───────────────▼───────────────▼──────┐│
│  │                   Service Layer                              ││
│  │  (AI processing, validation, credit deduction, transforms)  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Replicate API  │ │    Supabase     │ │    Supabase     │
│  (AI Models)    │ │    Database     │ │    Storage      │
│                 │ │                 │ │                 │
│ - FLUX Depth    │ │ - users         │ │ - images        │
│ - Depth Anything│ │ - projects      │ │ - thumbnails    │
│ - SDXL          │ │ - listings      │ │ - videos        │
│ - Ideogram      │ │ - media         │ │                 │
│ - Decor8 API    │ │ - portal_creds  │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Data Flow

### Virtual Staging Flow (FLUX Depth)
1. User uploads empty room photo
2. User selects room type + design style + model
3. **Step 1:** Image → Depth Anything → Depth map
4. **Step 2:** Depth map + prompt → FLUX Depth Pro
5. Result saved to Storage, URL returned
6. Credits deducted (2 for budget, 3 for premium)

### Virtual Staging Flow (Decor8 Premium)
1. User uploads empty room photo
2. User selects room type + design style + "Premium"
3. Image + params → Decor8 API (handles depth internally)
4. Result saved and returned
5. 3 credits deducted

### Floor Plan Flow
1. User creates project (saved to DB)
2. User draws 2D floor plan (Konva canvas)
3. Auto-save to DB on changes
4. 3D view updates in real-time (Three.js)
5. Export: PNG, PDF, SVG, GLTF, GLB
6. Thumbnail generated from 3D view

### Video Generation Flow
1. User provides images or listing URL
2. Script generated based on mode
3. Images processed and sequenced
4. Video rendered with transitions
5. Output saved to Storage

---

## Floor Planner V2 Architecture

### Component Structure
```
src/app/floorplan/
├── page.tsx              # Main page with dashboard
├── [projectId]/
│   └── page.tsx          # Editor page
└── components/
    ├── FloorPlanEditor   # Main editor component
    ├── FloorPlanCanvas2D # 2D drawing (Konva)
    ├── FloorPlan3DViewer # 3D preview (Three.js)
    ├── FurnitureLibrary  # Furniture picker
    ├── ToolPalette       # Tool selection
    └── PropertiesPanel   # Selected element props
```

### State Management (Zustand + Zundo)
```typescript
interface FloorPlanState {
  walls: WallSegment[]
  rooms: RoomPolygon[]
  doors: DoorData[]
  windows: WindowData[]
  furniture: PlacedFurniture2D[]

  // Actions
  addWall: (wall: WallSegment) => void
  updateWall: (id: string, updates: Partial<WallSegment>) => void
  // ... more actions
}
```

### Persistence
- Projects saved to `floorplan_projects` table
- Auto-save on every change (debounced 500ms)
- Thumbnail generated from 3D view
- Visibility: private/public

---

## Authentication & Authorization

### Auth Flow
- Supabase Auth handles email/password + OAuth
- Session stored in HTTP-only cookies
- Middleware validates session on protected routes
- User data synced to `zestio_users` table

### Protected Routes
- `/dashboard/*` — Requires authentication
- `/api/*` — Some routes public (enhance, staging), others protected

### Row Level Security (RLS)
- All user data tables have RLS enabled
- Users can only access their own records
- Service role bypasses RLS for system operations

---

## Performance Considerations

### Image Processing
- Images resized client-side before upload (max 2048px)
- Progressive loading with blur placeholders
- CDN caching for processed images
- WebP format for better compression

### 3D Rendering
- Lazy loading of Three.js (dynamic import)
- LOD (Level of Detail) for complex furniture models
- WebGL context recovery on failure
- Thumbnail caching

### Database
- Connection pooling via Supabase
- Indexed queries on user_id, created_at
- Row Level Security for multi-tenancy
- Real-time subscriptions for collaboration

---

## Credit System

### Cost-Based Pricing
| Feature | Credits | API Cost | Margin |
|---------|---------|----------|--------|
| Photo Enhancement (SDXL) | 1 | $0.005 | 50% |
| Photo Enhancement (Flux) | 2 | $0.02 | 25% |
| Virtual Staging (Budget) | 2 | $0.02 | 25% |
| Virtual Staging (Premium) | 3 | $0.20 | 50% |
| Video Generation | 5 | $0.10 | 20% |

### Credit Tracking
- `zestio_users` table: `credits`, `used_credits`
- Each API call deducts appropriate credits
- Real-time balance updates

---

## Recent Updates (April 2026)

### April 10, 2026
- ✅ Proper depth conditioning for FLUX Depth Pro
- ✅ Decor8 AI premium staging integration
- ✅ AI model selector with quality/cost options

### April 8, 2026
- ✅ Video page redesign with URL mode
- ✅ Real-time video progress tracking
- ✅ Property renovation video pipeline

### April 5-7, 2026
- ✅ Floor Planner V2 with project persistence
- ✅ Dashboard sidebar and project management
- ✅ Auto-save to Supabase
- ✅ 3D thumbnail generation

### April 1-4, 2026
- ✅ Pascal Editor integration for floor plans
- ✅ Undo/redo with Zundo
- ✅ Keyboard shortcuts
- ✅ Export formats (PNG/PDF/SVG/GLTF/GLB)

---

*Last updated: April 10, 2026*
