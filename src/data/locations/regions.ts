export interface RegionExit {
  direction: 'north' | 'south' | 'east' | 'west';
  to: string;
  requires?: GateRequirement;
}

export type GateRequirement =
  | { type: 'none' }
  | { type: 'bridge'; bridgeId: string }
  | { type: 'flag'; flag: string }
  | { type: 'resonance'; region: string; min: number }
  | { type: 'tool'; itemId: string };

export interface RegionData {
  id: string;
  name: string;
  description: string;
  mapWidth: number;
  mapHeight: number;
  backgroundColor: string;
  musicTheme: string;
  unlockedByDefault: boolean;
  gateRequirement?: string;
  connections: string[];
  treeDensity: number;
  exits: RegionExit[];
  spawnFrom: Record<string, { x: number; y: number }>;
  spawnDefault: { x: number; y: number };
  farmable: boolean;
  hasFarmhouse: boolean;
  hasShop: boolean;
}

export const TILE = 16;
const MAP = 64 * TILE;

function edgeSpawn(dir: 'north' | 'south' | 'east' | 'west'): { x: number; y: number } {
  switch (dir) {
    case 'north': return { x: MAP / 2, y: 3 * TILE };
    case 'south': return { x: MAP / 2, y: MAP - 3 * TILE };
    case 'east': return { x: MAP - 3 * TILE, y: MAP / 2 };
    case 'west': return { x: 3 * TILE, y: MAP / 2 };
  }
}

function opposite(dir: 'north' | 'south' | 'east' | 'west') {
  return ({ north: 'south', south: 'north', east: 'west', west: 'east' } as const)[dir];
}

function exitsFor(map: Partial<Record<'north' | 'south' | 'east' | 'west', { to: string; requires?: GateRequirement }>>): RegionExit[] {
  return (Object.entries(map) as Array<[any, any]>).map(([dir, v]) => ({ direction: dir, to: v.to, requires: v.requires }));
}

function spawnMap(exits: RegionExit[]): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {};
  for (const e of exits) out[e.to] = edgeSpawn(e.direction);
  return out;
}

const villageExits = exitsFor({ south: { to: 'farm' }, east: { to: 'meadow' } });
const farmExits = exitsFor({ north: { to: 'village' } });
const meadowExits = exitsFor({ west: { to: 'village' }, east: { to: 'forest' } });
const forestExits = exitsFor({
  west: { to: 'meadow' },
  east: { to: 'river', requires: { type: 'bridge', bridgeId: 'river_bridge' } },
  south: { to: 'mountain', requires: { type: 'tool', itemId: 'tool_climbing_gear' } },
  north: { to: 'ancient_forest', requires: { type: 'resonance', region: 'forest', min: 60 } }
});
const riverExits = exitsFor({
  west: { to: 'forest' },
  east: { to: 'waterfall' },
  south: { to: 'coast' }
});
const mountainExits = exitsFor({ north: { to: 'forest' }, south: { to: 'mines' } });
const minesExits = exitsFor({ north: { to: 'mountain' } });
const waterfallExits = exitsFor({ west: { to: 'river' }, east: { to: 'caverns' } });
const cavernsExits = exitsFor({ west: { to: 'waterfall' } });
const coastExits = exitsFor({ north: { to: 'river' }, east: { to: 'beach' } });
const beachExits = exitsFor({ west: { to: 'coast' } });
const ancientForestExits = exitsFor({ west: { to: 'forest' } });

