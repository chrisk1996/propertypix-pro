export type PropertyStatus = 'active' | 'pending' | 'sold';

export interface Property {
  id: string;
  address: string;
  price: number;
  status: PropertyStatus;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  agentId: string;
  createdAt: string;
  updatedAt?: string;
  description?: string;
  location?: string;
}

export interface UploadJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  listingId: string;
}

export interface FloorPlanJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  modelUrl?: string;
  metadata?: {
    dimensions: { width: number; height: number; depth: number };
    roomCount: number;
    wallCount: number;
  };
}
