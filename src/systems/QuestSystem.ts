import { QUESTS } from '../data/quests/quests';
import { ActiveQuest, QuestData } from '../data/types/QuestTypes';
import { EventBus, Events } from '../core/EventBus';

/** Pure quest tracking. GameScene feeds events; QuestScene renders the log. */
export class QuestSystem {
  private active = new Map<string, ActiveQuest>();
  private turnedIn: string[] = [];
  private talkedNPCs = new Set<string>();

  constructor() {
    // Auto-accept eligible quests
    for (const q of Object.values(QUESTS)) {
      if (q.autoAccept && (!q.requires || this.turnedIn.includes(q.requires))) {
        this.accept(q.id);
      }
    }
  }

  getQuest(id: string): QuestData | undefined { return QUESTS[id]; }

  accept(questId: string): boolean {
    if (!QUESTS[questId] || this.active.has(questId) || this.turnedIn.includes(questId)) return false;
    const progress: Record<string, number> = {};
    for (const o of QUESTS[questId].objectives) progress[o.id] = 0;
    this.active.set(questId, { questId, progress, completed: false, turnedIn: false });
    return true;
  }

  getActive(): ActiveQuest[] { return Array.from(this.active.values()).filter(a => !a.turnedIn); }
  getCompleted(): string[] { return [...this.turnedIn]; }
  isTurnedIn(id: string): boolean { return this.turnedIn.includes(id); }

  /**
   * Feed a gameplay event. `talk` events dedupe per NPC (meeting 2 distinct villagers).
   * Returns array of questIds that became complete with this event.
   */
  notify(event: string, amount: number = 1, meta?: { npcId?: string }): string[] {
    const newlyCompleted: string[] = [];

    if (event === 'talk' && meta?.npcId) {
      if (this.talkedNPCs.has(meta.npcId)) return [];
      this.talkedNPCs.add(meta.npcId);
    }

    for (const aq of this.active.values()) {
      if (aq.completed || aq.turnedIn) continue;
      const q = QUESTS[aq.questId];
      for (const o of q.objectives) {
        if (o.event !== event) continue;
        aq.progress[o.id] = Math.min(o.target, (aq.progress[o.id] ?? 0) + amount);
      }
      if (this.checkComplete(aq) && !aq.completed) {
        aq.completed = true;
        newlyCompleted.push(aq.questId);
        EventBus.emit(Events.QUEST_COMPLETED, { questId: aq.questId, title: q.title });
      }
    }
    return newlyCompleted;
  }

  private checkComplete(aq: ActiveQuest): boolean {
    const q = QUESTS[aq.questId];
    return q.objectives.every(o => (aq.progress[o.id] ?? 0) >= o.target);
  }

  /** Turn in a completed quest. Returns rewards or null if not ready. */
  turnIn(questId: string): { gold: number; items: Array<{ itemId: string; quantity: number }> } | null {
    const aq = this.active.get(questId);
    if (!aq || !aq.completed || aq.turnedIn) return null;
    aq.turnedIn = true;
    this.turnedIn.push(questId);
    this.active.delete(questId);
    const q = QUESTS[questId];
    // Unlock chained quests
    for (const next of Object.values(QUESTS)) {
      if (next.requires === questId) this.accept(next.id);
    }
    return { gold: q.rewardGold, items: q.rewardItems ?? [] };
  }

  /** Progress fraction 0..1 for UI bars. */
  progressFraction(aq: ActiveQuest): number {
    const q = QUESTS[aq.questId];
    const total = q.objectives.reduce((s, o) => s + o.target, 0);
    const done = q.objectives.reduce((s, o) => s + Math.min(o.target, aq.progress[o.id] ?? 0), 0);
    return total === 0 ? 0 : done / total;
  }

  serialize(): { active: ActiveQuest[]; turnedIn: string[]; talked: string[] } {
    return {
      active: Array.from(this.active.values()).map(a => ({ ...a, progress: { ...a.progress } })),
      turnedIn: [...this.turnedIn],
      talked: [...this.talkedNPCs]
    };
  }
  load(data: { active?: ActiveQuest[]; turnedIn?: string[]; talked?: string[] }): void {
    this.active.clear();
    for (const a of data.active ?? []) {
      if (QUESTS[a.questId]) this.active.set(a.questId, { ...a, progress: { ...a.progress } });
    }
    this.turnedIn = [...(data.turnedIn ?? [])];
    this.talkedNPCs = new Set(data.talked ?? []);
  }
}
