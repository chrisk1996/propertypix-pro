# PropertyPix Pro - Architecture Overview

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components + shadcn/ui patterns
- **3D Graphics:** Three.js (react-three-fiber)
- **2D Canvas:** Konva (react-konva)
- **State Management:** React hooks + URL state (next/navigation)

### Backend
- **Runtime:** Node.js (Next.js API routes)
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **AI Processing:** 
  - Replicate API (FLUX models for image enhancement)
  - Custom ML pipelines for staging/floor plans

### Infrastructure
- **Hosting:** Vercel
- **CDN:** Vercel Edge Network
- **Database Hosting:** Supabase Cloud

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Enhance   │  │   Staging   │  │ Floor Plan  │  ...         │
│  │    Page     │  │    Page     │  │    Page     │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────▼────────────────▼────────────────▼──────┐              │
│  │              Shared Components                 │              │
│  │  (Layout, ImageUpload, Navigation, etc.)      │              │
│  └───────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ /api/enhance│  │ /api/staging│  │/api/floorplan│ ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────▼────────────────▼────────────────▼──────┐              │
│  │              Service Layer                     │              │
│  │  (AI processing, validation, transformations) │              │
│  └───────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Replicate API │  │    Supabase     │  │  Supabase       │
│   (AI Models)   │  │    Database     │  │   Storage       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Data Flow

### Image Enhancement Flow
1. User uploads image → Client validates
2. Image sent to `/api/enhance` 
3. Server uploads to Supabase Storage
4. Server calls Replicate API with FLUX model
5. Polling for completion
6. Enhanced image saved to Storage
7. URLs returned to client

### Virtual Staging Flow
1. User uploads empty room photo
2. User selects room type + design style
3. Image + params sent to `/api/staging`
4. FLUX Depth Pro model generates staged version
5. Result saved and returned

### Floor Plan Flow
1. User draws 2D floor plan (Konva canvas)
2. OR uploads existing floor plan image
3. If uploaded: `/api/floorplan` extracts walls/rooms via ML
4. 2D state converted to 3D scene (Three.js)
5. Furniture placed via drag-drop
6. Export: PNG, PDF, SVG, GLTF, GLB

---

## Authentication & Authorization

### Auth Flow
- Supabase Auth handles email/password + OAuth
- Session stored in HTTP-only cookies
- Middleware validates session on protected routes
- User data synced to `users` table

### Protected Routes
- `/dashboard/*` — Requires authentication
- `/api/*` — Some routes public (enhance), others protected

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Replicate
REPLICATE_API_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

---

## Performance Considerations

### Image Processing
- Images resized client-side before upload (max 2048px)
- Progressive loading with blur placeholders
- CDN caching for processed images

### 3D Rendering
- Lazy loading of Three.js (dynamic import)
- LOD (Level of Detail) for complex furniture models
- WebGL context recovery on failure

### Database
- Connection pooling via Supabase
- Indexed queries on user_id, created_at
- Row Level Security (RLS) for multi-tenancy

---

*Last updated: April 2026*
