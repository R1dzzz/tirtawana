import { describe, it, expect } from 'vitest';
import { NeedsSystem } from '../../systems/NeedsSystem';

function makeNeeds() { return new NeedsSystem(1000); }

describe('NeedsSystem', () => {
  it('hunger empties in about one game day', () => {
    const n = makeNeeds();
    n.applyMinutes(1440);
    expect(n.state.hunger).toBeLessThanOrEqual(0);
    expect(n.state.hunger).toBeGreaterThan(-1);
  });

  it('thirst decays faster than hunger', () => {
    const n = makeNeeds();
    n.applyMinutes(480);
    expect(n.state.thirst).toBeLessThan(n.state.hunger);
  });

  it('fatigue rises faster while moving', () => {
    const still = makeNeeds();
    const moving = makeNeeds();
    moving.setMoving(true);
    still.applyMinutes(600);
    moving.applyMinutes(600);
    expect(moving.state.fatigue).toBeGreaterThan(still.state.fatigue);
  });

  it('stamina regen is reduced when hungry or thirsty', () => {
    const n = makeNeeds();
    n.state.stamina = 50;
    n.state.hunger = 10;
    n.applyMinutes(30);
    const regenLow = n.state.stamina - 50;

    const m = makeNeeds();
    m.state.stamina = 50;
    m.applyMinutes(30);
    const regenNormal = m.state.stamina - 50;

    expect(regenLow).toBeLessThan(regenNormal);
  });

  it('critical hunger damages health slowly', () => {
    const n = makeNeeds();
    n.state.hunger = 0;
    n.state.thirst = 50;
    const hpBefore = n.state.health;
    n.applyMinutes(240);
    expect(n.state.health).toBeLessThan(hpBefore);
    expect(n.state.health).toBeGreaterThan(80);
  });

  it('sleep restores fatigue & stamina with modest overnight drain', () => {
    const n = makeNeeds();
    n.state.fatigue = 80;
    n.state.stamina = 20;
    n.state.hunger = 50;
    n.state.thirst = 50;
    n.applySleep();
    expect(n.state.fatigue).toBe(0);
    expect(n.state.stamina).toBe(100);
    expect(n.state.hunger).toBe(35);
    expect(n.state.thirst).toBe(30);
  });

  it('collapse never kills the player', () => {
    const n = makeNeeds();
    n.state.health = 5;
    n.applyCollapse();
    expect(n.state.health).toBeGreaterThanOrEqual(1);
    expect(n.state.fatigue).toBe(40);
  });

  it('collapse applies a health penalty when healthy', () => {
    const n = makeNeeds();
    n.state.health = 100;
    n.applyCollapse();
    expect(n.state.health).toBeLessThanOrEqual(90);
    expect(n.state.health).toBeGreaterThanOrEqual(85);
  });

  it('move efficiency drops with fatigue and low needs', () => {
    const n = makeNeeds();
    expect(n.getMoveEfficiency()).toBe(1.0);
    n.state.fatigue = 75;
    expect(n.getMoveEfficiency()).toBe(0.85);
    n.state.fatigue = 95;
    expect(n.getMoveEfficiency()).toBe(0.7);
  });

  it('feed and drink clamp at max', () => {
    const n = makeNeeds();
    n.feed(500); n.drink(500);
    expect(n.state.hunger).toBe(100);
    expect(n.state.thirst).toBe(100);
  });
});
