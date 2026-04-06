// Listing types for the Listing Builder Wizard

export type TransactionType = 'sale' | 'rent';
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land' | 'garage' | 'other';
export type PublishStatus = 'draft' | 'pending' | 'published' | 'archived';
export type PropertyCondition = 'first_occupancy' | 'new_build' | 'refurbished' | 'modernized' | 'well_kept' | 'needs_renovation' | 'completely_renovated';
export type BuildingType = 'neubau' | 'altbau' | 'plattenbau' | 'villa' | 'bungalow' | 'townhouse' | 'farmhouse' | 'duplex';

export interface ListingFeatures {
  has_balcony?: boolean;
  has_terrace?: boolean;
  has_garden?: boolean;
  has_basement?: boolean;
  has_elevator?: boolean;
  has_parking?: boolean;
  parking_type?: 'garage' | 'carport' | 'outdoor' | 'underground';
  parking_spaces?: number;
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
  has_guest_toilet?: boolean;
  has_attic?: boolean;
  has_south_orientation?: boolean;
  barrier_free?: boolean;
}

// Proximity information for a listing
export interface ProximityPOI {
  name: string;
  distance_meters: number;
  walking_minutes: number;
  type?: string;
}

export interface ProximityData {
  // Shopping
  supermarket?: ProximityPOI[];
  grocery?: ProximityPOI[];
  
  // Education
  primary_school?: ProximityPOI[];
  secondary_school?: ProximityPOI[];
  kindergarten?: ProximityPOI[];
  
  // Transport
  public_transport?: ProximityPOI[];
  
  // Healthcare
  pharmacy?: ProximityPOI[];
  hospital?: ProximityPOI[];
  doctor?: ProximityPOI[];
  
  // Recreation
  park?: ProximityPOI[];
  gym?: ProximityPOI[];
  
  // Dining
  restaurant?: ProximityPOI[];
  cafe?: ProximityPOI[];
  
  // Last updated
  updated_at?: string;
  source?: 'openstreetmap' | 'google' | 'manual';
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
  
  // Basic
  transaction_type: TransactionType;
  property_type: PropertyType;
  title?: string;
  description?: string;
  
  // Location
  street?: string;
  house_number?: string;
  postal_code?: string;
  city: string;
  district?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  
  // Price (in cents)
  price?: number;
  
  // Rental-specific pricing
  cold_rent?: number;           // Kaltmiete (base rent)
  warm_rent?: number;           // Warmmiete (total rent with utilities)
  additional_costs?: number;    // Nebenkosten (utilities)
  deposit?: number;             // Kaution
  hoa_fees?: number;            // Hausgeld (for apartments)
  
  // Rental terms
  min_rental_period?: number;   // Minimum rental period in months
  max_rental_period?: number;   // Maximum rental period in months
  
  // Area
  living_area?: number;
  plot_area?: number;
  
  // Rooms
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  
  // Building
  floor?: number;
  total_floors?: number;
  construction_year?: number;
  last_renovation_year?: number;
  building_type?: BuildingType;
  condition?: PropertyCondition;
  
  // Energy
  energy_rating?: string;
  heating_type?: string;
  
  // Availability
  availability_date?: string;   // ISO date string
  is_immediately_available?: boolean;
  
  // Features
  features: ListingFeatures;
  
  // Contact override (per listing)
  contact_phone?: string;
  contact_email?: string;
  
  // Media
  media_ids: string[];
  cover_image_id?: string;
  
  // Proximity data (pre-computed)
  proximity_data?: ProximityData;
  
  // Status
  publish_status: PublishStatus;
  published_at?: string;
  
  // External
  external_id?: string;
  source?: string;
  
  // Timestamps
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
  latitude?: number;
  longitude?: number;
  
  price: number;
  cold_rent?: number;
  warm_rent?: number;
  additional_costs?: number;
  deposit?: number;
  hoa_fees?: number;
  
  min_rental_period?: number;
  max_rental_period?: number;
  
  living_area: number;
  plot_area: number;
  
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  
  floor: number;
  total_floors: number;
  
  construction_year: number;
  last_renovation_year?: number;
  building_type?: BuildingType;
  condition?: PropertyCondition;
  
  energy_rating: string;
  heating_type: string;
  
  availability_date?: string;
  is_immediately_available?: boolean;
  
  contact_phone?: string;
  contact_email?: string;
  
  features: ListingFeatures;
  media_ids: string[];
}

// Labels
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

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  neubau: 'Neubau',
  altbau: 'Altbau',
  plattenbau: 'Plattenbau',
  villa: 'Villa',
  bungalow: 'Bungalow',
  townhouse: 'Reihenhaus',
  farmhouse: 'Bauernhaus',
  duplex: 'Doppelhaushälfte',
};

export const CONDITION_LABELS: Record<PropertyCondition, string> = {
  first_occupancy: 'Erstbezug',
  new_build: 'Neubau',
  refurbished: 'Vollständig saniert',
  modernized: 'Modernisiert',
  well_kept: 'Gepflegt',
  needs_renovation: 'Renovierungsbedürftig',
  completely_renovated: 'Komplett renoviert',
};

export const FEATURE_LABELS: Record<keyof ListingFeatures, string> = {
  has_balcony: 'Balkon',
  has_terrace: 'Terrasse',
  has_garden: 'Garten',
  has_basement: 'Keller',
  has_elevator: 'Aufzug',
  has_parking: 'Parkplatz',
  parking_type: 'Parkplatz-Typ',
  parking_spaces: 'Anzahl Parkplätze',
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
  has_guest_toilet: 'Gäste-WC',
  has_attic: 'Dachboden',
  has_south_orientation: 'Südausrichtung',
  barrier_free: 'Barrierefrei',
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
