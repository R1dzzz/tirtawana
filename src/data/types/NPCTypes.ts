export type NPCPersonality = 'cheerful' | 'grumpy' | 'shy' | 'wise' | 'mysterious';

export interface ScheduleEntry {
  /** Minutes since midnight (e.g. 6*60 = 06:00) */
  start: number;
  end: number;
  /** Location tag resolved by the region layer (e.g. 'shop', 'plaza', 'home') */
  location: string;
  activity: string;
  /** Optional restriction */
  season?: string;
  weather?: string;
}

export interface NPCData {
  id: string;
  name: string;
  age: number;
  personality: NPCPersonality;
  homeRegion: string;
  workplace: string;
  schedule: ScheduleEntry[];
  likes: string[];
  dislikes: string[];
  romanceable: boolean;
  color: number;
  /** One-line ambient dialogue (full dialogue trees in M12) */
  greet: string;
}

/** World anchor points per region for schedule locations (pixel coords). */
export interface LocationAnchor {
  x: number;
  y: number;
}
