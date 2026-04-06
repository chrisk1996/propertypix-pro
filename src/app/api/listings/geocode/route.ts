import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { geocodeAddress, fetchProximityData } from '@/lib/proximity-service';

export const dynamic = 'force-dynamic';

interface GeocodeRequest {
  street?: string;
  house_number?: string;
  postal_code?: string;
  city: string;
  country?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GeocodeRequest = await request.json();
    const { street, house_number, postal_code, city, country } = body;

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    // Step 1: Geocode the address
    const geoResult = await geocodeAddress(
      street,
      house_number,
      postal_code,
      city,
      country || 'Germany'
    );

    if (!geoResult) {
      return NextResponse.json(
        { error: 'Could not geocode address. Please check the location details.' },
        { status: 400 }
      );
    }

    const { latitude, longitude } = geoResult;

    // Step 2: Fetch proximity data
    const proximityData = await fetchProximityData(latitude, longitude);

    return NextResponse.json({
      latitude,
      longitude,
      proximity_data: proximityData,
    });
  } catch (error) {
    console.error('Geocode/proximity error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
}
