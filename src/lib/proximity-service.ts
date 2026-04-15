import { ProximityData, ProximityPOI } from '@/types/listing';

interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
  name?: string;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate walking time (assumes ~5km/h walking speed)
function estimateWalkingTime(distanceMeters: number): number {
  const walkingSpeedMetersPerMinute = 83; // ~5 km/h
  return Math.round(distanceMeters / walkingSpeedMetersPerMinute);
}

// Convert Overpass element to POI
function elementToPOI(element: OverpassElement, userLat: number, userLon: number): ProximityPOI {
  const distance = calculateDistance(userLat, userLon, element.lat, element.lon);
  return {
    name: element.tags?.name || element.tags?.brand || 'Unknown',
    distance_meters: Math.round(distance),
    walking_minutes: estimateWalkingTime(distance),
    type: element.tags?.amenity || element.tags?.shop || element.tags?.leisure,
  };
}

// Overpass QL queries for different amenity types
const AMENITY_QUERIES: Record<string, string> = {
  // Shopping
  supermarket: `node["shop"="supermarket"](around:1500,{lat},{lon});`,
  grocery: `node["shop"="convenience"](around:1500,{lat},{lon});node["shop"="grocery"](around:1500,{lat},{lon});`,
  
  // Education
  primary_school: `node["amenity"="school"]["school:type"="primary"](around:2000,{lat},{lon});node["amenity"="school"](around:2000,{lat},{lon});`,
  secondary_school: `node["amenity"="school"]["school:type"="secondary"](around:2000,{lat},{lon});`,
  kindergarten: `node["amenity"="kindergarten"](around:2000,{lat},{lon});node["amenity"="childcare"](around:2000,{lat},{lon});`,
  
  // Transport
  public_transport: `node["public_transport"="stop"](around:1000,{lat},{lon});node["railway"="station"](around:1000,{lat},{lon});node["highway"="bus_stop"](around:1000,{lat},{lon});`,
  
  // Healthcare
  pharmacy: `node["amenity"="pharmacy"](around:1500,{lat},{lon});`,
  hospital: `node["amenity"="hospital"](around:3000,{lat},{lon});`,
  doctor: `node["amenity"="doctors"](around:2000,{lat},{lon});node["healthcare"="doctor"](around:2000,{lat},{lon});`,
  
  // Recreation
  park: `node["leisure"="park"](around:1500,{lat},{lon});way["leisure"="park"](around:1500,{lat},{lon});`,
  gym: `node["leisure"="fitness_centre"](around:2000,{lat},{lon});node["amenity"="gym"](around:2000,{lat},{lon});`,
  
  // Dining
  restaurant: `node["amenity"="restaurant"](around:1000,{lat},{lon});`,
  cafe: `node["amenity"="cafe"](around:1000,{lat},{lon});`,
};

/**
 * Fetch proximity data for a location using OpenStreetMap Overpass API
 */
export async function fetchProximityData(
  latitude: number,
  longitude: number
): Promise<ProximityData> {
  const proximityData: ProximityData = {
    updated_at: new Date().toISOString(),
    source: 'openstreetmap',
  };

  // Build combined Overpass query
  const queries = Object.entries(AMENITY_QUERIES)
    .map(([key, query]) => query.replace('{lat}', latitude.toString()).replace('{lon}', longitude.toString()))
    .join('\n');

  const overpassQuery = `
    [out:json][timeout:25];
    (
      ${queries}
    );
    out body;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      console.error('Overpass API error:', response.status);
      return proximityData;
    }

    const data: OverpassResponse = await response.json();

    // Process elements by type
    const elements = data.elements || [];

    // Group elements by amenity type
    proximityData.supermarket = elements
      .filter(e => e.tags?.shop === 'supermarket')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 3);

    proximityData.grocery = elements
      .filter(e => e.tags?.shop === 'convenience' || e.tags?.shop === 'grocery')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 3);

    proximityData.kindergarten = elements
      .filter(e => e.tags?.amenity === 'kindergarten' || e.tags?.amenity === 'childcare')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 3);

    proximityData.primary_school = elements
      .filter(e => e.tags?.amenity === 'school' && (!e.tags?.['school:type'] || e.tags?.['school:type'] === 'primary'))
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 3);

    proximityData.public_transport = elements
      .filter(e => e.tags?.public_transport === 'stop' || e.tags?.railway === 'station' || e.tags?.highway === 'bus_stop')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 5);

    proximityData.pharmacy = elements
      .filter(e => e.tags?.amenity === 'pharmacy')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 3);

    proximityData.hospital = elements
      .filter(e => e.tags?.amenity === 'hospital')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 2);

    proximityData.doctor = elements
      .filter(e => e.tags?.amenity === 'doctors' || e.tags?.healthcare === 'doctor')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 3);

    proximityData.park = elements
      .filter(e => e.tags?.leisure === 'park')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 3);

    proximityData.gym = elements
      .filter(e => e.tags?.leisure === 'fitness_centre' || e.tags?.amenity === 'gym')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 3);

    proximityData.restaurant = elements
      .filter(e => e.tags?.amenity === 'restaurant')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 5);

    proximityData.cafe = elements
      .filter(e => e.tags?.amenity === 'cafe')
      .map(e => elementToPOI(e, latitude, longitude))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 5);

  } catch (error) {
    console.error('Error fetching proximity data:', error);
  }

  return proximityData;
}

/**
 * Geocode an address using Nominatim (OpenStreetMap)
 */
export async function geocodeAddress(
  street?: string,
  houseNumber?: string,
  postalCode?: string,
  city: string = '',
  country: string = 'Germany'
): Promise<{ latitude: number; longitude: number } | null> {
  const addressParts: string[] = [];
  
  if (street) {
    addressParts.push(houseNumber ? `${street} ${houseNumber}` : street);
  }
  if (postalCode) addressParts.push(postalCode);
  if (city) addressParts.push(city);
  addressParts.push(country);

  const query = addressParts.join(', ');

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Zestio-Pro/1.0',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  return null;
}
