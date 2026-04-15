import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering - uses cookies/auth
export const dynamic = 'force-dynamic';

// GET /api/listings/[id] - Get a single listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('agent_id', user.id)
      .single();

    if (listingError) {
      if (listingError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }
      console.error('Error fetching listing:', listingError);
      return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
    }

    // Fetch associated media
    let media: unknown[] = [];
    if (listing.media_ids && listing.media_ids.length > 0) {
      const { data: mediaData, error: mediaError } = await supabase
        .from('zestio_media')
        .select('*')
        .in('id', listing.media_ids);

      if (!mediaError && mediaData) {
        media = mediaData;
      }
    }

    // Fetch syndication logs
    const { data: syndicationLogs } = await supabase
      .from('syndication_logs')
      .select('*')
      .eq('listing_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      listing,
      media,
      syndicationLogs: syndicationLogs || []
    });
  } catch (error) {
    console.error('Listing fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/listings/[id] - Update a listing
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if listing exists and belongs to user
    const { data: existingListing, error: checkError } = await supabase
      .from('listings')
      .select('id, publish_status')
      .eq('id', id)
      .eq('agent_id', user.id)
      .single();

    if (checkError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Validate enum values if provided
    if (body.transaction_type) {
      const validTransactionTypes = ['sale', 'rent'];
      if (!validTransactionTypes.includes(body.transaction_type)) {
        return NextResponse.json(
          { error: 'Invalid transaction_type' },
          { status: 400 }
        );
      }
    }

    if (body.property_type) {
      const validPropertyTypes = ['apartment', 'house', 'commercial', 'land', 'garage', 'other'];
      if (!validPropertyTypes.includes(body.property_type)) {
        return NextResponse.json(
          { error: 'Invalid property_type' },
          { status: 400 }
        );
      }
    }

    // Prepare update data (only allow updating specific fields)
    const updateData: Record<string, unknown> = {};
    
    const allowedFields = [
      'title', 'description', 'transaction_type', 'property_type',
      'street', 'house_number', 'postal_code', 'city', 'district', 'country',
      'price', 'living_area', 'plot_area', 'rooms', 'bedrooms', 'bathrooms',
      'floor', 'total_floors', 'construction_year', 'energy_rating', 'heating_type',
      'features', 'media_ids'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'price' && body[field] !== null) {
          updateData[field] = Math.round(body[field] * 100); // Convert to cents
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: listing, error: updateError } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .eq('agent_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating listing:', updateError);
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Listing update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/[id] - Delete a listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if listing exists and belongs to user
    const { data: existingListing, error: checkError } = await supabase
      .from('listings')
      .select('id, publish_status')
      .eq('id', id)
      .eq('agent_id', user.id)
      .single();

    if (checkError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Don't allow deletion of published listings (should archive instead)
    if (existingListing.publish_status === 'published') {
      return NextResponse.json(
        { error: 'Cannot delete published listings. Archive instead.' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('agent_id', user.id);

    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Listing deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
