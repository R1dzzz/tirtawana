export type ItemType = 'seed' | 'crop' | 'fish' | 'tool' | 'material' | 'food' | 'misc';

export interface ItemData {
  id: string;
  name: string;
  type: ItemType;
  sellValue: number;
  description: string;
  /** For seeds: which crop this seed grows */
  cropId?: string;
  /** Max stack size (default 99) */
  stackMax?: number;
}
