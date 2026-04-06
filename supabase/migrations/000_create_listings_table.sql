-- ============================================
-- Create Listings Table
-- Run this in your Supabase SQL editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic
  transaction_type TEXT NOT NULL DEFAULT 'sale' CHECK (transaction_type IN ('sale', 'rent')),
  property_type TEXT NOT NULL DEFAULT 'apartment' CHECK (property_type IN ('apartment', 'house', 'commercial', 'land', 'garage', 'other')),
  title TEXT,
  description TEXT,
  
  -- Location
  street TEXT,
  house_number TEXT,
  postal_code TEXT,
  city TEXT NOT NULL,
  district TEXT,
  country TEXT DEFAULT 'Deutschland',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Price (in cents)
  price INTEGER,
  
  -- Rental pricing (in cents)
  cold_rent INTEGER,
  warm_rent INTEGER,
  additional_costs INTEGER,
  deposit INTEGER,
  hoa_fees INTEGER,
  
  -- Rental terms
  min_rental_period INTEGER,
  max_rental_period INTEGER,
  
  -- Area
  living_area INTEGER,
  plot_area INTEGER,
  
  -- Rooms
  rooms INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  
  -- Building
  floor INTEGER,
  total_floors INTEGER,
  construction_year INTEGER,
  last_renovation_year INTEGER,
  building_type TEXT CHECK (building_type IN ('neubau', 'altbau', 'plattenbau', 'villa', 'bungalow', 'townhouse', 'farmhouse', 'duplex')),
  condition TEXT CHECK (condition IN ('first_occupancy', 'new_build', 'refurbished', 'modernized', 'well_kept', 'needs_renovation', 'completely_renovated')),
  
  -- Energy
  energy_rating TEXT,
  heating_type TEXT,
  
  -- Availability
  availability_date DATE,
  is_immediately_available BOOLEAN DEFAULT true,
  
  -- Contact override
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Features (JSONB for flexibility)
  features JSONB DEFAULT '{}',
  
  -- Media
  media_ids TEXT[] DEFAULT '{}',
  cover_image_id UUID,
  
  -- Proximity data
  proximity_data JSONB DEFAULT '{}',
  
  -- Status
  publish_status TEXT NOT NULL DEFAULT 'draft' CHECK (publish_status IN ('draft', 'pending', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  
  -- External
  external_id TEXT,
  source TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own listings" ON public.listings FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Users can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Users can update their own listings" ON public.listings FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Users can delete their own listings" ON public.listings FOR DELETE USING (auth.uid() = agent_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_agent ON public.listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(publish_status);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(latitude, longitude) WHERE latitude IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.listings IS 'Property listings created by agents';
COMMENT ON COLUMN public.listings.price IS 'Purchase price or base rent in cents';
COMMENT ON COLUMN public.listings.cold_rent IS 'Base rent without utilities (Kaltmiete) in cents';
COMMENT ON COLUMN public.listings.warm_rent IS 'Total rent including utilities (Warmmiete) in cents';
COMMENT ON COLUMN public.listings.additional_costs IS 'Utilities/ancillary costs (Nebenkosten) in cents';
COMMENT ON COLUMN public.listings.deposit IS 'Security deposit (Kaution) in cents';
COMMENT ON COLUMN public.listings.hoa_fees IS 'HOA fees (Hausgeld) in cents';
COMMENT ON COLUMN public.listings.proximity_data IS 'Pre-computed proximity information for nearby amenities';
