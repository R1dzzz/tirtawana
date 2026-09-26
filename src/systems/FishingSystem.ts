import { FISH } from '../data/items/fish';
import { FishData, RARITY_WEIGHTS } from '../data/types/FishTypes';
import { Season } from './TimeSystem';

export interface FishRoll {
  fish: FishData;
  sizeCm: number;
  quality: number; // 0..2
}

export interface JournalFishEntry {
  count: number;
  largest: number;
}

/**
 * Pure fishing logic — no Phaser. Rolls a catch based on region, season,
 * time of day, and weather (weather hooks in for M15).
 */
export class FishingSystem {
  private rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
  }

  /** Candidate fish for the given conditions. */
  candidates(regionId: string, season: Season, isNight: boolean, _weather: string = 'sunny'): FishData[] {
    return Object.values(FISH).filter(f =>
      (f.regions.includes(regionId) || f.regions.includes('any')) &&
      (f.seasons === 'all' || f.seasons === season) &&
      (f.timeOfDay === 'any' || (f.timeOfDay === 'night') === isNight)
    );
  }

  /** Weighted rarity roll. Returns null when nothing bites. */
  rollCatch(regionId: string, season: Season, isNight: boolean, weather: string = 'sunny'): FishRoll | null {
    const pool = this.candidates(regionId, season, isNight, weather);
    if (pool.length === 0) return null;

    let total = 0;
    const weights = pool.map(f => {
      const w = RARITY_WEIGHTS[f.rarity];
      total += w;
      return w;
    });

    let roll = this.rng() * total;
    let chosen = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { chosen = pool[i]; break; }
    }

    // Size drives quality: bigger relative to max = better quality
    const sizeCm = Math.round(chosen.minSize + this.rng() * (chosen.maxSize - chosen.minSize));
    const ratio = (sizeCm - chosen.minSize) / Math.max(1, chosen.maxSize - chosen.minSize);
    const quality = ratio > 0.75 ? 2 : ratio > 0.4 ? 1 : 0;

    return { fish: chosen, sizeCm, quality };
  }

  /** Record a catch into the journal (mutates the given record). */
  static recordCatch(journal: Record<string, JournalFishEntry>, roll: FishRoll): void {
    const id = roll.fish.id;
    if (!journal[id]) journal[id] = { count: 0, largest: 0 };
    journal[id].count++;
    journal[id].largest = Math.max(journal[id].largest, roll.sizeCm);
  }

  /** How many distinct species the journal contains. */
  static speciesCount(journal: Record<string, JournalFishEntry>): number {
    return Object.keys(journal).length;
  }
}
