import { Season } from '../../systems/TimeSystem';

export interface FestivalData {
  id: string;
  name: string;
  /** Day-of-season it runs (1-based) */
  dayOfSeason: number;
  season: Season;
  location: string;         // anchor key
  description: string;
  /** Contest: submit an item; judged by category + quality */
  contestItemType: 'food' | 'crop' | 'fish';
  contestPrompt: string;
  /** Gold reward = base + valueMult × item sellValue × qualityMult */
  rewardBase: number;
  rewardValueMult: number;
}

export interface FestivalEntry {
  festivalId: string;
  itemId: string;
  quality: number;
  score: number;
}
