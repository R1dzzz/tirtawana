import { describe, it, expect } from 'vitest';
import { AnimalSystem } from '../../systems/AnimalSystem';
import { ANIMAL_SPECIES } from '../../data/animals/species';

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('AnimalSystem', () => {
  it('buying creates an animal with full needs and a personality', () => {
    const as = new AnimalSystem(mulberry32(1));
    const a = as.buy('chicken')!;
    expect(a.speciesId).toBe('chicken');
    expect(a.hunger).toBe(80);
    expect(['calm', 'playful', 'shy', 'stubborn']).toContain(a.personality);
    expect(as.buy('dragon')).toBeNull();
  });

  it('feed/pet/clean modify stats and respect caps', () => {
    const as = new AnimalSystem(mulberry32(2));
    const a = as.buy('cow')!;
    as.feed(a.id);
    expect(as.get(a.id)!.hunger).toBe(100);
    expect(as.feed(a.id).ok).toBe(false); // full
    as.pet(a.id); as.pet(a.id);
    expect(as.get(a.id)!.bond).toBe(16);
    a.cleanliness = 10;
    as.clean(a.id);
    expect(a.cleanliness).toBe(100);
  });

  it('well-kept chicken produces every day; neglected one does not', () => {
    const as = new AnimalSystem(mulberry32(3));
    const good = as.buy('chicken')!;
    const bad = as.buy('chicken')!;
    bad.hunger = 10; bad.cleanliness = 10;
    const ready1 = as.advanceDay();
    expect(ready1).toContain(good.id);
    expect(ready1).not.toContain(bad.id);
  });

  it('sheep produces on its produceDays cycle when fed', () => {
    const as = new AnimalSystem(mulberry32(4));
    const s = as.buy('sheep')!;
    expect(as.advanceDay()).toContain(s.id); // day 1 ready (bought mature)
    as.feed(s.id); as.clean(s.id);
    expect(as.advanceDay()).not.toContain(s.id); // day 2 not
    as.feed(s.id); as.clean(s.id);
    expect(as.advanceDay()).not.toContain(s.id); // day 3 not
    as.feed(s.id); as.clean(s.id);
    expect(as.advanceDay()).toContain(s.id); // day 4 ready again (3-day cycle)
  });

  it('care quality maps to product quality tiers', () => {
    const as = new AnimalSystem(mulberry32(5));
    const a = as.buy('cow')!;
    a.hunger = 100; a.happiness = 100; a.cleanliness = 100; a.bond = 100;
    expect(AnimalSystem.quality(a)).toBe(2);
    a.hunger = 10; a.happiness = 10; a.cleanliness = 10; a.bond = 0;
    expect(AnimalSystem.quality(a)).toBe(0);
  });

  it('unhappiness drops when neglected', () => {
    const as = new AnimalSystem(mulberry32(6));
    const a = as.buy('chicken')!;
    a.happiness = 50; a.hunger = 10; a.cleanliness = 10;
    as.advanceDay();
    expect(as.get(a.id)!.happiness).toBeLessThan(50);
  });

  it('serialize/load round-trip', () => {
    const as = new AnimalSystem(mulberry32(7));
    const a = as.buy('sheep')!;
    const as2 = new AnimalSystem();
    as2.load(as.serialize());
    expect(as2.get(a.id)?.name).toBe(a.name);
  });

  it('species data is consistent', () => {
    for (const sp of Object.values(ANIMAL_SPECIES)) {
      expect(sp.produceDays).toBeGreaterThan(0);
      expect(sp.productItemId).toMatch(/^(egg|wool|milk)_/);
    }
  });
});
