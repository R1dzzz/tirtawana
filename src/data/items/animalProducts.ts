import { ItemData } from '../types/ItemTypes';

export const ANIMAL_PRODUCT_ITEMS: Record<string, ItemData> = {
  egg_fresh: { id: 'egg_fresh', name: 'Fresh Egg', type: 'material', sellValue: 25, description: 'Warm from the coop. Good for cooking.' },
  wool_soft: { id: 'wool_soft', name: 'Soft Wool', type: 'material', sellValue: 60, description: 'Fluffy and clean. The weaver pays well for this.' },
  milk_rich: { id: 'milk_rich', name: 'Rich Milk', type: 'material', sellValue: 45, description: 'Creamy top layer. Delicious.' },
  animal_feed: { id: 'animal_feed', name: 'Animal Feed', type: 'material', sellValue: 5, description: 'A sack of grain mix. Every farm animal eats this.' }
};
