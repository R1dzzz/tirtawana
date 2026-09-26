import { EventBus, Events } from '../core/EventBus';
import { CROPS } from '../data/items/crops';
import { ITEMS } from '../data/items';
import { requiredWateredDays, stageForDays, CropData } from '../data/types/CropTypes';
import { InventorySystem } from './InventorySystem';
import type { ISystem } from './interfaces/ISystem';

export interface Plot {
  x: number; // tile coords
  y: number;
  tilled: boolean;
  watered: boolean;
  fertilized: string | null;
  cropId: string | null;
  stage: number;
  /** Total watered days since planting. */
  totalGrowthDays: number;
  /** Consecutive watered days (drives quality). */
  wateredDays: number;
}

export type FarmAction = 'till' | 'plant' | 'water' | 'harvest';

export interface HarvestResult {
  itemId: string;
  quantity: number;
  quality: number;
}

export class FarmingSystem implements ISystem {
  private plots = new Map<string, Plot>();
  private inventory: InventorySystem;
  private rng: () => number;

  constructor(inventory: InventorySystem, rng: () => number = Math.random) {
    this.inventory = inventory;
    this.rng = rng;
  }

  init(): void {}
  update(): void {}
  destroy(): void {
    this.plots.clear();
  }

  private key(x: number, y: number): string {
    return `${x},${y}`;
  }

  getPlot(x: number, y: number): Plot | undefined {
    return this.plots.get(this.key(x, y));
  }

  getAllPlots(): Plot[] {
    return Array.from(this.plots.values());
  }

  /** Create a tilled plot. Fails if a plot already exists here. */
  till(x: number, y: number): boolean {
    if (this.plots.has(this.key(x, y))) return false;
    this.plots.set(this.key(x, y), {
      x, y,
      tilled: true,
      watered: false,
      fertilized: null,
      cropId: null,
      stage: 0,
      totalGrowthDays: 0,
      wateredDays: 0
    });
    this.emitChange();
    return true;
  }

  /** Plant a seed on a tilled, empty plot. Consumes one seed. */
  plant(x: number, y: number, seedItemId: string, season?: string): boolean {
    const plot = this.plots.get(this.key(x, y));
    if (!plot || !plot.tilled || plot.cropId) return false;

    const cropId = ITEMS[seedItemId]?.cropId;
    if (!cropId || !CROPS[cropId]) return false;
    // Season validation: off-season seeds refuse to sprout
    if (season) {
      const crop: CropData = CROPS[cropId];
      if (crop.season !== 'all' && crop.season !== season) return false;
    }
    if (!this.inventory.remove(seedItemId, 1)) return false;

    plot.cropId = cropId;
    plot.stage = 0;
    plot.totalGrowthDays = 0;
    plot.wateredDays = 0;
    this.emitChange();
    return true;
  }

  /** Water a planted plot. */
  water(x: number, y: number): boolean {
    const plot = this.plots.get(this.key(x, y));
    if (!plot || !plot.cropId || plot.watered) return false;
    plot.watered = true;
    this.emitChange();
    return true;
  }

  isMature(plot: Plot): boolean {
    if (!plot.cropId) return false;
    const crop = CROPS[plot.cropId];
    return plot.totalGrowthDays >= requiredWateredDays(crop);
  }

  /** Best context action for this tile (used by contextual button). */
  getContext(x: number, y: number): FarmAction | null {
    const plot = this.plots.get(this.key(x, y));
    if (!plot) return 'till'; // caller validates the tile is tillable
    if (plot.cropId) {
      if (this.isMature(plot)) return 'harvest';
      if (!plot.watered) return 'water';
      return null; // growing, nothing to do
    }
    if (plot.tilled) {
      return this.inventory.firstSeed() ? 'plant' : null;
    }
    return null;
  }

  /**
   * Advance one in-game day:
   * - Watered crops grow; unwatered crops reset their consecutive-day counter.
   * - All plots dry out (must be watered again).
   */
  advanceDay(): void {
    for (const plot of this.plots.values()) {
      if (plot.cropId) {
        const crop = CROPS[plot.cropId];
        if (plot.watered) {
          plot.totalGrowthDays++;
          plot.wateredDays++;
        } else {
          plot.wateredDays = 0;
        }
        plot.stage = stageForDays(crop, plot.totalGrowthDays);
      }
      plot.watered = false;
    }
    this.emitChange();
  }

  /** Harvest a mature crop. Regrowing crops stay planted. */
  harvest(x: number, y: number): HarvestResult | null {
    const plot = this.plots.get(this.key(x, y));
    if (!plot || !plot.cropId || !this.isMature(plot)) return null;

    const crop = CROPS[plot.cropId];
    const required = requiredWateredDays(crop);
    // Quality from consistent watering
    const quality = plot.wateredDays >= required ? 2
      : plot.wateredDays >= required - 1 ? 1
      : 0;
    const quantity = 1 + (this.rng() < 0.4 ? 1 : 0);

    this.inventory.add(crop.harvestItemId, quantity, quality);

    if (crop.regrowDays !== null) {
      // Reset growth so regrowDays remain until mature again
      plot.totalGrowthDays = Math.max(0, required - crop.regrowDays);
      plot.wateredDays = 0;
      plot.stage = stageForDays(crop, plot.totalGrowthDays);
      plot.watered = false;
    } else {
      plot.cropId = null;
      plot.stage = 0;
      plot.totalGrowthDays = 0;
      plot.wateredDays = 0;
      plot.watered = false;
    }

    this.emitChange();
    return { itemId: crop.harvestItemId, quantity, quality };
  }

  /** Remove a plot entirely (e.g., clearing land). */
  clearPlot(x: number, y: number): boolean {
    const removed = this.plots.delete(this.key(x, y));
    if (removed) this.emitChange();
    return removed;
  }

  serialize(): Plot[] {
    return this.getAllPlots().map(p => ({ ...p }));
  }

  load(plots: Plot[]): void {
    this.plots.clear();
    for (const p of plots) {
      this.plots.set(this.key(p.x, p.y), { ...p });
    }
    this.emitChange();
  }

  private emitChange(): void {
    EventBus.emit(Events.FARM_PLOT_CHANGED, this.getAllPlots());
  }
}
