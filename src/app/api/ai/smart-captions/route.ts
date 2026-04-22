import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { authenticateRequest, logApiUsage } from '@/lib/api-auth';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

interface CaptionRequest {
  image?: string;
  property_type?: string;
  city?: string;
  price?: string;
  bedrooms?: number;
  highlights?: string[];
  platforms?: ('instagram' | 'facebook' | 'linkedin' | 'twitter')[];
  tone?: 'professional' | 'luxury' | 'casual' | 'urgency';
  language?: 'en' | 'de';
}

const platformRules: Record<string, { maxLength: number; hashtagCount: number; emoji: boolean }> = {
  instagram: { maxLength: 2200, hashtagCount: 15, emoji: true },
  facebook: { maxLength: 5000, hashtagCount: 5, emoji: true },
  linkedin: { maxLength: 3000, hashtagCount: 5, emoji: false },
  twitter: { maxLength: 280, hashtagCount: 3, emoji: true },
};

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.userId;

    const body: CaptionRequest = await request.json();
    const {
      property_type = 'Property',
      city = '',
      price = '',
      bedrooms,
      highlights = [],
      platforms = ['instagram', 'facebook', 'linkedin'],
      tone = 'professional',
      language = 'en',
    } = body;

    const isGerman = language === 'de';

    const propertyDesc = [
      `${bedrooms || ''} ${isGerman ? 'Schlafzimmer' : 'bedroom'}`,
      property_type,
      city && `in ${city}`,
      price && `${isGerman ? 'für' : 'for'} ${price}`,
    ].filter(Boolean).join(' ');

    const highlightsText = highlights.length > 0
      ? (isGerman ? `Highlights: ${highlights.join(', ')}` : `Highlights: ${highlights.join(', ')}`)
      : '';

    const toneGuide: Record<string, string> = {
      professional: isGerman ? 'Professionell und sachlich' : 'Professional and informative',
      luxury: isGerman ? 'Luxuriös und elegant' : 'Luxurious and aspirational',
      casual: isGerman ? 'Locker und freundlich' : 'Casual and friendly',
      urgency: isGerman ? 'Dringend, FOMO-erzeugend' : 'Urgent, creating FOMO',
    };

    const platformNames = platforms.map(p => {
      const rules = platformRules[p];
      return `${p}: max ${rules.maxLength} chars, ${rules.hashtagCount} hashtags${rules.emoji ? ', emojis OK' : ', no emojis'}`;
    }).join('\n');

    const prompt = isGerman
      ? `Du bist ein Social-Media-Experte für Immobilien. Erstelle ansprechende Captions für eine Immobilie.

Immobilie: ${propertyDesc}
${highlightsText}
Tonalität: ${toneGuide[tone]}

Erstelle für jede Plattform eine passende Caption:
${platformNames}

Antworte als JSON:
{
  "captions": {
    "instagram": { "text": "...", "hashtags": ["..."] },
    "facebook": { "text": "...", "hashtags": ["..."] },
    "linkedin": { "text": "...", "hashtags": ["..."] },
    "twitter": { "text": "...", "hashtags": ["..."] }
  },
  "suggestedHashtags": ["immobilien", ...]
}`
      : `You are a real estate social media expert. Create engaging captions for a property listing.

Property: ${propertyDesc}
${highlightsText}
Tone: ${toneGuide[tone]}

Create a caption for each platform:
${platformNames}

Respond as JSON:
{
  "captions": {
    "instagram": { "text": "...", "hashtags": ["..."] },
    "facebook": { "text": "...", "hashtags": ["..."] },
    "linkedin": { "text": "...", "hashtags": ["..."] },
    "twitter": { "text": "...", "hashtags": ["..."] }
  },
  "suggestedHashtags": ["realestate", ...]
}`;

    const result = await replicate.run(
      "meta/meta-llama-3.1-8b-instruct",
      {
        input: {
          prompt,
          max_tokens: 1500,
          temperature: 0.8,
          top_p: 0.9,
          system_prompt: isGerman
            ? "Du bist ein Social-Media-Experte. Antworte nur mit gültigem JSON."
            : "You are a social media expert. Respond only with valid JSON.",
        },
      }
    );

    let responseText = '';
    if (typeof result === 'string') responseText = result;
    else if (Array.isArray(result)) responseText = result.join('');
    else if (result) responseText = String(result);

    let parsed: { captions?: Record<string, { text: string; hashtags: string[] }>; suggestedHashtags?: string[] } = {};
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('[Captions] Parse error');
    }

    // Ensure all requested platforms have entries
    const captions: Record<string, { text: string; hashtags: string[] }> = {};
    for (const platform of platforms) {
      if (parsed.captions?.[platform]?.text) {
        captions[platform] = parsed.captions[platform];
      } else {
        // Fallback caption
        const fallback = isGerman
          ? `🏡 ${propertyDesc} – ${highlights.length > 0 ? highlights.slice(0, 3).join(', ') + ' und mehr!' : 'Jetzt ansehen!'}`
          : `🏡 ${propertyDesc} – ${highlights.length > 0 ? highlights.slice(0, 3).join(', ') + ' and more!' : 'Check it out!'}`;
        const fallbackTags = isGerman
          ? ['#immobilien', '#wohnung', '#hauskaufen', '#immobilienmakler', '#eigentum']
          : ['#realestate', '#property', '#homeforsale', '#realtor', '#dreamhome'];
        captions[platform] = { text: fallback, hashtags: fallbackTags.slice(0, platformRules[platform]?.hashtagCount || 5) };
      }
    }

    logApiUsage({
      apiKeyId: authResult.apiKeyId,
      userId,
      endpoint: '/api/ai/smart-captions',
      creditsUsed: 0,
      statusCode: 200,
      ipAddress: ip,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      captions,
      suggestedHashtags: parsed.suggestedHashtags || (isGerman
        ? ['#immobilien', '#wohnung', '#haus', '#immobilienmakler', '#neueszuhause']
        : ['#realestate', '#property', '#home', '#realtor', '#newhome']),
    });

  } catch (error) {
    console.error('[Captions] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate captions' },
      { status: 500 }
    );
  }
}
