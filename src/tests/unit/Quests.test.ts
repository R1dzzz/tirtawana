import { describe, it, expect } from 'vitest';
import { QuestSystem } from '../../systems/QuestSystem';
import { QUESTS } from '../../data/quests/quests';

describe('QuestSystem', () => {
  it('auto-accepts the opening main quest', () => {
    const qs = new QuestSystem();
    expect(qs.getActive().some(a => a.questId === 'settle_in')).toBe(true);
  });

  it('progresses objectives on matching events and completes', () => {
    const qs = new QuestSystem();
    expect(qs.notify('harvest', 2)).toEqual([]);
    const done = qs.notify('harvest', 1);
    // still missing 'talk' objective
    expect(done).toEqual([]);
    qs.notify('talk', 1, { npcId: 'sari' });
    const done2 = qs.notify('talk', 1, { npcId: 'pak_darma' });
    expect(done2).toContain('settle_in');
  });

  it('talk events dedupe per NPC', () => {
    const qs = new QuestSystem();
    qs.notify('talk', 1, { npcId: 'sari' });
    qs.notify('talk', 1, { npcId: 'sari' }); // same NPC, no double count
    const aq = qs.getActive().find(a => a.questId === 'settle_in')!;
    expect(aq.progress['meet2']).toBe(1);
  });

  it('turnIn grants rewards and unlocks chained quests', () => {
    const qs = new QuestSystem();
    qs.notify('harvest', 3);
    qs.notify('talk', 1, { npcId: 'sari' });
    qs.notify('talk', 1, { npcId: 'lila' });
    const reward = qs.turnIn('settle_in')!;
    expect(reward.gold).toBe(150);
    expect(reward.items[0].itemId).toBe('animal_feed');
    expect(qs.isTurnedIn('settle_in')).toBe(true);
    // chained quest unlocked
    expect(qs.getActive().some(a => a.questId === 'bridge_blues')).toBe(true);
    // double turn-in blocked
    expect(qs.turnIn('settle_in')).toBeNull();
  });

  it('cannot turn in incomplete quests', () => {
    const qs = new QuestSystem();
    expect(qs.turnIn('settle_in')).toBeNull();
  });

  it('progress caps at target (no overcount)', () => {
    const qs = new QuestSystem();
    qs.notify('harvest', 99);
    const aq = qs.getActive().find(a => a.questId === 'settle_in')!;
    expect(aq.progress['harvest3']).toBe(3);
  });

  it('every quest objective event is a known hook', () => {
    const known = ['harvest', 'fish', 'mine', 'chop', 'talk', 'discover'];
    for (const q of Object.values(QUESTS)) {
      for (const o of q.objectives) expect(known).toContain(o.event);
    }
  });

  it('quest chain prerequisites are consistent', () => {
    for (const q of Object.values(QUESTS)) {
      if (q.requires) expect(QUESTS[q.requires]).toBeDefined();
    }
  });

  it('serialize/load preserves progress and dedupe set', () => {
    const qs = new QuestSystem();
    qs.notify('harvest', 2);
    qs.notify('talk', 1, { npcId: 'sari' });
    const qs2 = new QuestSystem();
    qs2.load(qs.serialize());
    const aq = qs2.getActive().find(a => a.questId === 'settle_in')!;
    expect(aq.progress['harvest3']).toBe(2);
    expect(qs2.getActive().find(a => a.questId === 'settle_in')!.progress['meet2']).toBe(1); // preserved
    qs2.notify('talk', 1, { npcId: 'sari' }); // was already talked — no double count
    expect(qs2.getActive().find(a => a.questId === 'settle_in')!.progress['meet2']).toBe(1);
  });
});
