export type WildlifeBehavior = 'passive' | 'skittish' | 'aggressive' | 'nocturnal' | 'rare';

export interface WildlifeData {
  id: string;
  name: string;
  regions: string[];
  behavior: WildlifeBehavior;
  rarity: number;
  materialValue: number;
  observable: boolean;
  description: string;
}

export interface WildlifeSpawn {
  speciesId: string;
  x: number;
  y: number;
  alertness: number;
  fled: boolean;
}
