# Zestio Pro

AI-powered real estate media platform for agents, photographers, and property marketers.

**Live:** [zestio.ai](https://zestio.ai)

---

## Features

### 🖼️ Photo Enhancement
Enhance property photos with AI models:
- **Auto (SDXL)** — General enhancement, 1 credit
- **FLUX Kontext** — Instruction-based edits, 2 credits
- **Ideogram** — Text/logos in images, 2 credits

### 🛋️ Virtual Staging
Stage empty rooms with furniture:
- **Budget (FLUX Depth Pro)** — Depth-preserving staging, 2 credits (~$0.02)
- **Premium (Decor8 AI)** — Professional staging, 3 credits ($0.20)

**Depth Conditioning:** Budget staging uses a two-step process:
1. Generate depth map from input image (Depth Anything)
2. Use depth map to preserve room structure while adding furniture

### 📐 3D Floor Plans
Draw 2D floor plans → see them in 3D instantly:
- Drag-and-drop furniture
- Export: PNG, PDF, SVG, GLTF, GLB
- Auto-save to cloud
- Project management dashboard

### 🎬 Video Generation
Create property videos:
- URL mode: Paste listing URL → generate video
- Image mode: Upload images manually
- Real-time progress tracking

### 📋 Listing Builder
Create property listings ready for portals:
- German fields (Kaltmiete, Warmmiete, Nebenkosten)
- Building details (Neubau, Altbau, Zustand)
- Energy ratings (A+ to H)
- Auto proximity data (schools, transport, shops)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 + Turbopack |
| React | React 19 |
| 3D | Three.js (react-three-fiber v9) |
| 2D | Konva (react-konva) |
| State | Zustand + Zundo |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Replicate API, Decor8 AI |

---

## AI Models

### Virtual Staging

| Model | Credits | Quality | Best For |
|-------|---------|---------|----------|
| FLUX Depth Pro | 2 | ⭐⭐⭐ | Budget staging |
| Decor8 AI | 3 | ⭐⭐⭐⭐⭐ | Premium staging |

**FLUX Depth Pro Workflow:**
```
Input Image → Depth Anything → Depth Map
Depth Map + Prompt → FLUX Depth Pro → Staged Image
```

### Photo Enhancement

| Model | Credits | Best For |
|-------|---------|----------|
| SDXL | 1 | General enhancement |
| FLUX Kontext | 2 | Instruction edits |
| Ideogram | 2 | Text/logos |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Replicate API key
- (Optional) Decor8 API key for premium staging

### Installation

```bash
git clone https://github.com/chrisk1996/zestio-pro.git
cd zestio-pro/frontend
npm install
```

### Environment Setup

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REPLICATE_API_TOKEN=your_replicate_token
DECOR8_API_KEY=your_decor8_key  # Optional
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── enhance/        # Photo enhancement
│   │   ├── staging/        # Virtual staging
│   │   ├── floorplan/      # Floor plan projects
│   │   └── video/          # Video generation
│   ├── enhance/            # Enhance page
│   ├── staging/            # Staging page
│   ├── floorplan/          # Floor planner
│   └── video/              # Video generator
├── components/             # Reusable components
│   ├── layout/             # Layout components
│   ├── floorplan/          # Floor plan components
│   └── AIModelSelector.tsx # Model selector
├── utils/                  # Utilities
│   └── supabase/           # Supabase client
└── packages/               # Internal packages
    ├── core/               # State management (Zustand)
    └── viewer/             # 3D rendering
```

---

## Documentation

- [API Documentation](./docs/api.md)
- [Architecture](./docs/architecture.md)
- [Components](./docs/components.md)
- [Database Schema](./docs/database.md)

---

## Credit System

| Feature | Credits | API Cost |
|---------|---------|----------|
| Photo Enhancement (SDXL) | 1 | ~$0.005 |
| Photo Enhancement (Flux) | 2 | ~$0.02 |
| Virtual Staging (Budget) | 2 | ~$0.02 |
| Virtual Staging (Premium) | 3 | $0.20 |
| 3D Floor Plan | 0 | Free |
| Video Generation | 5 | ~$0.10 |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Docker

```bash
docker build -t zestio-pro .
docker run -p 3000:3000 zestio-pro
```

---

## Recent Updates

### April 2026
- ✅ Proper depth conditioning for FLUX Depth Pro
- ✅ Decor8 AI premium staging integration
- ✅ AI model selector with quality/cost options
- ✅ Video page redesign with URL mode
- ✅ Floor Planner V2 with project persistence
- ✅ Pascal Editor integration (Zustand + Zundo)
- ✅ Export formats (PNG/PDF/SVG/GLTF/GLB)
- ✅ 3D thumbnail generation

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/chrisk1996/zestio-pro/issues)
- **Email:** support@zestio.ai

---

*Last updated: April 10, 2026*
