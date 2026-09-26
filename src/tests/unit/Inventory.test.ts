import { describe, it, expect } from 'vitest';
import { InventorySystem } from '../../systems/InventorySystem';

describe('InventorySystem', () => {
  it('stacks items up to max (99)', () => {
    const inv = new InventorySystem();
    inv.add('crop_turnipa', 60);
    inv.add('crop_turnipa', 60);
    expect(inv.count('crop_turnipa')).toBe(120);
    expect(inv.getStacks().length).toBe(2);
  });

  it('separates stacks by quality', () => {
    const inv = new InventorySystem();
    inv.add('crop_turnipa', 5, 0);
    inv.add('crop_turnipa', 3, 2);
    expect(inv.count('crop_turnipa')).toBe(8);
    expect(inv.count('crop_turnipa', 2)).toBe(3);
    expect(inv.getStacks().length).toBe(2);
  });

  it('removes from matching quality first when specified', () => {
    const inv = new InventorySystem();
    inv.add('crop_turnipa', 5, 0);
    inv.add('crop_turnipa', 5, 2);
    expect(inv.remove('crop_turnipa', 3, 2)).toBe(true);
    expect(inv.count('crop_turnipa', 2)).toBe(2);
    expect(inv.count('crop_turnipa', 0)).toBe(5);
  });

  it('removes from lowest quality first when unspecified', () => {
    const inv = new InventorySystem();
    inv.add('crop_turnipa', 2, 1);
    inv.add('crop_turnipa', 2, 0);
    inv.remove('crop_turnipa', 3);
    expect(inv.count('crop_turnipa', 0)).toBe(0);
    expect(inv.count('crop_turnipa', 1)).toBe(1);
  });

  it('fails removal when not enough items', () => {
    const inv = new InventorySystem();
    inv.add('crop_turnipa', 2);
    expect(inv.remove('crop_turnipa', 5)).toBe(false);
    expect(inv.count('crop_turnipa')).toBe(2);
  });

  it('drops empty stacks', () => {
    const inv = new InventorySystem();
    inv.add('crop_turnipa', 2);
    inv.remove('crop_turnipa', 2);
    expect(inv.getStacks().length).toBe(0);
  });

  it('firstSeed returns a seed item id or null', () => {
    const inv = new InventorySystem();
    expect(inv.firstSeed()).toBeNull();
    inv.add('crop_turnipa', 1);
    expect(inv.firstSeed()).toBeNull();
    inv.add('seed_sungrain', 1);
    expect(inv.firstSeed()).toBe('seed_sungrain');
  });

  it('round-trips through serialize/load', () => {
    const inv = new InventorySystem();
    inv.add('seed_turnipa', 10);
    inv.add('crop_turnipa', 3, 2);
    const data = inv.serialize();
    const inv2 = new InventorySystem();
    inv2.load(data);
    expect(inv2.count('seed_turnipa')).toBe(10);
    expect(inv2.count('crop_turnipa', 2)).toBe(3);
  });
});
