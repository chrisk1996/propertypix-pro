import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/portals/status - List connected portals
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Define available portals
    const availablePortals = [
      {
        name: 'immobilienscout24',
        display_name: 'ImmobilienScout24',
        url: 'https://www.immobilienscout24.de',
        icon: '/icons/immobilienscout24.svg'
      },
      {
        name: 'immowelt',
        display_name: 'Immowelt',
        url: 'https://www.immowelt.de',
        icon: '/icons/immowelt.svg'
      },
      {
        name: 'ebay_kleinanzeigen',
        display_name: 'eBay Kleinanzeigen',
        url: 'https://www.kleinanzeigen.de',
        icon: '/icons/ebay.svg'
      },
      {
        name: 'immobilier',
        display_name: 'Immobilier',
        url: 'https://www.immobilier.fr',
        icon: '/icons/immobilier.svg'
      }
    ];

    // Get user's connected portals
    const { data: credentials, error: credError } = await supabase
      .from('portal_credentials')
      .select('portal_name, status, last_used_at, created_at, portal_user_id, portal_account_id')
      .eq('agent_id', user.id);

    if (credError) {
      console.error('Error fetching credentials:', credError);
      return NextResponse.json(
        { error: 'Failed to fetch portal status' },
        { status: 500 }
      );
    }

    // Map credentials to portals
    const connectedMap = new Map(
      (credentials || []).map(cred => [cred.portal_name, cred])
    );

    // Build response
    const portals = availablePortals.map(portal => {
      const connected = connectedMap.get(portal.name);
      return {
        ...portal,
        connected: !!connected && connected.status === 'active',
        status: connected?.status || 'not_connected',
        last_used_at: connected?.last_used_at || null,
        connected_at: connected?.created_at || null,
        portal_user_id: connected?.portal_user_id || null
      };
    });

    return NextResponse.json({
      portals,
      summary: {
        total: availablePortals.length,
        connected: portals.filter(p => p.connected).length
      }
    });
  } catch (error) {
    console.error('Portal status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
