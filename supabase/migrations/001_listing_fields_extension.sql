-- ============================================
-- Listing Fields Extension Migration
-- Run this in your Supabase SQL editor
-- ============================================

-- Add new columns to listings table

-- Geo-location
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Rental-specific pricing
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS cold_rent INTEGER;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS warm_rent INTEGER;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS additional_costs INTEGER;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS deposit INTEGER;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS hoa_fees INTEGER;

-- Rental terms
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS min_rental_period INTEGER;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS max_rental_period INTEGER;

-- Building details
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS last_renovation_year INTEGER;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS building_type TEXT CHECK (building_type IN ('neubau', 'altbau', 'plattenbau', 'villa', 'bungalow', 'townhouse', 'farmhouse', 'duplex'));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('first_occupancy', 'new_build', 'refurbished', 'modernized', 'well_kept', 'needs_renovation', 'completely_renovated'));

-- Availability
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS availability_date DATE;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_immediately_available BOOLEAN DEFAULT true;

-- Contact override
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Proximity data (JSONB for flexible structure)
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS proximity_data JSONB DEFAULT '{}';

-- Index for geo queries
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(latitude, longitude) WHERE latitude IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN public.listings.cold_rent IS 'Base rent without utilities (Kaltmiete) in cents';
COMMENT ON COLUMN public.listings.warm_rent IS 'Total rent including utilities (Warmmiete) in cents';
COMMENT ON COLUMN public.listings.additional_costs IS 'Utilities/ancillary costs (Nebenkosten) in cents';
COMMENT ON COLUMN public.listings.deposit IS 'Security deposit (Kaution) in cents';
COMMENT ON COLUMN public.listings.hoa_fees IS 'HOA fees (Hausgeld) in cents';
COMMENT ON COLUMN public.listings.proximity_data IS 'Pre-computed proximity information for nearby amenities';
