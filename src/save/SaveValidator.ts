import { SaveData, SAVE_VERSION } from '../data/types/SaveTypes';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  repaired?: SaveData;
}

/** Structural validation + safe repair for save data (never throws). */
export class SaveValidator {
  static validate(data: any): ValidationResult {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
      return { ok: false, errors: ['save is not an object'] };
    }
    if (typeof data.version !== 'number') errors.push('missing version');
    if (!data.player || typeof data.player.gold !== 'number') errors.push('missing player.gold');
    if (!data.world || typeof data.world.day !== 'number') errors.push('missing world.day');
    if (!Array.isArray(data.inventory)) errors.push('inventory not an array');
    if (!Array.isArray(data.farm?.plots)) errors.push('farm.plots not an array');
    if (!data.world?.playerPosition || typeof data.world.playerPosition.x !== 'number') {
      errors.push('missing playerPosition');
    }
    return { ok: errors.length === 0, errors };
  }

  /** Repair common corruption: fill defaults for missing sub-objects. */
  static repair(data: any): SaveData {
    const d = { ...data };
    d.version = SAVE_VERSION;
    d.player = {
      name: 'Traveler', health: 100, maxHealth: 100, stamina: 100, maxStamina: 100,
      hunger: 100, maxHunger: 100, thirst: 100, maxThirst: 100, fatigue: 0, maxFatigue: 100,
      gold: 500, skills: {}, equipped: { tool: null, weapon: null },
      quickSlots: [null, null, null, null],
      ...(d.player ?? {})
    };
    d.world = {
      currentRegionId: 'village', discoveredRegions: ['village'],
      playerPosition: { x: 400, y: 300 },
      resonance: {}, villageDevelopment: {}, bridgesBuilt: [],
      weather: { current: 'sunny', next: 'cloudy', daysRemaining: 1 },
      season: 'spring', day: 1, timeMinutes: 360,
      ...(d.world ?? {})
    };
    d.inventory = Array.isArray(d.inventory) ? d.inventory : [];
    d.farm = { plots: Array.isArray(d.farm?.plots) ? d.farm.plots : [], animals: Array.isArray(d.farm?.animals) ? d.farm.animals : [] };
    d.journal = { fishCaught: {}, wildlifeSeen: [], recipesKnown: [], notes: Array.isArray(d.journal?.notes) ? d.journal.notes : [], ...(d.journal ?? {}) };
    d.quests = { active: Array.isArray(d.quests?.active) ? d.quests.active : [], completed: [], failed: [] };
    d.settings = {
      quality: 'medium', particles: true, screenEffects: true, shadows: true,
      ambientAnimation: true, musicVolume: 0.7, sfxVolume: 0.8, language: 'en',
      ...(d.settings ?? {})
    };
    return d as SaveData;
  }
}
