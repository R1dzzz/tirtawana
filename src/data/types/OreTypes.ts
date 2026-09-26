export interface YieldEntry {
  itemId: string;
  minQty: number;
  maxQty: number;
  chance: number;
}

export interface RockData {
  id: string;
  name: string;
  hp: number;
  requiredTool: string;
  yields: YieldEntry[];
  color: number;
}

export interface MiningHitResult {
  depleted: boolean;
  drops: Array<{ itemId: string; quantity: number }>;
}
