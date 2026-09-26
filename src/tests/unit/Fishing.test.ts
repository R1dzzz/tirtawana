import { describe, it, expect } from 'vitest';
import { FishingSystem, JournalFishEntry } from '../../systems/FishingSystem';
import { FISH } from '../../data/items/fish';

// Seeded RNG for determinism
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('FishingSystem', () => {
  it('filters candidates by region, season, and time of day', () => {
    const fs = new FishingSystem();
    // Village pond, spring, day: only silversip
    const day = fs.candidates('village', 'spring', false);
    expect(day.map(f => f.id)).toContain('silversip');
    expect(day.map(f => f.id)).not.toContain('duskgill'); // night only

    // Night: silversip + duskgill
    const night = fs.candidates('village', 'spring', true);
    expect(night.map(f => f.id)).toContain('duskgill');

    // River spring day: mosswhisker appears
    const river = fs.candidates('river', 'spring', false);
    expect(river.map(f => f.id)).toContain('mosswhisker');

    // River summer day: emberscale, not mosswhisker
    const riverSummer = fs.candidates('river', 'summer', false);
    expect(riverSummer.map(f => f.id)).toContain('emberscale');
    expect(riverSummer.map(f => f.id)).not.toContain('mosswhisker');

    // Winter river day: no river-only fish (both are spring/summer)
    const riverWinter = fs.candidates('river', 'winter', false).filter(f => f.regions.includes('river') && !f.regions.includes('village'));
    expect(riverWinter.length).toBe(0);
  });

  it('rolls a catch within size range with valid quality', () => {
    const fs = new FishingSystem(mulberry32(42));
    const roll = fs.rollCatch('village', 'spring', false)!;
    expect(roll).not.toBeNull();
    expect(roll.sizeCm).toBeGreaterThanOrEqual(roll.fish.minSize);
    expect(roll.sizeCm).toBeLessThanOrEqual(roll.fish.maxSize);
    expect(roll.quality).toBeGreaterThanOrEqual(0);
    expect(roll.quality).toBeLessThanOrEqual(2);
  });

  it('returns null when nothing can bite', () => {
    const fs = new FishingSystem();
    // A region with no fish data at all
    expect(fs.rollCatch('mountain', 'winter', false)).toBeNull();
  });

  it('legendary is much rarer than common over many rolls', () => {
    const fs = new FishingSystem(mulberry32(7));
    const counts: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      const r = fs.rollCatch('river', 'spring', true)!; // night: includes kingfin
      counts[r.fish.id] = (counts[r.fish.id] ?? 0) + 1;
    }
    const common = counts['duskgill'] ?? 0;  // night river pool: duskgill + kingfin
    const legendary = counts['tirta_kingfin'] ?? 0;
    expect(common).toBeGreaterThan(legendary * 5);
    expect(legendary).toBeGreaterThan(0); // but possible
  });

  it('records catches in the journal (count + largest)', () => {
    const journal: Record<string, JournalFishEntry> = {};
    const fs = new FishingSystem(mulberry32(1));
    const r1 = fs.rollCatch('village', 'spring', false)!;
    FishingSystem.recordCatch(journal, r1);
    FishingSystem.recordCatch(journal, r1);
    expect(journal[r1.fish.id].count).toBe(2);
    expect(journal[r1.fish.id].largest).toBe(r1.sizeCm);

    const r2 = { fish: r1.fish, sizeCm: r1.sizeCm + 5, quality: 1 };
    FishingSystem.recordCatch(journal, r2);
    expect(journal[r1.fish.id].largest).toBe(r1.sizeCm + 5);
    expect(FishingSystem.speciesCount(journal)).toBe(1);
  });

  it('fish item ids are registered with sell values', () => {
    for (const f of Object.values(FISH)) {
      expect(f.itemId).toMatch(/^fish_/);
      expect(f.sellValue).toBeGreaterThan(0);
    }
  });
});
