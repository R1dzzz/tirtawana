import { describe, it, expect } from 'vitest';
import { FarmingSystem } from '../../systems/FarmingSystem';
import { InventorySystem } from '../../systems/InventorySystem';
import { CROPS } from '../../data/items/crops';
import { requiredWateredDays, stageForDays } from '../../data/types/CropTypes';

const lowRng = () => 0.1;

function makeFarm() {
  const inv = new InventorySystem();
  const farm = new FarmingSystem(inv, lowRng);
  return { inv, farm };
}

function growDay(farm: FarmingSystem) {
  for (const plot of farm.getAllPlots()) {
    if (plot.cropId && !farm.isMature(plot)) farm.water(plot.x, plot.y);
  }
  farm.advanceDay();
}

describe('CropGrowth', () => {
  it('stageForDays maps thresholds correctly for turnipa [1,2,2]', () => {
    const crop = CROPS.turnipa;
    expect(stageForDays(crop, 0)).toBe(0);
    expect(stageForDays(crop, 1)).toBe(1);
    expect(stageForDays(crop, 2)).toBe(1);
    expect(stageForDays(crop, 3)).toBe(2);
    expect(requiredWateredDays(crop)).toBe(5);
  });

  it('requires tilled soil before planting', () => {
    const { inv, farm } = makeFarm();
    inv.add('seed_turnipa', 1);
    expect(farm.plant(2, 2, 'seed_turnipa')).toBe(false);
  });

  it('consumes a seed when planting', () => {
    const { inv, farm } = makeFarm();
    inv.add('seed_turnipa', 2);
    farm.till(1, 1);
    expect(farm.plant(1, 1, 'seed_turnipa')).toBe(true);
    expect(inv.count('seed_turnipa')).toBe(1);
    expect(farm.getPlot(1, 1)?.cropId).toBe('turnipa');
  });

  it('grows only when watered; unwatered day resets consecutive counter', () => {
    const { inv, farm } = makeFarm();
    inv.add('seed_turnipa', 1);
    farm.till(0, 0);
    farm.plant(0, 0, 'seed_turnipa');

    farm.water(0, 0);
    farm.advanceDay();
    let plot = farm.getPlot(0, 0)!;
    expect(plot.totalGrowthDays).toBe(1);
    expect(plot.wateredDays).toBe(1);
    expect(plot.watered).toBe(false);

    farm.advanceDay();
    plot = farm.getPlot(0, 0)!;
    expect(plot.totalGrowthDays).toBe(1);
    expect(plot.wateredDays).toBe(0);
  });

  it('matures after required watered days and harvests with quality', () => {
    const { inv, farm } = makeFarm();
    inv.add('seed_turnipa', 1);
    farm.till(0, 0);
    farm.plant(0, 0, 'seed_turnipa');

    for (let i = 0; i < 5; i++) growDay(farm);

    expect(farm.isMature(farm.getPlot(0, 0)!)).toBe(true);
    const result = farm.harvest(0, 0)!;
    expect(result.itemId).toBe('crop_turnipa');
    expect(result.quantity).toBe(2);
    expect(result.quality).toBe(2);
    expect(inv.count('crop_turnipa')).toBe(2);
    expect(farm.getPlot(0, 0)?.cropId).toBeNull();
  });

  it('regrow crop stays planted after harvest', () => {
    const { inv, farm } = makeFarm();
    inv.add('seed_glowberry', 1);
    farm.till(3, 3);
    farm.plant(3, 3, 'seed_glowberry');

    for (let i = 0; i < 7; i++) growDay(farm);
    expect(farm.isMature(farm.getPlot(3, 3)!)).toBe(true);

    const result = farm.harvest(3, 3)!;
    expect(result.itemId).toBe('crop_glowberry');

    const plot = farm.getPlot(3, 3)!;
    expect(plot.cropId).toBe('glowberry');
    expect(plot.totalGrowthDays).toBe(5);

    growDay(farm); growDay(farm);
    expect(farm.isMature(farm.getPlot(3, 3)!)).toBe(true);
  });
});
