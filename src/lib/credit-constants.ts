// Credit cost per generation type (discounted prices)
export const CREDIT_COSTS = {
  FULL_RESOLUTION: 0.05,   // 0.05 credits per full resolution export (5000x5000)
  PREVIEW: 0.002,          // 0.002 credits per preview (384x384)
} as const;

// Credit purchase tiers
export interface CreditTier {
  id: string;
  credits: number;
  priceAda: number;
  label: string;
  badge?: string;
  fullResExports: number;
  previewExports: number;
}

export const CREDIT_TIERS: CreditTier[] = [
  { 
    id: 'starter',
    credits: 1000, 
    priceAda: 17, 
    label: 'Starter',
    fullResExports: 20000,
    previewExports: 500000,
  },
  { 
    id: 'popular',
    credits: 2500, 
    priceAda: 33, 
    label: 'Popular', 
    badge: 'Most Popular',
    fullResExports: 50000,
    previewExports: 1250000,
  },
  { 
    id: 'pro',
    credits: 5000, 
    priceAda: 53,
    label: 'Pro', 
    badge: 'Best Value',
    fullResExports: 100000,
    previewExports: 2500000,
  },
];

// Monthly free credits
export const MONTHLY_FREE_CREDITS = 100;

// Calculate credits needed for a generation
export function calculateCreditsNeeded(batchSize: number, isFullResolution: boolean): number {
  const costPerImage = isFullResolution ? CREDIT_COSTS.FULL_RESOLUTION : CREDIT_COSTS.PREVIEW;
  return batchSize * costPerImage;
}

// Format credits for display
export function formatCredits(credits: number): string {
  if (credits >= 1) {
    return credits.toFixed(credits % 1 === 0 ? 0 : 1);
  }
  return credits.toFixed(3);
}
