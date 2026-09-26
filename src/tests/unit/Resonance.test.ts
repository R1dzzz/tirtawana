import { describe, it, expect } from 'vitest';
import { ResonanceSystem } from '../../systems/ResonanceSystem';

describe('ResonanceSystem', () => {
  it('clamps score 0..100', () => {
    const rs = new ResonanceSystem();
    rs.applyAction('forest', 'test', 500);
    expect(rs.get('forest')).toBe(100);
    rs.applyAction('forest', 'test2', -500);
    expect(rs.get('forest')).toBe(0);
  });

  it('tier bands match spec thresholds', () => {
    expect(ResonanceSystem.tier(10)).toBe('withered');
    expect(ResonanceSystem.tier(30)).toBe('strained');
    expect(ResonanceSystem.tier(50)).toBe('balanced');
    expect(ResonanceSystem.tier(70)).toBe('thriving');
    expect(ResonanceSystem.tier(95)).toBe('radiant');
  });

  it('effects improve monotonically with tier', () => {
    const low = ResonanceSystem.effects(10);
    const mid = ResonanceSystem.effects(50);
    const high = ResonanceSystem.effects(95);
    expect(high.regrowthMult).toBeGreaterThan(mid.regrowthMult);
    expect(mid.regrowthMult).toBeGreaterThan(low.regrowthMult);
    expect(high.spawnBonus).toBeGreaterThan(mid.spawnBonus);
    expect(high.hiddenPaths).toBe(true);
    expect(low.hiddenPaths).toBe(false);
    expect(low.monsterAggression).toBeGreaterThan(high.monsterAggression);
  });

  it('same-action spam has diminishing returns', () => {
    const rs = new ResonanceSystem({ forest: 50 });
    rs.applyAction('forest', 'replant', 3);
    rs.applyAction('forest', 'replant', 3);
    rs.applyAction('forest', 'replant', 3);
    rs.applyAction('forest', 'replant', 3);
    // Without diminishing: 50+12=62. With: less.
    expect(rs.get('forest')).toBeLessThan(62);
    expect(rs.get('forest')).toBeGreaterThan(50);
  });

  it('different actions do not diminish each other', () => {
    const rs = new ResonanceSystem({ forest: 50 });
    rs.applyAction('forest', 'replant', 3);
    rs.applyAction('forest', 'clean', 3);
    expect(rs.get('forest')).toBe(56);
  });

  it('negative actions push score down', () => {
    const rs = new ResonanceSystem({ forest: 50 });
    rs.applyAction('forest', 'chop', -2);
    expect(rs.get('forest')).toBe(48);
  });

  it('daily drift pulls extremes gently toward neutral', () => {
    const rs = new ResonanceSystem({ forest: 90, river: 10, village: 55 });
    rs.dailyDrift();
    expect(rs.get('forest')).toBe(89);
    expect(rs.get('river')).toBe(11);
    expect(rs.get('village')).toBe(54); // above 52 drifts down
  });

  it('serialize/load round-trip preserves scores', () => {
    const rs = new ResonanceSystem({ forest: 77 });
    const rs2 = new ResonanceSystem();
    rs2.load(rs.serialize());
    expect(rs2.get('forest')).toBe(77);
  });
});
