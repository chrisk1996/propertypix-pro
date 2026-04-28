// Centralized pricing configuration
// Single source of truth for all credit costs and plan details
// Display strings are i18n keys (resolved via useTranslations('pricing'))

export const CREDIT_COSTS = {
  ENHANCE_BASIC: 1,
  ENHANCE_PREMIUM: 2,
  UPSCALE: 2,
  VIDEO_GENERATION: 5,
  LISTING_DESCRIPTION: 0,
  SMART_CAPTIONS: 0,
  SOCIAL_KIT: 0,
} as const;

// Plan data — features are i18n keys resolved via t() within 'pricing' namespace
export const PLANS = {
  free: {
    nameKey: 'free',
    price: 0,
    priceLabel: '€0',
    periodKey: 'forever',
    credits: 5,
    descriptionKey: 'freeDesc',
    features: [
      'freeFeature1',
      'freeFeature2',
      'freeFeature3',
      'freeFeature4',
      'freeFeature5',
    ],
  },
  pro: {
    nameKey: 'pro',
    price: 29,
    priceLabel: '€29',
    periodKey: 'perMonth',
    credits: 100,
    descriptionKey: 'proDesc',
    features: [
      'proFeature1',
      'proFeature2',
      'proFeature3',
      'proFeature4',
      'proFeature5',
      'proFeature6',
      'proFeature7',
      'proFeature8',
    ],
    popular: true,
  },
  enterprise: {
    nameKey: 'enterprise',
    price: 99,
    priceLabel: '€99',
    periodKey: 'perMonth',
    credits: 500,
    descriptionKey: 'enterpriseDesc',
    features: [
      'enterpriseFeature1',
      'enterpriseFeature2',
      'enterpriseFeature3',
      'enterpriseFeature4',
      'enterpriseFeature5',
    ],
  },
} as const;

export const TOP_UP_PACKS = [
  { credits: 50, price: 9, labelKey: 'topUp50', priceLabel: '€9', perCredit: '€0.18' },
  { credits: 200, price: 29, labelKey: 'topUp200', priceLabel: '€29', perCredit: '€0.145', popular: true },
  { credits: 500, price: 59, labelKey: 'topUp500', priceLabel: '€59', perCredit: '€0.118' },
] as const;

export const CREDIT_BREAKDOWN = [
  { actionKey: 'breakdownBasic', cost: 1, noteKey: 'breakdownBasicNote' },
  { actionKey: 'breakdownPremium', cost: 2, noteKey: 'breakdownPremiumNote' },
  { actionKey: 'breakdownStaging', cost: 2, noteKey: 'breakdownStagingNote' },
  { actionKey: 'breakdownVideo', cost: 5, noteKey: 'breakdownVideoNote' },
  { actionKey: 'breakdownListing', cost: 0, noteKey: 'breakdownListingNote' },
  { actionKey: 'breakdownCaptions', cost: 0, noteKey: 'breakdownCaptionsNote' },
] as const;
