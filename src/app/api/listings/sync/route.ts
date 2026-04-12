import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Portal API configurations (to be filled later)
const PORTAL_CONFIGS = {
  is24: {
    name: 'ImmobilienScout24',
    apiBaseUrl: 'https://api.immobilienscout24.de',
    // apiKey: process.env.IS24_API_KEY, // TO BE ADDED
    enabled: false, // Grey out until API key added
  },
  immowelt: {
    name: 'ImmoWelt',
    apiBaseUrl: 'https://api.immowelt.de',
    // apiKey: process.env.IMMOWELT_API_KEY, // TO BE ADDED
    enabled: false,
  },
  immobilo: {
    name: 'Immobilo',
    apiBaseUrl: 'https://api.immobilo.de',
    // apiKey: process.env.IMMOBILO_API_KEY, // TO BE ADDED
    enabled: false,
  },
};

interface PortalSyncRequest {
  listingId: string;
  portals: string[];
}

interface PortalSyncResult {
  portal: string;
  success: boolean;
  externalId?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PortalSyncRequest = await request.json();
    const { listingId, portals } = body;

    // Validate listing exists and belongs to user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const results: PortalSyncResult[] = [];

    // Process each portal
    for (const portalId of portals) {
      const config = PORTAL_CONFIGS[portalId as keyof typeof PORTAL_CONFIGS];

      if (!config) {
        results.push({
          portal: portalId,
          success: false,
          error: 'Unknown portal',
        });
        continue;
      }

      // Check if portal is enabled (API key configured)
      if (!config.enabled) {
        results.push({
          portal: portalId,
          success: false,
          error: 'Portal not configured - API key required',
        });
        continue;
      }

      // Real API sync would happen here
      // For now, simulate success
      try {
        // TODO: Implement real API calls when keys are added
        // const response = await fetch(`${config.apiBaseUrl}/listings`, {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${config.apiKey}`,
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(listing),
        // });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Store sync result in database
        const { error: syncError } = await supabase
          .from('listing_portal_syncs')
          .upsert({
            listing_id: listingId,
            portal: portalId,
            status: 'synced',
            synced_at: new Date().toISOString(),
            external_id: `${portalId}-${Date.now()}`, // Would come from API
          }, {
            onConflict: 'listing_id,portal',
          });

        if (syncError) {
          console.error('Failed to store sync result:', syncError);
        }

        results.push({
          portal: portalId,
          success: true,
          externalId: `${portalId}-${Date.now()}`,
        });
      } catch (error) {
        results.push({
          portal: portalId,
          success: false,
          error: error instanceof Error ? error.message : 'Sync failed',
        });
      }
    }

    // Update listing status if all succeeded
    const allSuccess = results.every(r => r.success);
    if (allSuccess) {
      await supabase
        .from('listings')
        .update({ status: 'published' })
        .eq('id', listingId);
    }

    return NextResponse.json({
      success: allSuccess,
      results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Portal sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync to portals' },
      { status: 500 }
    );
  }
}

// Get sync status for a listing
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 });
    }

    const { data: syncs, error } = await supabase
      .from('listing_portal_syncs')
      .select('*')
      .eq('listing_id', listingId);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch syncs' }, { status: 500 });
    }

    return NextResponse.json({ syncs: syncs || [] });
  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
