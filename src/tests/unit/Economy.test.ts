import { describe, it, expect } from 'vitest';
import { EconomySystem } from '../../systems/EconomySystem';
import { InventorySystem } from '../../systems/InventorySystem';

function makeEco(gold = 500) {
  const inv = new InventorySystem();
  const eco = new EconomySystem(inv, gold);
  return { inv, eco };
}

describe('EconomySystem', () => {
  it('buy price equals base sellValue; sell price is 60%', () => {
    const { eco } = makeEco();
    expect(eco.buyPrice('seed_turnipa')).toBe(15);
    expect(eco.sellPrice('crop_turnipa')).toBe(Math.floor(40 * 0.6));
  });

  it('quality multiplies sell price', () => {
    const { eco } = makeEco();
    const base = eco.sellPrice('crop_turnipa', 0);
    expect(eco.sellPrice('crop_turnipa', 2)).toBe(Math.floor(40 * 0.6 * 1.5));
    expect(eco.sellPrice('crop_turnipa', 2)).toBeGreaterThan(base);
  });

  it('buy deducts gold and adds item', () => {
    const { inv, eco } = makeEco(100);
    expect(eco.buy('seed_turnipa')).toBe(true);
    expect(eco.getGold()).toBe(85);
    expect(inv.count('seed_turnipa')).toBe(1);
  });

  it('buy fails when unaffordable; gold never goes negative', () => {
    const { inv, eco } = makeEco(10);
    expect(eco.buy('seed_turnipa')).toBe(false);
    expect(eco.getGold()).toBe(10);
    expect(inv.count('seed_turnipa')).toBe(0);
  });

  it('sell adds gold and removes the item', () => {
    const { inv, eco } = makeEco();
    inv.add('crop_turnipa', 2, 1);
    expect(eco.sell('crop_turnipa', 1)).toBe(true);
    expect(inv.count('crop_turnipa', 1)).toBe(1);
    expect(eco.getGold()).toBe(500 + Math.floor(40 * 0.6 * 1.2));
  });

  it('sell fails when item not in inventory', () => {
    const { eco } = makeEco();
    expect(eco.sell('crop_glowberry')).toBe(false);
    expect(eco.getGold()).toBe(500);
  });

  it('sell without quality picks lowest quality first', () => {
    const { inv, eco } = makeEco();
    inv.add('crop_turnipa', 1, 2);
    inv.add('crop_turnipa', 1, 0);
    eco.sell('crop_turnipa');
    expect(inv.count('crop_turnipa', 0)).toBe(0);
    expect(inv.count('crop_turnipa', 2)).toBe(1);
  });

  it('round-trips a full farming session', () => {
    const { inv, eco } = makeEco(100);
    eco.buy('seed_turnipa'); eco.buy('seed_turnipa');
    expect(eco.getGold()).toBe(70);
    inv.add('crop_turnipa', 3, 1);
    eco.sell('crop_turnipa', 1);
    eco.sell('crop_turnipa', 1);
    expect(inv.count('crop_turnipa', 1)).toBe(1);
    expect(eco.getGold()).toBe(70 + 2 * Math.floor(40 * 0.6 * 1.2));
  });

  it('unknown items cannot be traded', () => {
    const { eco } = makeEco();
    expect(eco.buyPrice('item_nope')).toBe(0);
    expect(eco.buy('item_nope')).toBe(false);
    expect(eco.sell('item_nope')).toBe(false);
  });
});
