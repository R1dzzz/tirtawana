import { REGIONS, RegionData, RegionExit, GateRequirement } from '../data/locations/regions';
import { SaveData } from '../data/types/SaveTypes';
import { EventBus, Events } from '../core/EventBus';
import { Logger } from '../core/Logger';

export interface TravelCheck {
  allowed: boolean;
  reason?: string;
}

export class RegionManager {
  private currentRegionId: string;

  constructor(startRegionId: string) {
    this.currentRegionId = startRegionId;
  }

  getCurrentRegion(): RegionData {
    return REGIONS[this.currentRegionId];
  }

  getCurrentRegionId(): string { return this.currentRegionId; }
  getExits(): RegionExit[] { return this.getCurrentRegion().exits; }

  static checkGate(req: GateRequirement | undefined, save: SaveData): TravelCheck {
    if (!req || req.type === 'none') return { allowed: true };
    switch (req.type) {
      case 'bridge':
        return save.world.bridgesBuilt.includes(req.bridgeId)
          ? { allowed: true }
          : { allowed: false, reason: 'The bridge is not repaired yet.' };
      case 'flag':
        return (save.world.villageDevelopment[req.flag] ?? 0) > 0
          ? { allowed: true }
          : { allowed: false, reason: 'This path is not open yet.' };
      case 'resonance':
        return (save.world.resonance[req.region] ?? 50) >= req.min
          ? { allowed: true }
          : { allowed: false, reason: 'The land does not trust you enough yet.' };
      case 'tool':
        return save.inventory.some(s => s.itemId === req.itemId && s.quantity > 0)
          ? { allowed: true }
          : { allowed: false, reason: `You need a ${req.itemId}.` };
    }
  }

  static getSpawn(to: string, from: string): { x: number; y: number } {
    const region = REGIONS[to];
    return region.spawnFrom[from] ?? region.spawnDefault;
  }

  travel(exit: RegionExit, save: SaveData): TravelCheck {
    const check = RegionManager.checkGate(exit.requires, save);
    if (!check.allowed) return check;

    const from = this.currentRegionId;
    const to = exit.to;
    if (!REGIONS[to]) return { allowed: false, reason: 'That region is not open yet.' };

    this.currentRegionId = to;
    const spawn = RegionManager.getSpawn(to, from);

    if (!save.world.discoveredRegions.includes(to)) {
      save.world.discoveredRegions.push(to);
      EventBus.emit(Events.REGION_DISCOVERED, { regionId: to, name: REGIONS[to].name });
      Logger.info(`Discovered region: ${to}`);
    }
    save.world.currentRegionId = to;

    EventBus.emit(Events.REGION_CHANGED, { from, to, spawn, region: REGIONS[to] });
    return { allowed: true };
  }
}
