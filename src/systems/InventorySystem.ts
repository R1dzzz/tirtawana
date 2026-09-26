import { EventBus, Events } from '../core/EventBus';
import { ITEMS } from '../data/items';

export interface InventoryStack {
  itemId: string;
  quantity: number;
  quality: number; // 0=normal, 1=silver, 2=gold, 3=iridium
  locked: boolean;
  favorite: boolean;
}

const DEFAULT_STACK_MAX = 99;

export class InventorySystem {
  private stacks: InventoryStack[] = [];

  /** Add items, merging into existing stacks first. */
  add(itemId: string, quantity: number = 1, quality: number = 0): void {
    if (quantity <= 0) return;
    const stackMax = ITEMS[itemId]?.stackMax ?? DEFAULT_STACK_MAX;
    let remaining = quantity;

    for (const s of this.stacks) {
      if (remaining <= 0) break;
      if (s.itemId === itemId && s.quality === quality && s.quantity < stackMax) {
        const space = stackMax - s.quantity;
        const add = Math.min(space, remaining);
        s.quantity += add;
        remaining -= add;
      }
    }

    while (remaining > 0) {
      const add = Math.min(stackMax, remaining);
      this.stacks.push({ itemId, quantity: add, quality, locked: false, favorite: false });
      remaining -= add;
    }

    EventBus.emit(Events.INVENTORY_CHANGED, this.stacks);
  }

  /**
   * Remove items. If quality is specified, matches that quality first;
   * otherwise removes from the lowest quality stack first.
   * Returns false if there aren't enough items.
   */
  remove(itemId: string, quantity: number = 1, quality?: number): boolean {
    if (this.count(itemId, quality) < quantity) return false;

    let remaining = quantity;

    if (quality !== undefined) {
      for (const s of this.stacks) {
        if (remaining <= 0) break;
        if (s.itemId === itemId && s.quality === quality) {
          const take = Math.min(s.quantity, remaining);
          s.quantity -= take;
          remaining -= take;
        }
      }
    } else {
      // lowest quality first
      const sorted = this.stacks
        .filter(s => s.itemId === itemId)
        .sort((a, b) => a.quality - b.quality);
      for (const s of sorted) {
        if (remaining <= 0) break;
        const take = Math.min(s.quantity, remaining);
        s.quantity -= take;
        remaining -= take;
      }
    }

    this.stacks = this.stacks.filter(s => s.quantity > 0);
    EventBus.emit(Events.INVENTORY_CHANGED, this.stacks);
    return true;
  }

  count(itemId: string, quality?: number): number {
    return this.stacks
      .filter(s => s.itemId === itemId && (quality === undefined || s.quality === quality))
      .reduce((sum, s) => sum + s.quantity, 0);
  }

  /** ID of the first seed in inventory, or null. */
  firstSeed(): string | null {
    for (const s of this.stacks) {
      if (ITEMS[s.itemId]?.type === 'seed') return s.itemId;
    }
    return null;
  }

  getStacks(): readonly InventoryStack[] {
    return this.stacks;
  }

  serialize(): InventoryStack[] {
    return this.stacks.map(s => ({ ...s }));
  }

  load(stacks: InventoryStack[]): void {
    this.stacks = stacks.map(s => ({ ...s }));
    EventBus.emit(Events.INVENTORY_CHANGED, this.stacks);
  }
}
