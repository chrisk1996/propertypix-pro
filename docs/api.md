# PropertyPix Pro - API Documentation

All API routes are located in `src/app/api/`.

---

## Authentication

Most API routes require authentication via Supabase Auth session cookies.

**Headers:**
```
Cookie: sb-access-token=<token>; sb-refresh-token=<token>
```

**Public Routes:**
- `POST /api/enhance` — Public with rate limiting
- `POST /api/staging` — Public with rate limiting

**Protected Routes:**
- All `/api/dashboard/*` routes
- `/api/listings/*`
- `/api/portals/*`

---

## Endpoints

### Enhance

#### `POST /api/enhance`

Enhance a property image with AI models.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "enhancementType": "auto",
  "model": "auto"
}
```

**Response:**
```json
{
  "success": true,
  "output": "https://replicate.delivery/.../enhanced.webp",
  "jobId": "abc123",
  "creditsUsed": 1,
  "model": "sdxl"
}
```

**Enhancement Types:**
| Type | Description |
|------|-------------|
| `auto` | Automatic enhancement (default) |
| `staging` | Add furniture to empty rooms |
| `sky` | Sky replacement |
| `object_removal` | Remove objects from image |

**AI Models (Enhance):**
| Model | Credits | Best For |
|-------|---------|----------|
| `auto` | 1 | General enhancement (SDXL) |
| `flux-kontext` | 2 | Instruction-based edits |
| `ideogram` | 2 | Text/logos in images |

---

### Staging

#### `POST /api/staging`

Virtually stage an empty room with AI.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "roomType": "living",
  "furnitureStyle": "modern",
  "model": "flux-depth"
}
```

**Response:**
```json
{
  "success": true,
  "output": "https://replicate.delivery/.../staged.webp",
  "roomType": "living",
  "furnitureStyle": "modern",
  "model": "flux-depth",
  "creditsUsed": 2
}
```

**Room Types:**
`living`, `bedroom`, `dining`, `office`, `kitchen`

**Styles:**
`modern`, `scandinavian`, `luxury`, `minimalist`, `industrial`

**AI Models (Staging):**

| Model | Credits | Cost | Quality | Description |
|-------|---------|------|---------|-------------|
| `flux-depth` | 2 | ~$0.02 | ⭐⭐⭐ | Budget staging with depth preservation |
| `decor8` | 3 | $0.20 | ⭐⭐⭐⭐⭐ | Premium staging, best structure preservation |

---

### How Depth Conditioning Works (FLUX Depth Pro)

For the `flux-depth` model, the API implements a two-step workflow:

#### Step 1: Generate Depth Map
```
Input Image → Depth Anything (cjwbw model) → Grayscale Depth Map
```
- Extracts 3D structure from the photo
- Bright = close, Dark = far
- Cost: ~$0.001

#### Step 2: FLUX Depth Pro
```
Depth Map + Prompt → FLUX Depth Pro → Staged Image
```
- Uses depth map as `control_image`
- Preserves walls, floor, windows, doors
- Adds furniture that fits the actual room structure

**What Gets Preserved:**
| Element | Benefit |
|---------|---------|
| Walls | Furniture can't appear through walls |
| Floor/Ceiling | Correct vertical placement |
| Windows | Light sources remain consistent |
| Doors | Clear boundaries, furniture placed around them |
| Room depth | Furniture scaled by distance |

---

### Floor Plan

#### `POST /api/floorplan`

Extract walls and rooms from a floor plan image.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "fileType": "image/jpeg"
}
```

**Response:**
```json
{
  "walls": [
    { "start": [0.1, 0.2], "end": [0.5, 0.2], "type": "exterior" }
  ],
  "rooms": [
    { "name": "Living Room", "type": "living", "x": 0.1, "y": 0.2, "width": 0.4, "height": 0.4 }
  ]
}
```

---

### Video Generation

#### `POST /api/video`

Generate property video from images.

**Request:**
```json
{
  "images": ["url1", "url2", "url3"],
  "mode": "property_renovation",
  "transition": "fade"
}
```

**Modes:**
- `property_renovation` — Renovation progress video
- `property_tour` — Walkthrough video

---

### Listings

#### `GET /api/listings`

Get all listings for authenticated user.

**Response:**
```json
{
  "listings": [
    {
      "id": "list_123",
      "title": "Beautiful Apartment in Berlin",
      "address": "Berlin, Germany",
      "images": ["url1", "url2"],
      "status": "active",
      "createdAt": "2026-04-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/listings`

Create a new listing.

**Request:**
```json
{
  "title": "Modern Loft",
  "address": "Hamburg, Germany",
  "price": 450000,
  "description": "Spacious loft with city views...",
  "images": ["url1", "url2"]
}
```

#### `PUT /api/listings/[id]`
Update a listing.

#### `DELETE /api/listings/[id]`
Delete a listing.

---

### Floor Plan Projects

#### `GET /api/floorplan/projects`

Get all floor plan projects for authenticated user.

**Response:**
```json
{
  "projects": [
    {
      "id": "proj_123",
      "name": "Apartment 3BR",
      "thumbnail_url": "https://storage.supabase.co/.../thumb.png",
      "visibility": "private",
      "created_at": "2026-04-01T00:00:00Z",
      "updated_at": "2026-04-05T00:00:00Z"
    }
  ]
}
```

#### `POST /api/floorplan/projects`

Create a new floor plan project.

**Request:**
```json
{
  "name": "New Project",
  "scene_data": { "walls": [], "rooms": [], "furniture": [] }
}
```

#### `PUT /api/floorplan/projects/[id]`

Update project (auto-save).

**Request:**
```json
{
  "name": "Renamed Project",
  "scene_data": { "walls": [...], "rooms": [...], "furniture": [...] }
}
```

---

### Portals

#### `GET /api/portals`

Get connected portals for user.

#### `POST /api/portals/credentials`

Save portal credentials (encrypted).

**Request:**
```json
{
  "portal": "immobilienscout24",
  "username": "user@example.com",
  "password": "encrypted_password"
}
```

#### `GET /api/portals/status`

Check connection status for all portals.

---

### User

#### `GET /api/user`

Get current user profile.

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "plan": "pro",
  "credits": 85,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

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

## Error Handling

All errors follow this format:
```json
{
  "error": {
    "code": "INVALID_IMAGE",
    "message": "Image must be JPEG or PNG",
    "details": {}
  }
}
```

**Error Codes:**
| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid auth |
| `INVALID_IMAGE` | Image format not supported |
| `PROCESSING_FAILED` | AI processing error |
| `RATE_LIMITED` | Too many requests |
| `INSUFFICIENT_CREDITS` | Not enough credits |

---

## Rate Limiting

- **Public endpoints:** 10 requests/hour
- **Authenticated endpoints:** 100 requests/hour
- **Pro subscribers:** 500 requests/hour

Rate limit headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1712197200
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Replicate
REPLICATE_API_TOKEN=

# Decor8 AI (Premium Staging)
DECOR8_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

---

*Last updated: April 10, 2026*
