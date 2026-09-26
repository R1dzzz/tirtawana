import { describe, it, expect } from 'vitest';
import { RegionManager } from '../../world/RegionManager';
import { REGIONS } from '../../data/locations/regions';
import { createDefaultSave } from '../../data/types/SaveTypes';

describe('RegionManager', () => {
  it('bridge gate blocks travel until bridge is built', () => {
    const rm = new RegionManager('forest');
    const save = createDefaultSave();
    const exit = REGIONS.forest.exits.find(e => e.to === 'river')!;
    expect(exit.requires).toEqual({ type: 'bridge', bridgeId: 'river_bridge' });

    const blocked = rm.travel(exit, save);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toContain('bridge');

    save.world.bridgesBuilt.push('river_bridge');
    const allowed = rm.travel(exit, save);
    expect(allowed.allowed).toBe(true);
    expect(rm.getCurrentRegionId()).toBe('river');
  });

  it('open exits travel freely and update currentRegionId', () => {
    const rm = new RegionManager('village');
    const save = createDefaultSave();
    const exit = REGIONS.village.exits.find(e => e.to === 'farm')!;
    expect(rm.travel(exit, save).allowed).toBe(true);
    expect(save.world.currentRegionId).toBe('farm');
  });

  it('records discovery only once', () => {
    const rm = new RegionManager('village');
    const save = createDefaultSave();
    const exit = REGIONS.village.exits.find(e => e.to === 'meadow')!;
    rm.travel(exit, save);
    expect(save.world.discoveredRegions).toContain('meadow');
    expect(save.world.discoveredRegions.filter(r => r === 'meadow').length).toBe(1);

    const back = REGIONS.meadow.exits.find(e => e.to === 'village')!;
    rm.travel(back, save);
    rm.travel(exit, save);
    expect(save.world.discoveredRegions.filter(r => r === 'meadow').length).toBe(1);
  });

  it('spawn point depends on entry direction', () => {
    const spawn = RegionManager.getSpawn('farm', 'village');
    expect(spawn.y).toBeLessThan(100);
    const spawnV = RegionManager.getSpawn('village', 'farm');
    expect(spawnV.y).toBeGreaterThan(900);
  });

  it('resonance gate checks region score', () => {
    const save = createDefaultSave();
    const req = { type: 'resonance', region: 'forest', min: 40 } as const;
    expect(RegionManager.checkGate(req, save).allowed).toBe(true);
    save.world.resonance.forest = 20;
    expect(RegionManager.checkGate(req, save).allowed).toBe(false);
  });

  it('tool gate checks inventory', () => {
    const save = createDefaultSave();
    const req = { type: 'tool', itemId: 'tool_axe_iron' } as const;
    expect(RegionManager.checkGate(req, save).allowed).toBe(false);
    save.inventory.push({ itemId: 'tool_axe_iron', quantity: 1, quality: 0, locked: false, favorite: false });
    expect(RegionManager.checkGate(req, save).allowed).toBe(true);
  });

  it('every exit target has region data and reverse spawn', () => {
    for (const region of Object.values(REGIONS)) {
      for (const exit of region.exits) {
        expect(REGIONS[exit.to]).toBeDefined();
        expect(REGIONS[exit.to].spawnFrom[region.id]).toBeDefined();
      }
    }
  });
});
