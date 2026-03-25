import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/listings/[id]/publish - Trigger syndication to portals
export async function POST(
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
    const { portals = ['immobilienscout24'] } = body;

    // Validate portals
    const validPortals = ['immobilienscout24', 'immowelt', 'ebay_kleinanzeigen', 'immobilier'];
    const invalidPortals = portals.filter((p: string) => !validPortals.includes(p));
    if (invalidPortals.length > 0) {
      return NextResponse.json(
        { error: `Invalid portals: ${invalidPortals.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if listing exists and belongs to user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('agent_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Validate listing has required fields for publishing
    const requiredFields = ['title', 'description', 'price', 'living_area', 'city'];
    const missingFields = requiredFields.filter(field => !listing[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields for publishing: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if agent has valid credentials for each portal
    const { data: credentials, error: credError } = await supabase
      .from('portal_credentials')
      .select('portal_name, status')
      .eq('agent_id', user.id)
      .in('portal_name', portals)
      .eq('status', 'active');

    if (credError) {
      console.error('Error checking credentials:', credError);
    }

    const connectedPortals = (credentials || []).map(c => c.portal_name);
    const unconnectedPortals = portals.filter((p: string) => !connectedPortals.includes(p));

    if (unconnectedPortals.length > 0) {
      return NextResponse.json(
        { 
          error: `Not connected to portals: ${unconnectedPortals.join(', ')}`,
          hint: 'Connect your portal accounts first via /api/portals/connect'
        },
        { status: 400 }
      );
    }

    // Create syndication logs for each portal
    const syndicationEntries = portals.map((portal: string) => ({
      listing_id: id,
      agent_id: user.id,
      portal_name: portal,
      status: 'pending',
      request_data: {
        listing: {
          title: listing.title,
          description: listing.description,
          price: listing.price,
          living_area: listing.living_area,
          rooms: listing.rooms,
          address: {
            street: listing.street,
            house_number: listing.house_number,
            postal_code: listing.postal_code,
            city: listing.city
          },
          property_type: listing.property_type,
          transaction_type: listing.transaction_type,
          features: listing.features,
          media_ids: listing.media_ids
        }
      }
    }));

    const { data: syndicationLogs, error: logError } = await supabase
      .from('syndication_logs')
      .insert(syndicationEntries)
      .select();

    if (logError) {
      console.error('Error creating syndication logs:', logError);
      return NextResponse.json(
        { error: 'Failed to initiate syndication' },
        { status: 500 }
      );
    }

    // Update listing status to pending
    await supabase
      .from('listings')
      .update({ publish_status: 'pending' })
      .eq('id', id);

    // In a real implementation, this would trigger a background job
    // to process the syndication via BullMQ or similar
    // For now, we just create the pending logs

    return NextResponse.json({
      success: true,
      message: `Syndication initiated for ${portals.length} portal(s)`,
      syndication: syndicationLogs.map(log => ({
        id: log.id,
        portal: log.portal_name,
        status: log.status
      })),
      note: 'Syndication will be processed in the background. Check status via GET /api/listings/[id]'
    });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
