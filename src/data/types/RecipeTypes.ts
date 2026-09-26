export interface RecipeIngredient {
  itemId: string;
  quantity: number;
}

export interface FoodEffect {
  hunger?: number;
  thirst?: number;
  health?: number;
  stamina?: number;
  /** Temporary buff tag (e.g. 'speed', 'luck') — consumed by buff system later */
  buff?: string;
  buffMinutes?: number;
}

export interface RecipeData {
  id: string;
  name: string;
  station: 'kitchen' | 'workbench';
  ingredients: RecipeIngredient[];
  outputItemId: string;
  outputQuantity: number;
  /** Cooking recipes restore needs; workbench recipes don't */
  effects?: FoodEffect;
  description: string;
}

export interface CraftResult {
  ok: boolean;
  message: string;
}
