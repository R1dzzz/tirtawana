import { MonsterData } from '../types/MonsterTypes';

export const MONSTERS: Record<string, MonsterData> = {
  pebblemite: {
    id: 'pebblemite', name: 'Pebblemite',
    regions: ['mountain', 'mines'], nocturnal: false,
    maxHp: 20, damage: 5, attackCooldown: 1.6, speed: 30, aggroRadius: 60, rarity: 0.5,
    drops: [{ itemId: 'mat_stone', chance: 0.8, minQty: 1, maxQty: 2 }],
    color: 0x8a8a92,
    description: 'A crab-like creature wearing a stone shell.'
  },
  duskling: {
    id: 'duskling', name: 'Duskling',
    regions: ['forest', 'meadow'], nocturnal: true,
    maxHp: 30, damage: 8, attackCooldown: 1.2, speed: 55, aggroRadius: 90, rarity: 0.35,
    drops: [
      { itemId: 'mat_stone', chance: 0.3, minQty: 1, maxQty: 1 },
      { itemId: 'crystal_shard', chance: 0.15, minQty: 1, maxQty: 1 }
    ],
    color: 0x4a3a6a,
    description: 'A shadowy imp that only stirs after dark.'
  },
  gorgewhelp: {
    id: 'gorgewhelp', name: 'Gorgewhelp',
    regions: ['mines'], nocturnal: false,
    maxHp: 60, damage: 14, attackCooldown: 2.0, speed: 40, aggroRadius: 70, rarity: 0.2,
    drops: [
      { itemId: 'ore_iron', chance: 0.5, minQty: 1, maxQty: 2 },
      { itemId: 'gem_echo', chance: 0.08, minQty: 1, maxQty: 1 }
    ],
    color: 0x6a2a2a,
    description: 'A hulking cave brute. Its roar shakes loose ore.'
  }
};
