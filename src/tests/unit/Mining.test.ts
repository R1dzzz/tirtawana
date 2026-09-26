import { describe, it, expect } from 'vitest';
import { MiningSystem } from '../../systems/MiningSystem';
import { ROCK_TYPES, REGION_ROCKS } from '../../data/rocks/mineRocks';

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('MiningSystem', () => {
  it('requires the correct tool', () => {
    const ms = new MiningSystem();
    expect(ms.canDamage('rock_stone', 'tool_pickaxe')).toBe(true);
    expect(ms.canDamage('rock_stone', null)).toBe(false);
    expect(ms.canDamage('rock_stone', 'tool_hoe')).toBe(false);
  });

  it('depletes after hp hits and drops guaranteed yield', () => {
    const ms = new MiningSystem(mulberry32(3));
    const rock = { typeId: 'rock_stone', hp: 2 };
    expect(ms.hit(rock, 'tool_pickaxe').depleted).toBe(false);
    expect(rock.hp).toBe(1);
    const result = ms.hit(rock, 'tool_pickaxe');
    expect(result.depleted).toBe(true);
    const stone = result.drops.find(d => d.itemId === 'mat_stone')!;
    expect(stone).toBeDefined();
    expect(stone.quantity).toBeGreaterThanOrEqual(2);
    expect(stone.quantity).toBeLessThanOrEqual(4);
  });

  it('wrong tool deals no damage', () => {
    const ms = new MiningSystem();
    const rock = { typeId: 'vein_copper', hp: 3 };
    ms.hit(rock, null);
    ms.hit(rock, 'tool_axe');
    expect(rock.hp).toBe(3);
  });

  it('unknown rock type is safe', () => {
    const ms = new MiningSystem();
    const rock = { typeId: 'rock_nope', hp: 1 };
    const r = ms.hit(rock, 'tool_pickaxe');
    expect(r.depleted).toBe(false);
    expect(r.drops).toEqual([]);
  });

  it('echo geode sometimes drops the gem', () => {
    const ms = new MiningSystem(mulberry32(11));
    let gemDrops = 0;
    for (let i = 0; i < 40; i++) {
      const rock = { typeId: 'geode_echo', hp: 5 };
      let result: any = { depleted: false };
      for (let h = 0; h < 5 && !result.depleted; h++) result = ms.hit(rock, 'tool_pickaxe');
      if (result.drops.some((d: any) => d.itemId === 'gem_echo')) gemDrops++;
    }
    expect(gemDrops).toBeGreaterThan(0);
    expect(gemDrops).toBeLessThan(40);
  });

  it('weighted rock roll respects distribution', () => {
    const rng = mulberry32(5);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const id = MiningSystem.rollRockType(REGION_ROCKS.mines, rng)!;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    expect(counts['rock_stone']).toBeGreaterThan(counts['geode_echo']);
    expect(counts['geode_echo']).toBeGreaterThan(0);
  });

  it('region tables reference valid rock types', () => {
    for (const regionId of ['mountain', 'mines']) {
      expect(REGION_ROCKS[regionId]).toBeDefined();
      for (const e of REGION_ROCKS[regionId]) expect(ROCK_TYPES[e.rockId]).toBeDefined();
    }
  });
});
