import { ItemData } from '../types/ItemTypes';

export const MATERIAL_ITEMS: Record<string, ItemData> = {
  mat_stone: { id: 'mat_stone', name: 'Stone', type: 'material', sellValue: 5, description: 'Rough-hewn rock. Useful for construction.' },
  ore_copper: { id: 'ore_copper', name: 'Copper Ore', type: 'material', sellValue: 25, description: 'Warm-toned ore. The village smith covets it.' },
  ore_iron: { id: 'ore_iron', name: 'Iron Ore', type: 'material', sellValue: 45, description: 'Heavy and dependable. Forged into serious tools.' },
  crystal_shard: { id: 'crystal_shard', name: 'Crystal Shard', type: 'material', sellValue: 120, description: 'Hums faintly when the Resonance shifts.' },
  gem_echo: { id: 'gem_echo', name: 'Echo Gem', type: 'material', sellValue: 300, description: 'Cut it and a sound like distant bells rings out.' },
  tool_climbing_gear: { id: 'tool_climbing_gear', name: 'Climbing Gear', type: 'tool', sellValue: 300, description: 'Rope, hooks, and chalk. Opens the mountain path.' },
  tool_pickaxe: { id: 'tool_pickaxe', name: 'Pickaxe', type: 'tool', sellValue: 250, description: 'Swings through stone and ore veins alike.' }
};
