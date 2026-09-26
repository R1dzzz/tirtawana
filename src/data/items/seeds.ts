import { ItemData } from '../types/ItemTypes';

export const SEED_ITEMS: Record<string, ItemData> = {
  seed_turnipa: {
    id: 'seed_turnipa',
    name: 'Turnipa Seeds',
    type: 'seed',
    sellValue: 15,
    description: 'Hardy spring root vegetable. Forgiving for beginners.',
    cropId: 'turnipa'
  },
  seed_sungrain: {
    id: 'seed_sungrain',
    name: 'Sungrain Seeds',
    type: 'seed',
    sellValue: 25,
    description: 'Golden summer grain that loves long sunny days.',
    cropId: 'sungrain'
  },
  seed_glowberry: {
    id: 'seed_glowberry',
    name: 'Glowberry Seeds',
    type: 'seed',
    sellValue: 60,
    description: 'Autumn berry with a faint inner light. Regrows after harvest.',
    cropId: 'glowberry'
  },
  seed_snowpearl: {
    id: 'seed_snowpearl',
    name: 'Snowpearl Seeds',
    type: 'seed',
    sellValue: 75,
    description: 'Rare winter bloom prized by chefs and alchemists.',
    cropId: 'snowpearl'
  }
};

export const CROP_ITEMS: Record<string, ItemData> = {
  crop_turnipa: {
    id: 'crop_turnipa',
    name: 'Turnipa',
    type: 'crop',
    sellValue: 40,
    description: 'Crisp and slightly sweet. A village staple.'
  },
  crop_sungrain: {
    id: 'crop_sungrain',
    name: 'Sungrain',
    type: 'crop',
    sellValue: 55,
    description: 'Grains that glow faintly at dusk.'
  },
  crop_glowberry: {
    id: 'crop_glowberry',
    name: 'Glowberry',
    type: 'crop',
    sellValue: 80,
    description: 'A soft blue light pulses inside the berry.'
  },
  crop_snowpearl: {
    id: 'crop_snowpearl',
    name: 'Snowpearl',
    type: 'crop',
    sellValue: 95,
    description: 'Cold to the touch. Melts sweetly on the tongue.'
  }
};
