type EventCallback = (data?: any) => void;

export class EventBus {
  private static listeners: Map<string, Set<EventCallback>> = new Map();

  static on(event: string, callback: EventCallback, _context?: any): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  static off(event: string, callback: EventCallback, _context?: any): void {
    this.listeners.get(event)?.delete(callback);
  }

  static emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  static clear(): void {
    this.listeners.clear();
  }
}

export const Events = {
  PLAYER_MOVED: 'player:moved',
  PLAYER_INTERACT: 'player:interact',
  PLAYER_ATTACK: 'player:attack',
  PLAYER_DODGE: 'player:dodge',
  INVENTORY_CHANGED: 'inventory:changed',
  GOLD_CHANGED: 'gold:changed',
  TIME_CHANGED: 'time:changed',
  SAVE_REQUESTED: 'save:requested',
  SAVE_COMPLETED: 'save:completed',
  RESONANCE_CHANGED: 'resonance:changed',
  ORIENTATION_CHANGED: 'orientation:changed',
  FARM_PLOT_CHANGED: 'farm:plotChanged',
  TOOL_CHANGED: 'tool:changed',
  DAY_ADVANCED: 'time:dayAdvanced',
  SLEEP_COMPLETED: 'time:sleepCompleted',
  COLLAPSED: 'player:collapsed',
  REGION_CHANGED: 'world:regionChanged',
  REGION_DISCOVERED: 'world:regionDiscovered',
  SHOP_CLOSED: 'shop:closed',
  DIALOGUE_CLOSED: 'dialogue:closed',
  QUEST_COMPLETED: 'quest:completed',
  QUEST_LOG_CLOSED: 'quest:logClosed',
  CRAFTING_CLOSED: 'crafting:closed',
  FESTIVAL_CLOSED: 'festival:closed',
  VILLAGE_CLOSED: 'village:closed'
} as const;
