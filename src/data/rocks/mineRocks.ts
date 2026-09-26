import { RockData } from '../types/OreTypes';

export const ROCK_TYPES: Record<string, RockData> = {
  rock_stone: { id: 'rock_stone', name: 'Stone Deposit', hp: 2, requiredTool: 'tool_pickaxe',
    yields: [{ itemId: 'mat_stone', minQty: 2, maxQty: 4, chance: 1.0 }], color: 0x8a8a8a },
  vein_copper: { id: 'vein_copper', name: 'Copper Vein', hp: 3, requiredTool: 'tool_pickaxe',
    yields: [{ itemId: 'ore_copper', minQty: 1, maxQty: 3, chance: 1.0 },
             { itemId: 'mat_stone', minQty: 1, maxQty: 2, chance: 0.5 }], color: 0xc87a4a },
  vein_iron: { id: 'vein_iron', name: 'Iron Vein', hp: 4, requiredTool: 'tool_pickaxe',
    yields: [{ itemId: 'ore_iron', minQty: 1, maxQty: 2, chance: 1.0 },
             { itemId: 'mat_stone', minQty: 1, maxQty: 2, chance: 0.4 }], color: 0xb0b8c0 },
  cluster_crystal: { id: 'cluster_crystal', name: 'Crystal Cluster', hp: 4, requiredTool: 'tool_pickaxe',
    yields: [{ itemId: 'crystal_shard', minQty: 1, maxQty: 2, chance: 1.0 },
             { itemId: 'mat_stone', minQty: 1, maxQty: 2, chance: 0.6 }], color: 0x9a4ad9 },
  geode_echo: { id: 'geode_echo', name: 'Echo Geode', hp: 5, requiredTool: 'tool_pickaxe',
    yields: [{ itemId: 'gem_echo', minQty: 1, maxQty: 1, chance: 0.35 },
             { itemId: 'crystal_shard', minQty: 1, maxQty: 2, chance: 0.6 },
             { itemId: 'mat_stone', minQty: 2, maxQty: 3, chance: 1.0 }], color: 0x6a4ad9 }
};

export const REGION_ROCKS: Record<string, Array<{ rockId: string; weight: number }>> = {
  mountain: [
    { rockId: 'rock_stone', weight: 60 },
    { rockId: 'vein_copper', weight: 30 },
    { rockId: 'vein_iron', weight: 10 }
  ],
  caverns: [
    { rockId: 'cluster_crystal', weight: 45 },
    { rockId: 'geode_echo', weight: 30 },
    { rockId: 'vein_iron', weight: 25 }
  ],
  ancient_forest: [
    { rockId: 'rock_stone', weight: 50 },
    { rockId: 'vein_copper', weight: 50 }
  ],
  mines: [
    { rockId: 'rock_stone', weight: 30 },
    { rockId: 'vein_copper', weight: 30 },
    { rockId: 'vein_iron', weight: 20 },
    { rockId: 'cluster_crystal', weight: 12 },
    { rockId: 'geode_echo', weight: 8 }
  ]
};
