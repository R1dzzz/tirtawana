import { describe, it, expect } from 'vitest';
import { VillageSystem } from '../../systems/VillageSystem';
import { InventorySystem } from '../../systems/InventorySystem';
import { VILLAGE_PROJECTS } from '../../data/village/projects';

function makeVillage() {
  const inv = new InventorySystem();
  const vs = new VillageSystem(inv);
  return { inv, vs };
}

describe('VillageSystem', () => {
  it('donateItem contributes only what is needed and consumes inventory', () => {
    const { inv, vs } = makeVillage();
    inv.add('wood_soft', 12);
    const p = VILLAGE_PROJECTS.bridge_river;
    for (let i = 0; i < p.costs[0].quantity; i++) {
      expect(vs.donateItem('bridge_river', 'wood_soft').ok).toBe(true);
    }
    // 10 needed, 11th refused
    expect(vs.donateItem('bridge_river', 'wood_soft').ok).toBe(false);
    expect(inv.count('wood_soft')).toBe(2);
  });

  it('rejects items the project does not need', () => {
    const { inv, vs } = makeVillage();
    inv.add('fish_silversip', 1);
    const r = vs.donateItem('bridge_river', 'fish_silversip');
    expect(r.ok).toBe(false);
    expect(r.message).toContain('does not need');
  });

  it('gold donations cap at the remaining goal', () => {
    const { vs } = makeVillage();
    const r = vs.donateGold('well_upgrade', 500);
    expect(r.ok).toBe(true);
    expect(vs.getProgress('well_upgrade')!.goldGiven).toBe(100); // capped
  });

  it('project completes only when items AND gold are met; fires callback', () => {
    const { inv, vs } = makeVillage();
    let completed: string | null = null;
    vs.onProjectCompleted = (p) => { completed = p.id; };
    inv.add('mat_stone', 15);
    for (let i = 0; i < 15; i++) vs.donateItem('well_upgrade', 'mat_stone');
    expect(completed).toBeNull(); // gold still missing
    const r = vs.donateGold('well_upgrade', 100);
    expect(r.completed).toBe(true);
    expect(completed).toBe('well_upgrade');
    expect(vs.projectFraction('well_upgrade')).toBe(1);
  });

  it('completed projects refuse further donations', () => {
    const { inv, vs } = makeVillage();
    inv.add('mat_stone', 15);
    for (let i = 0; i < 15; i++) vs.donateItem('well_upgrade', 'mat_stone');
    vs.donateGold('well_upgrade', 100);
    expect(vs.donateItem('well_upgrade', 'mat_stone').ok).toBe(false);
  });

  it('fraction reflects partial progress', () => {
    const { inv, vs } = makeVillage();
    inv.add('mat_stone', 15);
    expect(vs.projectFraction('well_upgrade')).toBe(0);
    for (let i = 0; i < 7; i++) vs.donateItem('well_upgrade', 'mat_stone');
    const frac = vs.projectFraction('well_upgrade');
    expect(frac).toBeGreaterThan(0);
    expect(frac).toBeLessThan(1);
  });

  it('serialize/load preserves progress', () => {
    const { inv, vs } = makeVillage();
    inv.add('wood_soft', 5);
    for (let i = 0; i < 5; i++) vs.donateItem('bridge_river', 'wood_soft');
    vs.donateGold('bridge_river', 50);
    const vs2 = new VillageSystem(new InventorySystem());
    vs2.load(vs.serialize());
    expect(vs2.getProgress('bridge_river')!.contributed['wood_soft']).toBe(5);
    expect(vs2.getProgress('bridge_river')!.goldGiven).toBe(50);
  });

  it('bridge project effect data is consistent with RegionManager gate', () => {
    const p = VILLAGE_PROJECTS.bridge_river;
    expect(p.effect).toEqual({ type: 'bridge', bridgeId: 'river_bridge' });
  });
});
