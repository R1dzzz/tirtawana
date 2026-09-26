import { RegionData } from '../locations/regions';

export interface POI {
  id: string;
  regionId: string;
  x: number;
  y: number;
  /** Item granted on first discovery */
  rewardItem: string;
  rewardQty: number;
  /** Resonance tier required (default 0 = always) */
  minResonance?: number;
  hint: string;
}

/** Points of interest — exploration rewards curiosity. */
export const POIS: POI[] = [
  { id: 'well_secret', regionId: 'village', x: 560, y: 470, rewardItem: 'crystal_shard', rewardQty: 1, hint: 'Lila mentioned the well at dusk...' },
  { id: 'falls_cache', regionId: 'waterfall', x: 700, y: 300, rewardItem: 'gem_echo', rewardQty: 1, minResonance: 60, hint: 'The land hums behind the falls.' },
  { id: 'beach_drift', regionId: 'beach', x: 300, y: 700, rewardItem: 'seed_snowpearl', rewardQty: 2, hint: 'Something washed ashore.' },
  { id: 'ancient_grove', regionId: 'ancient_forest', x: 512, y: 256, rewardItem: 'seed_glowberry', rewardQty: 3, minResonance: 70, hint: 'The grove gifts seeds to the trusted.' }
];

export function poisForRegion(regionId: string): POI[] {
  return POIS.filter(p => p.regionId === regionId);
}
