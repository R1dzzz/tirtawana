export interface SaveData {
  version: number;
  revisionId: string;
  playerId: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'local' | 'pending' | 'synced' | 'conflict';
  playtimeSeconds: number;
  world: {
    currentRegionId: string;
    discoveredRegions: string[];
    playerPosition: { x: number; y: number };
    resonance: Record<string, number>;
    villageDevelopment: Record<string, number>;
    bridgesBuilt: string[];
    weather: { current: string; next: string; daysRemaining: number };
    season: string;
    day: number;
    timeMinutes: number;
  };
  player: {
    name: string;
    health: number; maxHealth: number;
    stamina: number; maxStamina: number;
    hunger: number; maxHunger: number;
    thirst: number; maxThirst: number;
    fatigue: number; maxFatigue: number;
    gold: number;
    skills: Record<string, { level: number; xp: number }>;
    equipped: { tool: string | null; weapon: string | null };
    quickSlots: (string | null)[];
  };
  inventory: Array<{
    itemId: string; quantity: number; quality: number;
    locked: boolean; favorite: boolean;
  }>;
  farm: { plots: Array<any>; animals: Array<any> };
  npcs: Record<string, any>;
  quests: { active: Array<any>; completed: string[]; failed: string[] };
  journal: {
    fishCaught: Record<string, any>;
    wildlifeSeen: string[];
    recipesKnown: string[];
    notes: string[];
  };
  settings: {
    quality: 'low' | 'medium' | 'high';
    particles: boolean; screenEffects: boolean; shadows: boolean;
    ambientAnimation: boolean;
    musicVolume: number; sfxVolume: number;
    language: 'en' | 'id' | 'ja';
  };
}

export const SAVE_VERSION = 1;

export function createDefaultSave(): SaveData {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    revisionId: crypto.randomUUID(),
    playerId: crypto.randomUUID(),
    createdAt: now, updatedAt: now,
    syncStatus: 'local',
    playtimeSeconds: 0,
    world: {
      currentRegionId: 'village',
      discoveredRegions: ['village'],
      playerPosition: { x: 400, y: 300 },
      resonance: {
        village: 50, farm: 50, meadow: 50, forest: 50,
        ancient_forest: 50, river: 50, waterfall: 50,
        coast: 50, beach: 50, mountain: 50, mines: 50,
        ruins: 50, monster_territory: 50, caverns: 50,
        late_region: 50, isle_1: 50, isle_2: 50
      },
      villageDevelopment: {},
      bridgesBuilt: [],
      weather: { current: 'sunny', next: 'cloudy', daysRemaining: 1 },
      season: 'spring',
      day: 1,
      timeMinutes: 6 * 60
    },
    player: {
      name: 'Traveler',
      health: 100, maxHealth: 100,
      stamina: 100, maxStamina: 100,
      hunger: 100, maxHunger: 100,
      thirst: 100, maxThirst: 100,
      fatigue: 0, maxFatigue: 100,
      gold: 500,
      skills: {},
      equipped: { tool: null, weapon: null },
      quickSlots: [null, null, null, null]
    },
    inventory: [],
    farm: { plots: [], animals: [] },
    npcs: {},
    quests: { active: [], completed: [], failed: [] },
    journal: { fishCaught: {}, wildlifeSeen: [], recipesKnown: [], notes: [] },
    settings: {
      quality: 'medium',
      particles: true, screenEffects: true, shadows: true, ambientAnimation: true,
      musicVolume: 0.7, sfxVolume: 0.8,
      language: 'en'
    }
  };
}
