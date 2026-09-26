import { ItemData } from '../types/ItemTypes';
import { SEED_ITEMS, CROP_ITEMS } from './seeds';
import { FISH_ITEMS } from './fish';
import { MATERIAL_ITEMS } from './materials';
import { WOOD_ITEMS } from './woodItems';
import { ANIMAL_PRODUCT_ITEMS } from './animalProducts';
import { FOOD_ITEMS } from './foodItems';

export const ITEMS: Record<string, ItemData> = {
  ...SEED_ITEMS,
  ...CROP_ITEMS,
  ...FISH_ITEMS,
  ...MATERIAL_ITEMS,
  ...WOOD_ITEMS,
  ...ANIMAL_PRODUCT_ITEMS,
  ...FOOD_ITEMS
};

export function getItem(id: string): ItemData | undefined {
  return ITEMS[id];
}
