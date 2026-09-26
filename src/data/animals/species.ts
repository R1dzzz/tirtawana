import { AnimalSpeciesData } from '../types/AnimalTypes';

export const ANIMAL_SPECIES: Record<string, AnimalSpeciesData> = {
  chicken: {
    id: 'chicken', name: 'Chicken',
    productItemId: 'egg_fresh', produceDays: 1, productValue: 25,
    feedPerDay: 1, purchasePrice: 150, color: 0xf0f0e0,
    description: 'Cheerful and low-maintenance. Lays an egg almost every day.'
  },
  sheep: {
    id: 'sheep', name: 'Sheep',
    productItemId: 'wool_soft', produceDays: 3, productValue: 60,
    feedPerDay: 1, purchasePrice: 400, color: 0xe8e8f0,
    description: 'Docile fluffball. Needs shearing every few days.'
  },
  cow: {
    id: 'cow', name: 'Cow',
    productItemId: 'milk_rich', produceDays: 1, productValue: 45,
    feedPerDay: 2, purchasePrice: 800, color: 0x8a6a5a,
    description: 'Big, gentle, hungry. Rich milk every day if well fed.'
  }
};
