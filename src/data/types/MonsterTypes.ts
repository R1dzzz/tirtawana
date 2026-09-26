export interface MonsterData {
  id: string;
  name: string;
  regions: string[];
  /** Only at night? */
  nocturnal: boolean;
  maxHp: number;
  /** Damage per hit to player */
  damage: number;
  /** Seconds between attacks */
  attackCooldown: number;
  /** Pixels per second movement */
  speed: number;
  /** Aggro radius in px; 0 = passive until attacked */
  aggroRadius: number;
  /** 0..1 rarity per spawn attempt */
  rarity: number;
  drops: Array<{ itemId: string; chance: number; minQty: number; maxQty: number }>;
  color: number;
  description: string;
}
