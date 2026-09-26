import { describe, it, expect } from 'vitest';
import { LoggingSystem } from '../../systems/LoggingSystem';
import { WildlifeSystem } from '../../systems/WildlifeSystem';

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('LoggingSystem', () => {
  it('mature forest tree drops hardwood + seed', () => {
    const ls = new LoggingSystem(mulberry32(1));
    const t = ls.plant('forest'); t.growth = 1;
    const r = ls.chop(t.id);
    expect(r.depleted).toBe(true);
    expect(r.drops.some(d => d.itemId === 'wood_hard')).toBe(true);
    expect(r.drops.some(d => d.itemId === 'sap_seed')).toBe(true);
  });

  it('young tree only gives a seed', () => {
    const ls = new LoggingSystem(mulberry32(2));
    const t = ls.plant('meadow');
    const r = ls.chop(t.id);
    expect(r.drops).toEqual([{ itemId: 'sap_seed', quantity: 1 }]);
  });

  it('replanting revives a felled tree', () => {
    const ls = new LoggingSystem(mulberry32(3));
    const t = ls.plant('forest'); t.growth = 1;
    ls.chop(t.id);
    expect(ls.replant(t.id)).toBe(true);
    expect(t.alive).toBe(true);
    expect(t.growth).toBe(0);
  });

  it('high resonance regrows faster', () => {
    const lsA = new LoggingSystem(mulberry32(4));
    const lsB = new LoggingSystem(mulberry32(4));
    const a = lsA.plant('forest'); const b = lsB.plant('forest');
    lsA.advanceDay(90); lsB.advanceDay(10);
    expect(a.growth).toBeGreaterThan(b.growth);
  });

  it('trees cap at full growth', () => {
    const ls = new LoggingSystem(mulberry32(5));
    const t = ls.plant('forest');
    for (let i = 0; i < 10; i++) ls.advanceDay(100);
    expect(t.growth).toBe(1);
  });

  it('serialize/load round-trip', () => {
    const ls = new LoggingSystem(mulberry32(6));
    const t = ls.plant('forest');
    const ls2 = new LoggingSystem();
    ls2.load(ls.serialize());
    expect(ls2.get(t.id)?.regionId).toBe('forest');
  });
});

describe('WildlifeSystem', () => {
  it('nocturnal species only appear at night', () => {
    const day = WildlifeSystem.candidates('meadow', false).map(w => w.id);
    const night = WildlifeSystem.candidates('meadow', true).map(w => w.id);
    expect(day).not.toContain('duskbird');
    expect(night).toContain('duskbird');
  });

  it('region filtering works', () => {
    const forest = WildlifeSystem.candidates('forest', false).map(w => w.id);
    expect(forest).toContain('bristleboar');
    expect(WildlifeSystem.candidates('meadow', false).map(w => w.id)).not.toContain('bristleboar');
  });

  it('skittish creatures flee a moving player', () => {
    const ws = new WildlifeSystem(mulberry32(8));
    let fled = 0;
    for (let i = 0; i < 50; i++) {
      const s = { speciesId: 'meadowhare', x: 0, y: 0, alertness: 0.9, fled: false };
      if (ws.onPlayerNear(s, true)) fled++;
    }
    expect(fled).toBeGreaterThan(0);
    expect(fled).toBeLessThan(50);
  });

  it('journal observation is idempotent', () => {
    const journal: string[] = [];
    expect(WildlifeSystem.observe(journal, 'emberfox')).toBe(true);
    expect(WildlifeSystem.observe(journal, 'emberfox')).toBe(false);
    expect(journal).toEqual(['emberfox']);
  });
});
