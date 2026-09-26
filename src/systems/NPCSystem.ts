import { NPCS } from '../data/npcs/villagers';
import { NPCData, ScheduleEntry } from '../data/types/NPCTypes';

export interface NPCState {
  npcId: string;
  met: boolean;
  friendship: number;
  talkedToday: boolean;
}

/** Pure NPC schedule resolution. Movement is rendered by GameScene. */
export class NPCSystem {
  private states = new Map<string, NPCState>();

  constructor() {
    for (const id of Object.keys(NPCS)) {
      this.states.set(id, { npcId: id, met: false, friendship: 0, talkedToday: false });
    }
  }

  getNPC(id: string): NPCData | undefined { return NPCS[id]; }
  getState(id: string): NPCState | undefined { return this.states.get(id); }
  allNPCs(): NPCData[] { return Object.values(NPCS); }

  /**
   * Resolve which schedule entry is active at `timeMinutes`.
   * Season/weather-restricted entries win over unrestricted ones.
   * Returns null when the NPC is "home asleep" (no matching entry).
   */
  static resolveEntry(npc: NPCData, timeMinutes: number, season?: string, weather?: string): ScheduleEntry | null {
    const matches = npc.schedule.filter(e => {
      const inTime = timeMinutes >= e.start && timeMinutes < e.end;
      if (!inTime) return false;
      if (e.season && e.season !== season) return false;
      if (e.weather && e.weather !== weather) return false;
      return true;
    });
    if (matches.length === 0) return null;
    // Most specific (restricted) entry wins
    matches.sort((a, b) =>
      ((b.season ? 1 : 0) + (b.weather ? 1 : 0)) - ((a.season ? 1 : 0) + (a.weather ? 1 : 0)));
    return matches[0];
  }

  /** Where the NPC currently is (anchor key), or null if asleep at home. */
  currentLocation(npcId: string, timeMinutes: number, season?: string, weather?: string): string | null {
    const npc = NPCS[npcId];
    if (!npc) return null;
    const entry = NPCSystem.resolveEntry(npc, timeMinutes, season, weather);
    return entry ? entry.location : null;
  }

  /** Talk: friendship +20 (once per day), met flag. */
  talk(npcId: string): { friendship: number; first: boolean } {
    const st = this.states.get(npcId);
    if (!st) return { friendship: 0, first: false };
    const first = !st.met;
    st.met = true;
    if (!st.talkedToday) {
      st.talkedToday = true;
      st.friendship += 20;
    }
    return { friendship: st.friendship, first };
  }

  /** Called at day rollover. */
  advanceDay(): void {
    for (const st of this.states.values()) st.talkedToday = false;
  }

  /** Gift: +80 liked, +150 loved-equivalent (we treat likes list as loved), -50 disliked. */
  giveGift(npcId: string, itemId: string): number {
    const npc = NPCS[npcId];
    const st = this.states.get(npcId);
    if (!npc || !st) return 0;
    let delta = 10; // neutral
    if (npc.likes.includes(itemId)) delta = 80;
    if (npc.dislikes.includes(itemId)) delta = -50;
    st.friendship = Math.max(0, st.friendship + delta);
    return delta;
  }

  hearts(npcId: string): number {
    return Math.floor((this.states.get(npcId)?.friendship ?? 0) / 100);
  }

  serialize(): Record<string, NPCState> {
    return Object.fromEntries([...this.states.entries()].map(([k, v]) => [k, { ...v }]));
  }
  load(states: Record<string, NPCState>): void {
    for (const [k, v] of Object.entries(states)) {
      if (this.states.has(k)) this.states.set(k, { ...v });
    }
  }
}
