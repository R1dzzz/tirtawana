import { ItemData } from '../types/ItemTypes';

export const WOOD_ITEMS: Record<string, ItemData> = {
  wood_soft: { id: 'wood_soft', name: 'Softwood', type: 'material', sellValue: 12, description: 'Light, easy to work. From young meadow trees.' },
  wood_hard: { id: 'wood_hard', name: 'Hardwood', type: 'material', sellValue: 30, description: 'Dense and strong. Forest oak yields this.' },
  sap_seed: { id: 'sap_seed', name: 'Tree Seed', type: 'material', sellValue: 8, description: 'A generic tree seed. Replanting helps the Forest.' },
  resin_amber: { id: 'resin_amber', name: 'Amber Resin', type: 'material', sellValue: 65, description: 'Golden sap, warm to the touch. Rare drop.' }
};
