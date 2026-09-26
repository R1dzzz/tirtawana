import { describe, it, expect } from 'vitest';
import { CombatSystem } from '../../systems/CombatSystem';

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('CombatSystem', () => {
  it('spawns region- and time-appropriate monsters', () => {
    const day = CombatSystem.spawn('forest', false, mulberry32(1), 5);
    expect(day.every(m => m.speciesId !== 'duskling')).toBe(true);
    const night = CombatSystem.spawn('forest', true, mulberry32(1), 5);
    expect(night.some(m => m.speciesId === 'duskling')).toBe(true);
  });

  it('no monsters in safe regions', () => {
    expect(CombatSystem.spawn('village', false, mulberry32(2), 5).length).toBe(0);
    expect(CombatSystem.spawn('farm', true, mulberry32(2), 5).length).toBe(0);
  });

  it('attack reduces hp and kills at zero', () => {
    const m = { speciesId: 'pebblemite', hp: 20, x: 0, y: 0, cooldown: 0, aggroed: false, alive: true };
    expect(CombatSystem.attack(m, 8).killed).toBe(false);
    expect(m.hp).toBe(12);
    expect(m.aggroed).toBe(true);
    expect(CombatSystem.attack(m, 20).killed).toBe(true);
    expect(m.alive).toBe(false);
  });

  it('aggroed monster moves toward player and attacks on cooldown', () => {
    const cs = new CombatSystem(mulberry32(3));
    const m = { speciesId: 'pebblemite', hp: 20, x: 0, y: 0, cooldown: 0, aggroed: true, alive: true };
    // Tick until within range — speed 30 px/s, player at 100,0 → ~2.8s
    let dmg = 0;
    for (let i = 0; i < 400; i++) dmg += cs.tick(m, 100, 0, 50);
    expect(m.x).toBeGreaterThan(50);
    expect(dmg).toBeGreaterThan(0);
    // Cooldown respected: two immediate ticks → at most one hit per cooldown
    const m2 = { speciesId: 'pebblemite', hp: 20, x: 99, y: 0, cooldown: 0, aggroed: true, alive: true };
    const d1 = cs.tick(m2, 100, 0, 16);
    const d2 = cs.tick(m2, 100, 0, 16);
    expect(d1 + d2).toBeLessThanOrEqual(5);
  });

  it('passive monster ignores distant player', () => {
    const cs = new CombatSystem(mulberry32(4));
    const m = { speciesId: 'pebblemite', hp: 20, x: 0, y: 0, cooldown: 0, aggroed: false, alive: true };
    const dmg = cs.tick(m, 500, 0, 100);
    expect(dmg).toBe(0);
    expect(m.x).toBe(0);
  });

  it('killed monster rolls drops within declared ranges', () => {
    const cs = new CombatSystem(mulberry32(5));
    let sawStone = 0;
    for (let i = 0; i < 30; i++) {
      const m = { speciesId: 'pebblemite', hp: 0, x: 0, y: 0, cooldown: 0, aggroed: false, alive: false };
      const drops = cs.rollDrops(m);
      for (const d of drops) {
        expect(d.itemId).toBe('mat_stone');
        expect(d.quantity).toBeGreaterThanOrEqual(1);
        expect(d.quantity).toBeLessThanOrEqual(2);
        sawStone++;
      }
    }
    expect(sawStone).toBeGreaterThan(0);
  });
});
