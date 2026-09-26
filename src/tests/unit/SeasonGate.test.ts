import { describe, it, expect } from 'vitest';
import { FarmingSystem } from '../../systems/FarmingSystem';
import { InventorySystem } from '../../systems/InventorySystem';

describe('Season planting gate', () => {
  it('refuses off-season seeds and consumes nothing', () => {
    const inv = new InventorySystem();
    const farm = new FarmingSystem(inv);
    inv.add('seed_snowpearl', 1); // winter crop
    farm.till(0, 0);
    expect(farm.plant(0, 0, 'seed_snowpearl', 'spring')).toBe(false);
    expect(inv.count('seed_snowpearl')).toBe(1);
  });

  it('accepts in-season and all-season crops', () => {
    const inv = new InventorySystem();
    const farm = new FarmingSystem(inv);
    inv.add('seed_turnipa', 1);
    inv.add('seed_snowpearl', 1);
    farm.till(0, 0);
    farm.till(1, 1);
    expect(farm.plant(0, 0, 'seed_turnipa', 'spring')).toBe(true);
    expect(farm.plant(1, 1, 'seed_snowpearl', 'winter')).toBe(true);
  });

  it('no-season mode (legacy calls) still works', () => {
    const inv = new InventorySystem();
    const farm = new FarmingSystem(inv);
    inv.add('seed_turnipa', 1);
    farm.till(0, 0);
    expect(farm.plant(0, 0, 'seed_turnipa')).toBe(true);
  });
});
