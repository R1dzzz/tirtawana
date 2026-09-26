import { describe, it, expect } from 'vitest';
import { REGIONS } from '../../data/locations/regions';
import { RegionManager } from '../../world/RegionManager';
import { createDefaultSave } from '../../data/types/SaveTypes';
import { POIS, poisForRegion } from '../../data/village/pois';
import { REGION_ROCKS } from '../../data/rocks/mineRocks';

describe('World expansion graph', () => {
  it('all region exit targets exist with reverse spawns', () => {
    for (const region of Object.values(REGIONS)) {
      for (const exit of region.exits) {
        expect(REGIONS[exit.to], `${region.id}->${exit.to}`).toBeDefined();
        expect(REGIONS[exit.to].spawnFrom[region.id], `spawn ${region.id}->${exit.to}`).toBeDefined();
      }
    }
  });

  it('full traversal path exists: village to beach', () => {
    const rm = new RegionManager('village');
    const save = createDefaultSave();
    save.world.bridgesBuilt.push('river_bridge');
    save.inventory.push({ itemId: 'tool_climbing_gear', quantity: 1, quality: 0, locked: false, favorite: false });
    save.world.resonance.forest = 80;

    const path = [
      REGIONS.village.exits.find(e => e.to === 'farm')!,          // village->farm
      REGIONS.farm.exits.find(e => e.to === 'village')!,          // back
      REGIONS.village.exits.find(e => e.to === 'meadow')!,
      REGIONS.meadow.exits.find(e => e.to === 'forest')!,
      REGIONS.forest.exits.find(e => e.to === 'ancient_forest')!, // resonance gate
      REGIONS.forest.exits.find(e => e.to === 'river')!,
      REGIONS.river.exits.find(e => e.to === 'waterfall')!,
      REGIONS.waterfall.exits.find(e => e.to === 'caverns')!,
      REGIONS.river.exits.find(e => e.to === 'coast')!,
      REGIONS.coast.exits.find(e => e.to === 'beach')!,
    ];
    for (const exit of path) {
      const r = rm.travel(exit, save);
      expect(r.allowed, exit.to).toBe(true);
    }
    expect(rm.getCurrentRegionId()).toBe('beach');
  });

  it('ancient forest requires forest resonance 60', () => {
    const rm = new RegionManager('forest');
    const save = createDefaultSave();
    const exit = REGIONS.forest.exits.find(e => e.to === 'ancient_forest')!;
    expect(RegionManager.checkGate(exit.requires, save).allowed).toBe(false);
    save.world.resonance.forest = 65;
    expect(RegionManager.checkGate(exit.requires, save).allowed).toBe(true);
  });

  it('caverns reachable only via waterfall', () => {
    expect(REGIONS.waterfall.exits.some(e => e.to === 'caverns')).toBe(true);
    expect(REGIONS.river.exits.some(e => e.to === 'caverns')).toBe(false);
  });

  it('every mineable region has a rock table', () => {
    for (const id of ['mountain', 'mines', 'caverns', 'ancient_forest']) {
      expect(REGION_ROCKS[id], id).toBeDefined();
      expect(REGION_ROCKS[id].length).toBeGreaterThan(0);
    }
  });

  it('POIs live in valid regions and have sensible rewards', () => {
    for (const poi of POIS) {
      expect(REGIONS[poi.regionId], poi.id).toBeDefined();
      expect(poi.rewardQty).toBeGreaterThan(0);
    }
    expect(poisForRegion('beach').length).toBe(1);
    expect(poisForRegion('village').length).toBe(1);
  });

  it('resonance-gated POIs declare thresholds within 0..100', () => {
    for (const poi of POIS) {
      if (poi.minResonance !== undefined) {
        expect(poi.minResonance).toBeGreaterThan(0);
        expect(poi.minResonance).toBeLessThanOrEqual(100);
      }
    }
  });
});
