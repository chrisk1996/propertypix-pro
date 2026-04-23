// Centralized pricing configuration
// Single source of truth for all credit costs and plan details

export const CREDIT_COSTS = {
  ENHANCE_BASIC: 1,     // Auto, HDR, Sharpen, Denoise
  ENHANCE_PREMIUM: 2,   // Sky Replace, Season, Staging, Object Removal
  VIDEO_GENERATION: 5,  // Full pipeline: sort → stage → animate → stitch
  LISTING_DESCRIPTION: 0, // Free
  SMART_CAPTIONS: 0,    // Free
  SOCIAL_KIT: 0,        // Free
} as const;

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceLabel: '€0',
    period: 'forever',
    credits: 5,
    description: 'Try Zestio with a few credits',
    features: [
      '5 credits on signup',
      'Image Studio (enhance, sky, seasons)',
      'Virtual staging',
      'Listing Builder',
      'Smart Captions & Social Kit',
      'Community support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceLabel: '€29',
    period: 'per month',
    credits: 100,
    description: 'For real estate professionals',
    features: [
      '100 credits per month',
      'All Image Studio tools (13 types)',
      'Video Creator',
      'Virtual staging (all models)',
      'Listing Builder (EN/DE)',
      'Smart Captions & Social Kit',
      'API access',
      'Priority processing',
      'No watermarks',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    priceLabel: '€99',
    period: 'per month',
    credits: -1, // unlimited
    description: 'For teams and agencies',
    features: [
      'Unlimited credits',
      'All Pro features',
      'API access with higher limits',
      'Team collaboration',
      'Custom branding',
      'Priority support',
    ],
  },
} as const;

// What each credit buys (for display)
export const CREDIT_BREAKDOWN = [
  { action: 'Basic Enhancement', cost: 1, note: 'Auto, HDR, Sharpen, Denoise' },
  { action: 'Premium Enhancement', cost: 2, note: 'Sky Replace, Season Change, Object Removal' },
  { action: 'Virtual Staging', cost: 2, note: '8 room types × 8 styles' },
  { action: 'Video Generation', cost: 5, note: 'Full AI pipeline: sort → stage → animate' },
  { action: 'Listing Description', cost: 0, note: 'Free — EN & DE' },
  { action: 'Smart Captions', cost: 0, note: 'Free — all platforms' },
] as const;
