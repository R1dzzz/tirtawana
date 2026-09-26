import { describe, it, expect } from 'vitest';
import { NPCSystem } from '../../systems/NPCSystem';
import { NPCS } from '../../data/npcs/villagers';

describe('NPCSystem', () => {
  it('resolves schedule entries by time', () => {
    const sari = NPCS.sari;
    expect(NPCSystem.resolveEntry(sari, 7 * 60)?.location).toBe('home_sari');   // 06-09
    expect(NPCSystem.resolveEntry(sari, 12 * 60)?.location).toBe('shop');        // 09-18
    expect(NPCSystem.resolveEntry(sari, 20 * 60)?.location).toBe('plaza');       // 18-22
    expect(NPCSystem.resolveEntry(sari, 23 * 60)).toBeNull();                    // asleep
  });

  it('season-specific entries override generic ones', () => {
    const npc = {
      ...NPCS.sari,
      schedule: [
        { start: 0, end: 24 * 60, location: 'plaza', activity: 'generic' },
        { start: 0, end: 24 * 60, location: 'well', activity: 'festival', season: 'spring' }
      ]
    };
    expect(NPCSystem.resolveEntry(npc, 12 * 60, 'spring')?.location).toBe('well');
    expect(NPCSystem.resolveEntry(npc, 12 * 60, 'summer')?.location).toBe('plaza');
  });

  it('talk gives friendship once per day and flags first meeting', () => {
    const ns = new NPCSystem();
    const r1 = ns.talk('sari');
    expect(r1.first).toBe(true);
    expect(r1.friendship).toBe(20);
    expect(ns.talk('sari').friendship).toBe(20); // no double-dip same day
    ns.advanceDay();
    expect(ns.talk('sari').friendship).toBe(40);
  });

  it('gifts respect likes and dislikes', () => {
    const ns = new NPCSystem();
    expect(ns.giveGift('sari', 'crop_turnipa')).toBe(80);   // liked
    expect(ns.giveGift('sari', 'fish_duskgill')).toBe(-50); // disliked
    expect(ns.giveGift('sari', 'mat_stone')).toBe(10);      // neutral
    expect(ns.giveGift('nobody', 'mat_stone')).toBe(0);
  });

  it('hearts convert from friendship at 100 per heart', () => {
    const ns = new NPCSystem();
    ns.giveGift('pak_darma', 'wood_hard');   // +80
    ns.giveGift('pak_darma', 'milk_rich');   // +80 → 160
    expect(ns.hearts('pak_darma')).toBe(1);
  });

  it('serialize/load round-trip', () => {
    const ns = new NPCSystem();
    ns.talk('lila');
    ns.giveGift('lila', 'fish_silversip');
    const ns2 = new NPCSystem();
    ns2.load(ns.serialize());
    expect(ns2.getState('lila')?.friendship).toBe(100);
    expect(ns2.getState('lila')?.met).toBe(true);
  });

  it('every NPC schedule is time-sorted and covers waking hours', () => {
    for (const npc of Object.values(NPCS)) {
      const sorted = [...npc.schedule].sort((a, b) => a.start - b.start);
      expect(npc.schedule).toEqual(sorted);
      expect(npc.schedule[0].start).toBeLessThan(9 * 60); // up before 9
    }
  });
});
