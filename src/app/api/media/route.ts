import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering - uses cookies/auth
export const dynamic = 'force-dynamic';

// GET /api/media - List user's media assets (enhanced images from Zestio)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    // Future: could filter by type (image, video, 3d)
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch completed enhancement jobs from zestio_jobs table
    // These are the user's Zestio assets (enhanced photos)
    const query = supabase
      .from('zestio_jobs')
      .select('id, output_url, input_url, job_type, status, created_at, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('output_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      console.error('Error fetching media:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }

    // Transform jobs into media items
    const mediaItems = (jobs || []).map(job => ({
      id: job.id,
      url: job.output_url,
      thumbnail_url: job.output_url, // Could be different for videos/3D
      original_url: job.input_url,
      type: 'image', // All enhancement jobs produce images
      subtype: job.job_type, // 'auto', 'sky', 'staging', 'object_removal'
      filename: `enhanced-${job.job_type}-${job.id}.png`,
      created_at: job.created_at,
      completed_at: job.completed_at,
    }));

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('zestio_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('output_url', 'is', null);

    if (countError) {
      console.error('Error counting media:', countError);
    }

    return NextResponse.json({
      media: mediaItems,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error) {
    console.error('Media fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
