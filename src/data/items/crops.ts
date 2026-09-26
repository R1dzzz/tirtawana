import { CropData } from '../types/CropTypes';

/**
 * All crops are original TIRTAWANA designs.
 * growthDays[i] = watered days required to finish stage i.
 */
export const CROPS: Record<string, CropData> = {
  turnipa: {
    id: 'turnipa',
    name: 'Turnipa',
    season: 'spring',
    growthDays: [1, 2, 2],
    waterPerDay: 1,
    stages: 3,
    sellValue: 40,
    regrowDays: null,
    seedItemId: 'seed_turnipa',
    harvestItemId: 'crop_turnipa',
    color: 0xc8d8f0
  },
  sungrain: {
    id: 'sungrain',
    name: 'Sungrain',
    season: 'summer',
    growthDays: [2, 2, 3],
    waterPerDay: 1,
    stages: 3,
    sellValue: 55,
    regrowDays: null,
    seedItemId: 'seed_sungrain',
    harvestItemId: 'crop_sungrain',
    color: 0xf0d040
  },
  glowberry: {
    id: 'glowberry',
    name: 'Glowberry',
    season: 'autumn',
    growthDays: [1, 2, 2, 2],
    waterPerDay: 1,
    stages: 4,
    sellValue: 80,
    regrowDays: 2,
    seedItemId: 'seed_glowberry',
    harvestItemId: 'crop_glowberry',
    color: 0x9a4ad9
  },
  snowpearl: {
    id: 'snowpearl',
    name: 'Snowpearl',
    season: 'winter',
    growthDays: [2, 3, 3],
    waterPerDay: 1,
    stages: 3,
    sellValue: 95,
    regrowDays: null,
    seedItemId: 'seed_snowpearl',
    harvestItemId: 'crop_snowpearl',
    color: 0xe8f0ff
  }
};
