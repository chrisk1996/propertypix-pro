import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locale } = await request.json();

    if (!locale || !['de', 'en'].includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    // Update user's language preference
    const { error: updateError } = await supabase
      .from('zestio_users')
      .update({ language: locale })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating locale:', updateError);
      return NextResponse.json({ error: 'Failed to update language' }, { status: 500 });
    }

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    console.error('Locale update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
