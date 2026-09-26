export interface AnimalSpeciesData {
  id: string;
  name: string;
  productItemId: string;
  /** Days between products */
  produceDays: number;
  /** Base sell value of one product */
  productValue: number;
  /** Daily feed cost (1 feed item = 1 unit) */
  feedPerDay: number;
  purchasePrice: number;
  color: number;
  description: string;
}

export interface AnimalInstance {
  id: string;
  speciesId: string;
  name: string;
  hunger: number;      // 0..100, drops daily
  happiness: number;   // 0..100
  cleanliness: number; // 0..100
  bond: number;        // 0..100 grows with petting
  age: number;         // days owned
  daysSinceProduct: number;
  personality: 'calm' | 'playful' | 'shy' | 'stubborn';
}
