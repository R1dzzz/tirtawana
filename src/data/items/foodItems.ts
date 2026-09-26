import { ItemData } from '../types/ItemTypes';

export const FOOD_ITEMS: Record<string, ItemData> = {
  food_boiled_egg: { id: 'food_boiled_egg', name: 'Boiled Egg', type: 'food', sellValue: 35, description: 'Simple, warm, reliable. Eat to restore hunger.' },
  food_turnipa_stew: { id: 'food_turnipa_stew', name: 'Turnipa Stew', type: 'food', sellValue: 90, description: 'Hearty village classic. Big hunger and stamina restore.' },
  food_grilled_fish: { id: 'food_grilled_fish', name: 'Grilled Fish', type: 'food', sellValue: 45, description: 'Crispy and restorative.' },
  food_berry_tart: { id: 'food_berry_tart', name: 'Glowberry Tart', type: 'food', sellValue: 150, description: 'Luminous dessert. Grants a touch of luck.' },
  mat_plank_soft: { id: 'mat_plank_soft', name: 'Softwood Plank', type: 'material', sellValue: 30, description: 'Sawn smooth. Building material.' },
  mat_plank_hard: { id: 'mat_plank_hard', name: 'Hardwood Plank', type: 'material', sellValue: 75, description: 'Sturdy lumber for serious construction.' }
};
