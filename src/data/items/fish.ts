import { FishData } from '../types/FishTypes';
import { ItemData } from '../types/ItemTypes';

/** All fish are original TIRTAWANA designs. */
export const FISH: Record<string, FishData> = {
  silversip: {
    id: 'silversip', name: 'Silversip',
    regions: ['village', 'farm', 'meadow', 'forest'],
    seasons: 'all', timeOfDay: 'any', waterType: 'pond',
    rarity: 'common', minSize: 5, maxSize: 15, difficulty: 0.15,
    sellValue: 18, itemId: 'fish_silversip',
    description: 'A tiny silver fish that sips insects from the surface.'
  },
  duskgill: {
    id: 'duskgill', name: 'Duskgill',
    regions: ['village', 'farm', 'meadow', 'forest', 'river'],
    seasons: 'all', timeOfDay: 'night', waterType: 'any',
    rarity: 'uncommon', minSize: 12, maxSize: 30, difficulty: 0.35,
    sellValue: 42, itemId: 'fish_duskgill',
    description: 'Its gills shimmer faintly violet after sunset.'
  },
  mosswhisker: {
    id: 'mosswhisker', name: 'Mosswhisker',
    regions: ['river'],
    seasons: 'spring', timeOfDay: 'day', waterType: 'river',
    rarity: 'rare', minSize: 25, maxSize: 60, difficulty: 0.6,
    sellValue: 95, itemId: 'fish_mosswhisker',
    description: 'An old bottom-feeder with moss-like whiskers. Only in spring rivers.'
  },
  emberscale: {
    id: 'emberscale', name: 'Emberscale',
    regions: ['river'],
    seasons: 'summer', timeOfDay: 'day', waterType: 'river',
    rarity: 'rare', minSize: 20, maxSize: 50, difficulty: 0.65,
    sellValue: 110, itemId: 'fish_emberscale',
    description: 'Scales glow like cooling coals. Summer river only.'
  },
  tirta_kingfin: {
    id: 'tirta_kingfin', name: 'Tirta Kingfin',
    regions: ['river'],
    seasons: 'all', timeOfDay: 'night', waterType: 'river',
    rarity: 'legendary', minSize: 80, maxSize: 140, difficulty: 0.95,
    sellValue: 800, itemId: 'fish_tirta_kingfin',
    description: "The river's old king. Few have seen it; fewer have landed it."
  }
};

export const FISH_ITEMS: Record<string, ItemData> = Object.fromEntries(
  Object.values(FISH).map(f => [f.itemId, {
    id: f.itemId,
    name: f.name,
    type: 'fish' as const,
    sellValue: f.sellValue,
    description: f.description
  }])
);
