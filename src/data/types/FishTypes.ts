export type FishRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface FishData {
  id: string;
  name: string;
  /** Regions where this fish can be caught */
  regions: string[];
  /** Seasons it appears; 'all' for any */
  seasons: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  /** Day/night preference */
  timeOfDay: 'day' | 'night' | 'any';
  waterType: 'pond' | 'river' | 'ocean' | 'any';
  rarity: FishRarity;
  /** Size range in cm (drives quality) */
  minSize: number;
  maxSize: number;
  /** 0..1 — affects minigame speed & catch window */
  difficulty: number;
  sellValue: number;
  itemId: string;
  description: string;
}

export const RARITY_WEIGHTS: Record<FishRarity, number> = {
  common: 60,
  uncommon: 30,
  rare: 9,
  legendary: 1
};
