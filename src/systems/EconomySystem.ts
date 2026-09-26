import { EventBus, Events } from '../core/EventBus';
import { ITEMS } from '../data/items';
import { InventorySystem } from './InventorySystem';

/** Buy at base sellValue; sell back at 60% x quality multiplier. */
export class EconomySystem {
  static readonly SELL_RATE = 0.6;
  static readonly QUALITY_MULT = [1, 1.2, 1.5, 2];

  private gold: number;
  private inventory: InventorySystem;

  constructor(inventory: InventorySystem, startingGold = 0) {
    this.inventory = inventory;
    this.gold = startingGold;
  }

  getGold(): number { return this.gold; }
  setGold(g: number): void {
    this.gold = Math.max(0, Math.floor(g));
    EventBus.emit(Events.GOLD_CHANGED, this.gold);
  }

  buyPrice(itemId: string): number { return ITEMS[itemId]?.sellValue ?? 0; }

  sellPrice(itemId: string, quality: number = 0): number {
    const base = ITEMS[itemId]?.sellValue ?? 0;
    const mult = EconomySystem.QUALITY_MULT[Math.min(quality, 3)];
    return Math.max(1, Math.floor(base * EconomySystem.SELL_RATE * mult));
  }

  canAfford(itemId: string): boolean { return this.gold >= this.buyPrice(itemId); }

  buy(itemId: string): boolean {
    const price = this.buyPrice(itemId);
    if (price <= 0 || this.gold < price) return false;
    this.gold -= price;
    this.inventory.add(itemId, 1);
    EventBus.emit(Events.GOLD_CHANGED, this.gold);
    return true;
  }

  sell(itemId: string, quality?: number): boolean {
    if (this.inventory.count(itemId, quality) < 1) return false;
    const q = quality ?? this.lowestQualityOf(itemId);
    const price = this.sellPrice(itemId, q);
    if (!this.inventory.remove(itemId, 1, q)) return false;
    this.gold += price;
    EventBus.emit(Events.GOLD_CHANGED, this.gold);
    return true;
  }

  private lowestQualityOf(itemId: string): number {
    let q = 3;
    for (const s of this.inventory.getStacks()) {
      if (s.itemId === itemId && s.quality < q) q = s.quality;
    }
    return q;
  }
}
