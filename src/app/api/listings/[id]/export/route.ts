import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

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
    const format = request.nextUrl.searchParams.get('format') || 'json';

    // Fetch listing
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('agent_id', user.id)
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Format prices (cents to EUR)
    const formattedListing = {
      ...listing,
      price_eur: listing.price ? listing.price / 100 : null,
      cold_rent_eur: listing.cold_rent ? listing.cold_rent / 100 : null,
      warm_rent_eur: listing.warm_rent ? listing.warm_rent / 100 : null,
      additional_costs_eur: listing.additional_costs ? listing.additional_costs / 100 : null,
      deposit_eur: listing.deposit ? listing.deposit / 100 : null,
      hoa_fees_eur: listing.hoa_fees ? listing.hoa_fees / 100 : null,
    };

    if (format === 'json') {
      return new NextResponse(JSON.stringify(formattedListing, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="listing-${id}.json"`,
        },
      });
    }

    if (format === 'csv') {
      const fields = [
        'id', 'title', 'transaction_type', 'property_type', 'city', 'postal_code', 'street', 'house_number',
        'price_eur', 'cold_rent_eur', 'warm_rent_eur', 'rooms', 'bedrooms', 'bathrooms', 'living_area',
        'construction_year', 'energy_rating', 'heating_type', 'condition', 'building_type',
        'availability_date', 'contact_phone', 'contact_email', 'created_at'
      ];
      const csvHeader = fields.join(',');
      const csvRow = fields.map(f => {
        const val = formattedListing[f as keyof typeof formattedListing];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return String(val);
      }).join(',');
      
      const csv = `${csvHeader}\n${csvRow}`;
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="listing-${id}.csv"`,
        },
      });
    }

    if (format === 'pdf') {
      // For PDF, return a simple HTML that can be printed to PDF
      const html = generateListingHTML(formattedListing);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="listing-${id}.html"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function generateListingHTML(listing: Record<string, unknown>): string {
  const formatPrice = (val: number | null) => val ? `€${val.toLocaleString()}` : '-';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${listing.title || 'Property Listing'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1d2832; }
    h1 { color: #1d2832; border-bottom: 2px solid #006c4d; padding-bottom: 10px; }
    .section { margin: 20px 0; }
    .section h2 { color: #006c4d; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { }
    .label { font-size: 10px; text-transform: uppercase; color: #74777d; letter-spacing: 0.5px; }
    .value { font-size: 16px; font-weight: 500; margin-top: 4px; }
    .price { font-size: 28px; color: #006c4d; font-weight: bold; }
    .description { line-height: 1.6; color: #43474c; margin-top: 10px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${listing.title || 'Property Listing'}</h1>
  
  <div class="price">${formatPrice(listing.price_eur as number | null)}</div>
  
  <div class="section">
    <h2>Location</h2>
    <div class="grid">
      <div class="field"><div class="label">Address</div><div class="value">${listing.street || ''} ${listing.house_number || ''}</div></div>
      <div class="field"><div class="label">City</div><div class="value">${listing.postal_code || ''} ${listing.city || ''}</div></div>
    </div>
  </div>
  
  <div class="section">
    <h2>Property Details</h2>
    <div class="grid">
      <div class="field"><div class="label">Rooms</div><div class="value">${listing.rooms || '-'}</div></div>
      <div class="field"><div class="label">Living Area</div><div class="value">${listing.living_area ? `${listing.living_area} m²` : '-'}</div></div>
      <div class="field"><div class="label">Bedrooms</div><div class="value">${listing.bedrooms || '-'}</div></div>
      <div class="field"><div class="label">Bathrooms</div><div class="value">${listing.bathrooms || '-'}</div></div>
      <div class="field"><div class="label">Year Built</div><div class="value">${listing.construction_year || '-'}</div></div>
      <div class="field"><div class="label">Energy Rating</div><div class="value">${listing.energy_rating || '-'}</div></div>
    </div>
  </div>
  
  ${listing.description ? `<div class="section"><h2>Description</h2><div class="description">${listing.description}</div></div>` : ''}
  
  <div class="section">
    <h2>Contact</h2>
    <div class="grid">
      <div class="field"><div class="label">Phone</div><div class="value">${listing.contact_phone || 'On request'}</div></div>
      <div class="field"><div class="label">Email</div><div class="value">${listing.contact_email || 'On request'}</div></div>
    </div>
  </div>
  
  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #74777d;">
    Generated by PropertyPix Pro • ${new Date().toLocaleDateString('de-DE')}
  </footer>
</body>
</html>`;
}
