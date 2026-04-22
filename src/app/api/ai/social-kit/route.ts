import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { authenticateRequest, logApiUsage } from '@/lib/api-auth';

// Platform image dimensions for real estate social media
export const platformFormats = {
  instagram_post: { width: 1080, height: 1080, label: 'Instagram Post', platform: 'instagram' },
  instagram_story: { width: 1080, height: 1920, label: 'Instagram Story', platform: 'instagram' },
  instagram_reel: { width: 1080, height: 1920, label: 'Instagram Reel Cover', platform: 'instagram' },
  facebook_post: { width: 1200, height: 630, label: 'Facebook Post', platform: 'facebook' },
  facebook_cover: { width: 820, height: 312, label: 'Facebook Cover', platform: 'facebook' },
  linkedin_post: { width: 1200, height: 627, label: 'LinkedIn Post', platform: 'linkedin' },
  linkedin_banner: { width: 1584, height: 396, label: 'LinkedIn Banner', platform: 'linkedin' },
  twitter_post: { width: 1200, height: 675, label: 'X/Twitter Post', platform: 'twitter' },
  twitter_header: { width: 1500, height: 500, label: 'X/Twitter Header', platform: 'twitter' },
  pinterest: { width: 1000, height: 1500, label: 'Pinterest Pin', platform: 'pinterest' },
  whatsapp_status: { width: 1080, height: 1920, label: 'WhatsApp Status', platform: 'whatsapp' },
} as const;

export type PlatformFormat = keyof typeof platformFormats;

interface SocialKitRequest {
  imageUrl: string;
  propertyTitle?: string;
  propertyPrice?: string;
  formats?: PlatformFormat[];
  branding?: {
    logo?: string;
    agentName?: string;
    phone?: string;
    agency?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SocialKitRequest = await request.json();
    const {
      imageUrl,
      propertyTitle,
      propertyPrice,
      formats = ['instagram_post', 'facebook_post', 'linkedin_post', 'twitter_post', 'instagram_story'],
      branding,
    } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // Return the kit — client-side canvas rendering handles the actual resizing
    // This endpoint provides the metadata + platform specs
    const kit = formats.map(formatKey => {
      const spec = platformFormats[formatKey];
      if (!spec) return null;
      return {
        format: formatKey,
        ...spec,
        // Client will append these as URL params for canvas-based resizing
        resizeUrl: `${imageUrl}#width=${spec.width}&height=${spec.height}`,
        overlay: {
          title: propertyTitle,
          price: propertyPrice,
          branding,
        },
      };
    }).filter(Boolean);

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    logApiUsage({
      apiKeyId: authResult.apiKeyId,
      userId: authResult.userId,
      endpoint: '/api/ai/social-kit',
      creditsUsed: 0,
      statusCode: 200,
      ipAddress: ip,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      kit,
      branding,
      totalFormats: kit.length,
    });

  } catch (error) {
    console.error('[Social Kit] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate social kit' },
      { status: 500 }
    );
  }
}
