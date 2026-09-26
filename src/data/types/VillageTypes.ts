export interface VillageProjectCost {
  itemId: string;
  quantity: number;
}

export interface VillageProject {
  id: string;
  name: string;
  description: string;
  costs: VillageProjectCost[];
  gold: number;
  /** Effect applied to save on completion */
  effect: { type: 'bridge'; bridgeId: string } | { type: 'flag'; flag: string } | { type: 'shopStock'; itemId: string };
}

export interface ProjectProgress {
  contributed: Record<string, number>; // itemId -> amount given
  goldGiven: number;
  completed: boolean;
}
