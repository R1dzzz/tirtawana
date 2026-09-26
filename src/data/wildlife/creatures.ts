import { WildlifeData } from '../types/WildlifeTypes';

export const WILDLIFE: Record<string, WildlifeData> = {
  meadowhare: { id: 'meadowhare', name: 'Meadowhare', regions: ['meadow', 'farm'], behavior: 'skittish', rarity: 0.6, materialValue: 20, observable: true, description: 'Long ears, longer jumps. Its fur is prized for lining winter coats.' },
  duskbird: { id: 'duskbird', name: 'Duskbird', regions: ['meadow', 'forest'], behavior: 'nocturnal', rarity: 0.4, materialValue: 35, observable: true, description: 'Sings only at twilight. Its feathers shimmer violet.' },
  bristleboar: { id: 'bristleboar', name: 'Bristleboar', regions: ['forest'], behavior: 'aggressive', rarity: 0.3, materialValue: 60, observable: true, description: 'Charges when cornered. Tough hide, good eating.' },
  emberfox: { id: 'emberfox', name: 'Emberfox', regions: ['forest'], behavior: 'rare', rarity: 0.08, materialValue: 150, observable: true, description: 'A fox whose tail smoulders like dying embers. Extremely rare.' }
};
