import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/listings - List all listings for the authenticated agent
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const transaction_type = searchParams.get('transaction_type');
    const property_type = searchParams.get('property_type');
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('listings')
      .select(`
        id,
        transaction_type,
        property_type,
        title,
        street,
        house_number,
        postal_code,
        city,
        price,
        living_area,
        rooms,
        bedrooms,
        bathrooms,
        publish_status,
        media_ids,
        created_at,
        updated_at,
        published_at
      `)
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('publish_status', status);
    }
    if (transaction_type) {
      query = query.eq('transaction_type', transaction_type);
    }
    if (property_type) {
      query = query.eq('property_type', property_type);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    const { data: listings, error: listingsError } = await query;

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', user.id);

    if (countError) {
      console.error('Error counting listings:', countError);
    }

    return NextResponse.json({
      listings: listings || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error) {
    console.error('Listings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/listings - Create a new listing
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const { transaction_type, property_type, city } = body;
    if (!transaction_type || !property_type || !city) {
      return NextResponse.json(
        { error: 'transaction_type, property_type, and city are required' },
        { status: 400 }
      );
    }

    // Validate enum values
    const validTransactionTypes = ['sale', 'rent'];
    const validPropertyTypes = ['apartment', 'house', 'commercial', 'land', 'garage', 'other'];

    if (!validTransactionTypes.includes(transaction_type)) {
      return NextResponse.json(
        { error: `Invalid transaction_type. Must be one of: ${validTransactionTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validPropertyTypes.includes(property_type)) {
      return NextResponse.json(
        { error: `Invalid property_type. Must be one of: ${validPropertyTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare listing data
    const listingData = {
      agent_id: user.id,
      transaction_type,
      property_type,
      city,
      title: body.title || null,
      description: body.description || null,
      street: body.street || null,
      house_number: body.house_number || null,
      postal_code: body.postal_code || null,
      district: body.district || null,
      country: body.country || 'Deutschland',
      price: body.price ? Math.round(body.price * 100) : null, // Convert to cents
      living_area: body.living_area || null,
      plot_area: body.plot_area || null,
      rooms: body.rooms || null,
      bedrooms: body.bedrooms || null,
      bathrooms: body.bathrooms || null,
      floor: body.floor || null,
      total_floors: body.total_floors || null,
      construction_year: body.construction_year || null,
      energy_rating: body.energy_rating || null,
      heating_type: body.heating_type || null,
      features: body.features || {},
      media_ids: body.media_ids || [],
      publish_status: 'draft',
      external_id: body.external_id || null,
      source: body.source || null
    };

    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert(listingData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating listing:', insertError);
      return NextResponse.json(
        { error: 'Failed to create listing', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error('Listing creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
