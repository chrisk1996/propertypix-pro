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

Enhance a property image.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "type": "sky",
  "options": {
    "skyType": "sunset",
    "intensity": 80
  }
}
```

**Response:**
```json
{
  "id": "enhance_abc123",
  "originalUrl": "https://storage.supabase.co/.../original.jpg",
  "enhancedUrl": "https://storage.supabase.co/.../enhanced.jpg",
  "status": "completed"
}
```

**Enhancement Types:**
| Type | Description | Options |
|------|-------------|---------|
| `sky` | Sky replacement | `skyType`: 'clear' \| 'sunset' \| 'dramatic' |
| `twilight` | Virtual twilight | `intensity`: 0-100 |
| `enhance` | General enhancement | `intensity`: 0-100 |
| `denoise` | Noise reduction | `strength`: 'light' \| 'medium' \| 'strong' |

---

### Staging

#### `POST /api/staging`

Virtually stage an empty room.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "roomType": "living",
  "style": "modern"
}
```

**Response:**
```json
{
  "id": "staging_xyz789",
  "originalUrl": "https://storage.supabase.co/.../original.jpg",
  "stagedUrl": "https://storage.supabase.co/.../staged.jpg",
  "roomType": "living",
  "style": "modern",
  "status": "completed"
}
```

**Room Types:** `living`, `bedroom`, `dining`, `office`, `kitchen`

**Styles:** `modern`, `scandinavian`, `luxury`, `minimalist`, `industrial`

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
    { "start": [0.1, 0.2], "end": [0.5, 0.2], "type": "exterior" },
    { "start": [0.1, 0.2], "end": [0.1, 0.6], "type": "exterior" }
  ],
  "rooms": [
    { "name": "Living Room", "type": "living", "x": 0.1, "y": 0.2, "width": 0.4, "height": 0.4 }
  ]
}
```

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

- **Public endpoints:** 10 requests/minute
- **Authenticated endpoints:** 100 requests/minute
- **Pro subscribers:** 500 requests/minute

Rate limit headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1712197200
```

---

*Last updated: April 2026*
