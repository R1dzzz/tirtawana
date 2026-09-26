import type { ISystem } from '../systems/interfaces/ISystem';

export class ServiceLocator {
  private static services: Map<string, any> = new Map();

  static register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  static get<T>(key: string): T {
    const svc = this.services.get(key);
    if (!svc) throw new Error(`Service not found: ${key}`);
    return svc as T;
  }

  static has(key: string): boolean {
    return this.services.has(key);
  }

  static getSystems(): ISystem[] {
    return Array.from(this.services.values()).filter(
      (s): s is ISystem => typeof s?.init === 'function' && typeof s?.update === 'function'
    );
  }

  static clear(): void {
    this.services.clear();
  }
}

export const SERVICE_KEYS = {
  SAVE_MANAGER: 'SaveManager',
  TIME_SYSTEM: 'TimeSystem',
  INVENTORY_SYSTEM: 'InventorySystem',
  FARMING_SYSTEM: 'FarmingSystem',
  ECONOMY_SYSTEM: 'EconomySystem',
  QUEST_SYSTEM: 'QuestSystem',
  CRAFTING_SYSTEM: 'CraftingSystem',
  NEEDS_SYSTEM: 'NeedsSystem',
  FESTIVAL_SYSTEM: 'FestivalSystem',
  VILLAGE_SYSTEM: 'VillageSystem'
} as const;