export const REGIONS: Record<string, RegionData> = {
  village: {
    id: 'village', name: 'Starting Village',
    description: 'A small settlement where your journey begins.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#2d5a27', musicTheme: 'village_theme',
    unlockedByDefault: true,
    connections: ['farm', 'meadow'],
    treeDensity: 0.15,
    exits: villageExits,
    spawnFrom: spawnMap(villageExits),
    spawnDefault: edgeSpawn('west'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: true
  },
  farm: {
    id: 'farm', name: 'Player Farm',
    description: 'Your own patch of land to cultivate. Home, sweet home.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#3d6b2f', musicTheme: 'farm_theme',
    unlockedByDefault: true,
    connections: ['village'],
    treeDensity: 0.1,
    exits: farmExits,
    spawnFrom: spawnMap(farmExits),
    spawnDefault: edgeSpawn('north'),
    farmable: true,
    hasFarmhouse: true,
    hasShop: false
  },
  meadow: {
    id: 'meadow', name: 'Whispering Meadow',
    description: 'Gentle grasslands with wildflowers and butterflies.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#4a7c3a', musicTheme: 'meadow_theme',
    unlockedByDefault: true,
    connections: ['village', 'forest'],
    treeDensity: 0.2,
    exits: meadowExits,
    spawnFrom: spawnMap(meadowExits),
    spawnDefault: edgeSpawn('west'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: false
  },
  forest: {
    id: 'forest', name: 'Dense Forest',
    description: 'Thick woodland rich with timber and wildlife.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#1e3d1a', musicTheme: 'forest_theme',
    unlockedByDefault: true,
    connections: ['meadow', 'river'],
    treeDensity: 0.5,
    exits: forestExits,
    spawnFrom: spawnMap(forestExits),
    spawnDefault: edgeSpawn('west'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: false
  },
  river: {
    id: 'river', name: 'River Valley',
    description: 'A flowing river teeming with fish.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#2a4a5a', musicTheme: 'river_theme',
    unlockedByDefault: false,
    gateRequirement: 'bridge_repair',
    connections: ['forest'],
    treeDensity: 0.1,
    exits: riverExits,
    spawnFrom: spawnMap(riverExits),
    spawnDefault: edgeSpawn('west'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: false
  },
  mountain: {
    id: 'mountain', name: 'Mount Tirta',
    description: 'Towering peaks with precious ores.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#5a5a6a', musicTheme: 'mountain_theme',
    unlockedByDefault: false,
    gateRequirement: 'climbing_gear',
    connections: ['forest', 'mines'],
    treeDensity: 0.05,
    exits: mountainExits,
    spawnFrom: spawnMap(mountainExits),
    spawnDefault: edgeSpawn('north'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: false
  },
  mines: {
    id: 'mines', name: 'Echoing Mines',
    description: 'Dark tunnels glittering with ore and crystal.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#2a2a3a', musicTheme: 'mines_theme',
    unlockedByDefault: false,
    connections: ['mountain'],
    treeDensity: 0,
    exits: minesExits,
    spawnFrom: spawnMap(minesExits),
    spawnDefault: edgeSpawn('north'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: false
  },
  ancient_forest: {
    id: 'ancient_forest', name: 'Ancient Forest',
    description: 'Old growth that only opens to those the forest trusts.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#0f2612', musicTheme: 'ancient_forest_theme',
    unlockedByDefault: false,
    connections: ['forest'],
    treeDensity: 0.7,
    exits: ancientForestExits,
    spawnFrom: spawnMap(ancientForestExits),
    spawnDefault: edgeSpawn('south'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: false
  },
  waterfall: {
    id: 'waterfall', name: 'Mistfall Waterfall',
    description: 'A towering veil of water. Something glitters behind it.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#2a4a5a', musicTheme: 'waterfall_theme',
    unlockedByDefault: false,
    connections: ['river', 'caverns'],
    treeDensity: 0.1,
    exits: waterfallExits,
    spawnFrom: spawnMap(waterfallExits),
    spawnDefault: edgeSpawn('west'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: false
  },
  caverns: {
    id: 'caverns', name: 'Hidden Caverns',
    description: 'A secret grotto behind the falls, rich in crystal.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#1a1a2e', musicTheme: 'caverns_theme',
    unlockedByDefault: false,
    connections: ['waterfall'],
    treeDensity: 0,
    exits: cavernsExits,
    spawnFrom: spawnMap(cavernsExits),
    spawnDefault: edgeSpawn('west'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: false
  },
  coast: {
    id: 'coast', name: 'Rocky Coast',
    description: 'Salt spray and gulls. The open sea beyond.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#3a5a6a', musicTheme: 'coast_theme',
    unlockedByDefault: false,
    connections: ['river', 'beach'],
    treeDensity: 0.05,
    exits: coastExits,
    spawnFrom: spawnMap(coastExits),
    spawnDefault: edgeSpawn('north'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: false
  },
  beach: {
    id: 'beach', name: 'Sunspar Beach',
    description: 'Warm sand and long tides. Ocean fish spawn here.',
    mapWidth: 64, mapHeight: 64,
    backgroundColor: '#c8b880', musicTheme: 'beach_theme',
    unlockedByDefault: false,
    connections: ['coast'],
    treeDensity: 0,
    exits: beachExits,
    spawnFrom: spawnMap(beachExits),
    spawnDefault: edgeSpawn('west'),
    farmable: false,
    hasFarmhouse: false,
    hasShop: false
  }
};

export const STARTING_REGION = 'village';

export const WORLD_PLAN = [
  'village', 'farm', 'meadow', 'forest', 'ancient_forest', 'river', 'waterfall',
  'coast', 'beach', 'mountain', 'mines', 'ruins', 'monster_territory',
  'caverns', 'late_region', 'isle_1', 'isle_2'
] as const;
