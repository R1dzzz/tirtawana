import { Season } from '../../systems/TimeSystem';

export interface ShopStockItem {
  itemId: string;
  seasons?: Season[];
}

export interface ShopData {
  id: string;
  name: string;
  regionId: string;
  stock: ShopStockItem[];
}

export const VILLAGE_SHOP: ShopData = {
  id: 'village_general',
  name: 'Tirta Trading Post',
  regionId: 'village',
  stock: [
    { itemId: 'seed_turnipa' },
    { itemId: 'seed_sungrain', seasons: ['summer'] },
    { itemId: 'seed_glowberry', seasons: ['autumn'] },
    { itemId: 'seed_snowpearl', seasons: ['winter'] },
    { itemId: 'tool_pickaxe' },
    { itemId: 'tool_climbing_gear' },
    { itemId: 'animal_feed' }
  ]
};

export const SHOPS: Record<string, ShopData> = {
  [VILLAGE_SHOP.id]: VILLAGE_SHOP
};
