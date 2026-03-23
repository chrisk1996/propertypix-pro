import { Property } from '@/types/property';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchProperties(): Promise<Property[]> {
  return mockProperties;
}

export async function uploadImages(formData: FormData) {
  const res = await fetch(`${API_BASE}/api/v1/upload`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

export async function uploadFloorplan(formData: FormData) {
  const res = await fetch(`${API_BASE}/api/v1/floorplan/upload`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

export async function checkJobStatus(jobId: string, type: 'image' | 'floorplan') {
  const endpoint = type === 'image'
    ? `${API_BASE}/api/v1/status/${jobId}`
    : `${API_BASE}/api/v1/floorplan/status/${jobId}`;
  const res = await fetch(endpoint);
  return res.json();
}

export async function fetchFloorplanModel(jobId: string) {
  const res = await fetch(`${API_BASE}/api/v1/floorplan/${jobId}/model`);
  return res.json();
}

export const mockProperties: Property[] = [
  {
    id: '1',
    address: '123 Main Street, Berlin',
    price: 450000,
    status: 'active',
    images: ['/placeholder-house.jpg'],
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1200,
    agentId: 'agent-001',
    createdAt: '2026-03-01T10:00:00Z',
    location: 'Berlin',
    description: 'Beautiful modern apartment in central Berlin',
  },
  {
    id: '2',
    address: '45 Oak Avenue, Munich',
    price: 680000,
    status: 'pending',
    images: ['/placeholder-house.jpg'],
    bedrooms: 4,
    bathrooms: 3,
    sqft: 1800,
    agentId: 'agent-001',
    createdAt: '2026-02-28T14:30:00Z',
    location: 'Munich',
    description: 'Spacious family home with garden',
  },
  {
    id: '3',
    address: '78 River Road, Hamburg',
    price: 320000,
    status: 'sold',
    images: ['/placeholder-house.jpg'],
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
    agentId: 'agent-001',
    createdAt: '2026-02-25T09:15:00Z',
    location: 'Hamburg',
    description: 'Cozy waterfront apartment',
  },
];
