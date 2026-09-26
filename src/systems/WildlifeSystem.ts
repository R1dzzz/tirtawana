import { WILDLIFE } from '../data/wildlife/creatures';
import { WildlifeSpawn } from '../data/types/WildlifeTypes';

export class WildlifeSystem {
  private rng: () => number;
  private spawns: WildlifeSpawn[] = [];

  constructor(rng: () => number = Math.random) { this.rng = rng; }

  static candidates(regionId: string, isNight: boolean) {
    return Object.values(WILDLIFE).filter(w =>
      w.regions.includes(regionId) &&
      (isNight || w.behavior !== 'nocturnal')
    );
  }

  populate(regionId: string, isNight: boolean, maxCount: number = 3, mapW: number = 1024, mapH: number = 1024): WildlifeSpawn[] {
    this.spawns = [];
    const pool = WildlifeSystem.candidates(regionId, isNight);
    for (let i = 0; i < maxCount; i++) {
      for (const w of pool) {
        if (this.rng() < w.rarity) {
          this.spawns.push({
            speciesId: w.id,
            x: 80 + this.rng() * (mapW - 160),
            y: 80 + this.rng() * (mapH - 160),
            alertness: 0.3 + this.rng() * 0.6,
            fled: false
          });
          break;
        }
      }
    }
    return [...this.spawns];
  }

  getSpawns(): WildlifeSpawn[] { return this.spawns; }

  onPlayerNear(spawn: WildlifeSpawn, playerMoving: boolean): boolean {
    const w = WILDLIFE[spawn.speciesId];
    if (!w || spawn.fled) return false;
    if ((w.behavior === 'skittish' || w.behavior === 'rare') && playerMoving && this.rng() < spawn.alertness) {
      spawn.fled = true;
      return true;
    }
    return false;
  }

  static observe(journal: string[], speciesId: string): boolean {
    if (!journal.includes(speciesId)) { journal.push(speciesId); return true; }
    return false;
  }
}
