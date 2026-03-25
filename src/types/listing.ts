// Listing types for the Listing Builder Wizard

export type TransactionType = 'sale' | 'rent';
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land' | 'garage' | 'other';
export type PublishStatus = 'draft' | 'pending' | 'published' | 'archived';

export interface ListingFeatures {
  has_balcony?: boolean;
  has_terrace?: boolean;
  has_garden?: boolean;
  has_basement?: boolean;
  has_elevator?: boolean;
  has_parking?: boolean;
  parking_type?: 'garage' | 'carport' | 'outdoor' | 'underground';
  pets_allowed?: boolean;
  built_in_kitchen?: boolean;
  has_aircon?: boolean;
  has_fireplace?: boolean;
  has_pool?: boolean;
  is_furnished?: boolean;
  has_storage?: boolean;
  has_laundry?: boolean;
  wheelchair_accessible?: boolean;
  has_alarm?: boolean;
  has_video_intercom?: boolean;
}

export interface ListingMedia {
  id: string;
  media_type: 'image' | 'video' | '3d_model' | 'floorplan';
  original_url?: string;
  processed_url?: string;
  storage_path?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Listing {
  id: string;
  agent_id: string;
  transaction_type: TransactionType;
  property_type: PropertyType;
  title?: string;
  description?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city: string;
  district?: string;
  country: string;
  price?: number; // in cents, but displayed as EUR
  living_area?: number;
  plot_area?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  total_floors?: number;
  construction_year?: number;
  energy_rating?: string;
  heating_type?: string;
  features: ListingFeatures;
  media_ids: string[];
  publish_status: PublishStatus;
  published_at?: string;
  external_id?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface ListingFormData {
  transaction_type: TransactionType;
  property_type: PropertyType;
  title: string;
  description: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  district: string;
  country: string;
  price: number;
  living_area: number;
  plot_area: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  total_floors: number;
  construction_year: number;
  energy_rating: string;
  heating_type: string;
  features: ListingFeatures;
  media_ids: string[];
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Wohnung',
  house: 'Haus',
  commercial: 'Gewerbe',
  land: 'Grundstück',
  garage: 'Garage',
  other: 'Sonstiges',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  sale: 'Kauf',
  rent: 'Miete',
};

export const FEATURE_LABELS: Record<keyof ListingFeatures, string> = {
  has_balcony: 'Balkon',
  has_terrace: 'Terrasse',
  has_garden: 'Garten',
  has_basement: 'Keller',
  has_elevator: 'Aufzug',
  has_parking: 'Parkplatz',
  pets_allowed: 'Haustiere erlaubt',
  built_in_kitchen: 'Einbauküche',
  has_aircon: 'Klimaanlage',
  has_fireplace: 'Kamin',
  has_pool: 'Pool',
  is_furnished: 'Möbliert',
  has_storage: 'Abstellraum',
  has_laundry: 'Waschraum',
  wheelchair_accessible: 'Rollstuhlgerecht',
  has_alarm: 'Alarmanlage',
  has_video_intercom: 'Gegensprechanlage',
  parking_type: 'Parkplatz-Typ',
};

export const ENERGY_RATINGS = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const HEATING_TYPES = [
  'Gas',
  'Öl',
  'Fernwärme',
  'Wärmepumpe',
  'Solar',
  'Holz/Pellets',
  'Elektro',
  'Blockheizkraftwerk',
];

export const PORTALS = [
  { id: 'immobilienscout24', name: 'ImmobilienScout24', icon: '🏠' },
  { id: 'immowelt', name: 'ImmoWelt', icon: '🌐' },
  { id: 'ebay_kleinanzeigen', name: 'eBay Kleinanzeigen', icon: '📢' },
  { id: 'immobilier', name: 'Immobilier', icon: '🇫🇷' },
] as const;
