import { RecipeData } from '../types/RecipeTypes';

/** Original TIRTAWANA recipes. */
export const RECIPES: Record<string, RecipeData> = {
  // --- Kitchen (cooking) ---
  boiled_egg: {
    id: 'boiled_egg', name: 'Boiled Egg', station: 'kitchen',
    ingredients: [{ itemId: 'egg_fresh', quantity: 1 }],
    outputItemId: 'food_boiled_egg', outputQuantity: 1,
    effects: { hunger: 25, health: 5 },
    description: 'Simple, warm, reliable.'
  },
  turnipa_stew: {
    id: 'turnipa_stew', name: 'Turnipa Stew', station: 'kitchen',
    ingredients: [
      { itemId: 'crop_turnipa', quantity: 2 },
      { itemId: 'milk_rich', quantity: 1 }
    ],
    outputItemId: 'food_turnipa_stew', outputQuantity: 1,
    effects: { hunger: 60, health: 20, stamina: 30 },
    description: 'A hearty village classic. Restores serious stamina.'
  },
  grilled_fish: {
    id: 'grilled_fish', name: 'Grilled Fish', station: 'kitchen',
    ingredients: [{ itemId: 'fish_silversip', quantity: 1 }],
    outputItemId: 'food_grilled_fish', outputQuantity: 1,
    effects: { hunger: 35, thirst: 10, health: 10 },
    description: 'Crispy skin, tender flesh.'
  },
  berry_tart: {
    id: 'berry_tart', name: 'Glowberry Tart', station: 'kitchen',
    ingredients: [
      { itemId: 'crop_glowberry', quantity: 2 },
      { itemId: 'egg_fresh', quantity: 1 }
    ],
    outputItemId: 'food_berry_tart', outputQuantity: 1,
    effects: { hunger: 45, stamina: 20, buff: 'luck', buffMinutes: 120 },
    description: 'Faintly luminous. Said to bring luck for the rest of the day.'
  },
  // --- Workbench ---
  animal_feed: {
    id: 'animal_feed', name: 'Animal Feed', station: 'workbench',
    ingredients: [{ itemId: 'crop_turnipa', quantity: 1 }],
    outputItemId: 'animal_feed', outputQuantity: 3,
    description: 'Mash turnipa into feed. 1 crop makes 3 portions.'
  },
  softwood_plank: {
    id: 'softwood_plank', name: 'Softwood Plank', station: 'workbench',
    ingredients: [{ itemId: 'wood_soft', quantity: 2 }],
    outputItemId: 'mat_plank_soft', outputQuantity: 1,
    description: 'Sawn smooth. Building material for village projects.'
  },
  hardwood_plank: {
    id: 'hardwood_plank', name: 'Hardwood Plank', station: 'workbench',
    ingredients: [{ itemId: 'wood_hard', quantity: 2 }],
    outputItemId: 'mat_plank_hard', outputQuantity: 1,
    description: 'Sturdy lumber for serious construction.'
  }
};
