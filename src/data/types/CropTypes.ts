export interface CropData {
  id: string;
  name: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  /** Days required in each growth stage (index = stage). Sum = total days to mature. */
  growthDays: number[];
  waterPerDay: number;
  stages: number;
  sellValue: number;
  /** If set, crop regrows after harvest without replanting. */
  regrowDays: number | null;
  specialConditions?: { resonanceMin?: number; weather?: string };
  seedItemId: string;
  harvestItemId: string;
  /** Placeholder art tint color. */
  color: number;
}

/** Sum of growthDays = total watered days required to mature. */
export function requiredWateredDays(crop: CropData): number {
  return crop.growthDays.reduce((a, b) => a + b, 0);
}

/**
 * Stage index for a given number of watered days.
 * Thresholds are the cumulative sums of growthDays.
 * Returns 0..stages-1.
 */
export function stageForDays(crop: CropData, wateredDays: number): number {
  const thresholds: number[] = [];
  let acc = 0;
  for (const d of crop.growthDays) {
    acc += d;
    thresholds.push(acc);
  }
  let stage = 0;
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (wateredDays >= thresholds[i]) stage = i + 1;
  }
  return Math.min(stage, crop.stages - 1);
}
