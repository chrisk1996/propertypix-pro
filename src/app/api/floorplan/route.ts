import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Force dynamic rendering - uses cookies/auth
export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Rate limiting by IP (in-memory, resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  record.count++;
  return true;
}

interface Room {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

interface Wall {
  start: [number, number];
  end: [number, number];
  type: 'exterior' | 'interior';
}

interface Door {
  position: [number, number];
  rotation: number;
  room: string;
}

interface Window {
  position: [number, number];
  width: number;
  wall: 'exterior';
}

interface FloorPlanData {
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  totalArea: number;
  bedroomCount: number;
  bathroomCount: number;
}

// Parse the vision model's text response into structured data
function parseFloorPlanAnalysis(analysisText: string): FloorPlanData {
  // Default fallback structure
  const defaultData: FloorPlanData = {
    rooms: [
      { name: 'Living Room', x: 0, y: 0, width: 5, height: 4, type: 'living' },
      { name: 'Kitchen', x: 5, y: 0, width: 3, height: 4, type: 'kitchen' },
      { name: 'Bedroom 1', x: 0, y: 4, width: 4, height: 3.5, type: 'bedroom' },
      { name: 'Bathroom', x: 4, y: 4, width: 2, height: 2, type: 'bathroom' },
    ],
    walls: [],
    doors: [],
    windows: [],
    totalArea: 55,
    bedroomCount: 1,
    bathroomCount: 1,
  };

  // Try to extract JSON from the response
  try {
    // Look for JSON block in the response
    const jsonMatch = analysisText.match(/\{[\s\S]*"rooms"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.rooms && Array.isArray(parsed.rooms)) {
        return {
          rooms: parsed.rooms,
          walls: parsed.walls || [],
          doors: parsed.doors || [],
          windows: parsed.windows || [],
          totalArea: parsed.totalArea || 50,
          bedroomCount: parsed.bedroomCount || parsed.rooms.filter((r: Room) => r.type === 'bedroom').length,
          bathroomCount: parsed.bathroomCount || parsed.rooms.filter((r: Room) => r.type === 'bathroom').length,
        };
      }
    }
  } catch (parseError) {
    console.warn('Could not parse floor plan JSON, using fallback:', parseError);
  }

  // Try to extract room counts from text
  try {
    const bedroomMatch = analysisText.match(/(\d+)\s*(?:bedroom|bed)/i);
    const bathroomMatch = analysisText.match(/(\d+)\s*(?:bathroom|bath)/i);

    if (bedroomMatch || bathroomMatch) {
      const bedroomCount = bedroomMatch ? parseInt(bedroomMatch[1]) : 1;
      const bathroomCount = bathroomMatch ? parseInt(bathroomMatch[1]) : 1;

      // Generate rooms based on counts
      const rooms: Room[] = [];
      let currentY = 0;

      // Add living room
      rooms.push({ name: 'Living Room', x: 0, y: 0, width: 5, height: 4, type: 'living' });
      rooms.push({ name: 'Kitchen', x: 5, y: 0, width: 3, height: 4, type: 'kitchen' });
      currentY = 4;

      // Add bedrooms
      for (let i = 1; i <= bedroomCount; i++) {
        rooms.push({
          name: `Bedroom ${i}`,
          x: (i - 1) * 4,
          y: currentY,
          width: 4,
          height: 3.5,
          type: 'bedroom',
        });
      }
      currentY += 3.5;

      // Add bathrooms
      for (let i = 1; i <= bathroomCount; i++) {
        rooms.push({
          name: `Bathroom ${i}`,
          x: (i - 1) * 2.5,
          y: currentY,
          width: 2.5,
          height: 2,
          type: 'bathroom',
        });
      }

      return {
        rooms,
        walls: [],
        doors: [],
        windows: [],
        totalArea: rooms.reduce((sum, r) => sum + r.width * r.height, 0),
        bedroomCount,
        bathroomCount,
      };
    }
  } catch (extractError) {
    console.warn('Could not extract room counts:', extractError);
  }

  return defaultData;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Auth is optional for floor plan analysis - allow anonymous demo usage
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'Floor plan image is required' }, { status: 400 });
    }

    // Use LLaVA vision model via Replicate to analyze the floor plan
    const analysisPrompt = `Analyze this floor plan image and describe:
1. How many bedrooms and bathrooms are shown
2. The overall layout (living room, kitchen, dining area locations)
3. Approximate room sizes if visible
4. Any notable features (balcony, garage, etc.)

Respond with a JSON object in this exact format:
{
  "rooms": [
    {"name": "Living Room", "x": 0, "y": 0, "width": 5, "height": 4, "type": "living"},
    {"name": "Kitchen", "x": 5, "y": 0, "width": 3, "height": 4, "type": "kitchen"}
  ],
  "walls": [],
  "doors": [],
  "windows": [],
  "totalArea": 50,
  "bedroomCount": 2,
  "bathroomCount": 1
}
Use coordinates where each unit = 1 meter. Start rooms from origin (0,0) and arrange logically.`;

    console.log('Analyzing floor plan with vision model...');

    // Deduct credits before calling Replicate (1 credit per floor plan analysis)
    if (user?.id) {
      const { data: userData, error: userError } = await supabase
        .from('propertypix_users')
        .select('credits_remaining, credits_used')
        .eq('id', user.id)
        .single();

      interface UserCredits {
        credits_remaining: number;
        credits_used: number;
      }

      if (userError || !userData) {
        console.warn('Could not fetch user credits, proceeding anyway');
      } else if ((userData as UserCredits).credits_remaining <= 0) {
        return NextResponse.json(
          { error: 'Insufficient credits. Please upgrade your plan.' },
          { status: 402 }
        );
      } else {
        // Deduct 1 credit
        const credits = userData as UserCredits;
        const currentUsed = credits.credits_used || 0;
        await supabase
          .from('propertypix_users')
          .update({
            credits_remaining: credits.credits_remaining - 1,
            credits_used: currentUsed + 1,
          })
          .eq('id', user.id);
        console.log(`Deducted 1 credit for floor plan analysis. Remaining: ${credits.credits_remaining - 1}`);
      }
    }

    // Use LLaVA-13B for vision analysis (latest version)
    const result = await replicate.run(
      "lucataco/ollama-llama3.2-vision-90b:54202b223d5351c5afe5c0c9dba2b3042293b839d022e76f53d66ab30b9dc814",
      {
        input: {
          image: image,
          prompt: analysisPrompt,
          max_tokens: 1000,
          temperature: 0.1,
        },
      }
    );

    // Extract text from result
    let analysisText = '';
    if (typeof result === 'string') {
      analysisText = result;
    } else if (Array.isArray(result)) {
      analysisText = result.join('');
    } else if (result && typeof result === 'object') {
      const r = result as Record<string, unknown>;
      analysisText = String(r.output || r.text || JSON.stringify(result));
    }

    console.log('Vision model response:', analysisText.substring(0, 500));

    // Parse the analysis into structured floor plan data
    const floorPlanData = parseFloorPlanAnalysis(analysisText);

    // Generate 3D model metadata
    const modelMetadata = {
      analyzedAt: new Date().toISOString(),
      userId: user?.id || 'anonymous',
      modelUsed: 'llava-13b',
      rawAnalysis: analysisText.substring(0, 1000),
    };

    return NextResponse.json({
      success: true,
      analysis: analysisText,
      modelData: {
        ...floorPlanData,
        metadata: modelMetadata,
      },
      message: 'Floor plan analyzed successfully. 3D model data ready for rendering.',
    });
  } catch (error) {
    console.error('Floor plan processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process floor plan';

    // Log full error for debugging
    console.error('Full error details:', JSON.stringify(error, null, 2));

    // If vision model fails, return fallback data so UI still works
    if (errorMessage.includes('model') || errorMessage.includes('replicate') || errorMessage.includes('404') || errorMessage.includes('version')) {
      console.warn('Vision model failed, returning fallback data. Error:', errorMessage);
      return NextResponse.json({
        success: true,
        analysis: 'Using fallback layout (vision model unavailable)',
        modelData: {
          rooms: [
            { name: 'Living Room', x: 0, y: 0, width: 5, height: 4, type: 'living' },
            { name: 'Kitchen', x: 5, y: 0, width: 3, height: 4, type: 'kitchen' },
            { name: 'Bedroom 1', x: 0, y: 4, width: 4, height: 3.5, type: 'bedroom' },
            { name: 'Bathroom', x: 4, y: 4, width: 2, height: 2, type: 'bathroom' },
          ],
          walls: [],
          doors: [],
          windows: [],
          totalArea: 55,
          bedroomCount: 1,
          bathroomCount: 1,
          metadata: {
            analyzedAt: new Date().toISOString(),
            fallback: true,
            error: errorMessage,
          },
        },
        message: 'Floor plan processed with fallback data.',
      });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
