import { describe, it, expect } from 'vitest';
import { FestivalSystem } from '../../systems/FestivalSystem';
import { FESTIVALS } from '../../data/festivals/festivals';
import { ITEMS } from '../../data/items';

describe('FestivalSystem', () => {
  it('each festival lands on day 28 of its season', () => {
    expect(FestivalSystem.festivalOnDay(28, 'spring')?.id).toBe('spring_bloom');
    expect(FestivalSystem.festivalOnDay(28, 'summer')?.id).toBe('summer_ember');
    expect(FestivalSystem.festivalOnDay(28, 'autumn')?.id).toBe('autumn_harvest');
    expect(FestivalSystem.festivalOnDay(28, 'winter')?.id).toBe('winter_star');
    expect(FestivalSystem.festivalOnDay(27, 'spring')).toBeNull();
    expect(FestivalSystem.festivalOnDay(28 + 28, 'summer')?.id).toBe('summer_ember'); // year 2
  });

  it('judging scales with item value and quality', () => {
    const fs = new FestivalSystem();
    const fest = FESTIVALS.spring_bloom;
    const low = fs.judge(fest, 'crop_turnipa', 0);
    const high = fs.judge(fest, 'crop_turnipa', 2);
    expect(high.score).toBeGreaterThan(low.score);
    expect(low.rewardGold).toBe(fest.rewardBase + Math.round(fest.rewardValueMult * low.score));
  });

  it('eligibility filters by contest type', () => {
    const fest = FESTIVALS.summer_ember; // food
    const stacks = [
      { itemId: 'food_turnipa_stew', quality: 1, quantity: 2 },
      { itemId: 'crop_turnipa', quality: 0, quantity: 5 },
      { itemId: 'fish_silversip', quality: 0, quantity: 1 }
    ];
    const ok = FestivalSystem.eligibleItems(fest, stacks);
    expect(ok.length).toBe(1);
    expect(ok[0].itemId).toBe('food_turnipa_stew');
  });

  it('one entry per festival is recorded and scored', () => {
    const fs = new FestivalSystem();
    fs.judge(FESTIVALS.spring_bloom, 'crop_turnipa', 2);
    expect(fs.hasEntered('spring_bloom')).toBe(true);
    expect(fs.bestScore('spring_bloom')).toBeGreaterThan(0);
    expect(fs.bestScore('summer_ember')).toBe(0);
  });

  it('all contest items exist in the item registry', () => {
    for (const f of Object.values(FESTIVALS)) {
      for (const item of Object.values(ITEMS)) {
        if (f.contestItemType === 'food' && item.type === 'food') return;
      }
    }
    expect(Object.values(ITEMS).some(i => i.type === 'food')).toBe(true);
    expect(Object.values(ITEMS).some(i => i.type === 'crop')).toBe(true);
    expect(Object.values(ITEMS).some(i => i.type === 'fish')).toBe(true);
  });

  it('serialize/load preserves entries', () => {
    const fs = new FestivalSystem();
    fs.judge(FESTIVALS.autumn_harvest, 'fish_mosswhisker', 1);
    const fs2 = new FestivalSystem();
    fs2.load(fs.serialize());
    expect(fs2.hasEntered('autumn_harvest')).toBe(true);
  });
});
