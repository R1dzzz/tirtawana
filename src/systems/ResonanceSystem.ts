import { EventBus, Events } from '../core/EventBus';

export type ResonanceTier = 'withered' | 'strained' | 'balanced' | 'thriving' | 'radiant';

export interface ResonanceEffect {
  regrowthMult: number;    // tree/farm growth speed
  spawnBonus: number;      // extra rare-fish/rare-wildlife rolls
  monsterAggression: number;
  npcMoodBonus: number;    // extra friendship per talk
  hiddenPaths: boolean;
}

/** Signature TIRTAWANA system: every region holds a score 0..100. */
export class ResonanceSystem {
  private scores = new Map<string, number>();
  private actionLog: Array<{ region: string; action: string; delta: number }> = [];

  /** Initialize all regions at neutral 50 (or load from save). */
  constructor(initial?: Record<string, number>) {
    if (initial) {
      for (const [k, v] of Object.entries(initial)) this.scores.set(k, this.clamp(v));
    }
  }

  private clamp(v: number): number { return Math.max(0, Math.min(100, Math.round(v))); }
  get(region: string): number { return this.scores.get(region) ?? 50; }

  /** Apply a delta with per-action diminishing returns (anti spam). */
  applyAction(region: string, action: string, delta: number): number {
    const recent = this.actionLog.filter(l => l.region === region && l.action === action).length;
    // Diminishing: each repeat of the same action within the log window counts less
    const scale = Math.max(0.25, 1 - recent * 0.25);
    const effective = delta > 0 ? Math.max(1, Math.round(delta * scale)) : Math.min(-1, Math.round(delta * scale));
    const next = this.clamp(this.get(region) + effective);
    this.scores.set(region, next);
    this.actionLog.push({ region, action, delta: effective });
    if (this.actionLog.length > 60) this.actionLog.shift();
    EventBus.emit(Events.RESONANCE_CHANGED, { region, score: next, action, delta: effective });
    return next;
  }

  /** Tier bands per spec. */
  static tier(score: number): ResonanceTier {
    if (score <= 20) return 'withered';
    if (score <= 40) return 'strained';
    if (score <= 60) return 'balanced';
    if (score <= 80) return 'thriving';
    return 'radiant';
  }

  /** Effects scale with tier. */
  static effects(score: number): ResonanceEffect {
    const t = ResonanceSystem.tier(score);
    switch (t) {
      case 'withered': return { regrowthMult: 0.5, spawnBonus: 0, monsterAggression: 1.5, npcMoodBonus: 0, hiddenPaths: false };
      case 'strained': return { regrowthMult: 0.8, spawnBonus: 0, monsterAggression: 1.2, npcMoodBonus: 0, hiddenPaths: false };
      case 'balanced': return { regrowthMult: 1.0, spawnBonus: 0, monsterAggression: 1.0, npcMoodBonus: 1, hiddenPaths: false };
      case 'thriving': return { regrowthMult: 1.4, spawnBonus: 1, monsterAggression: 0.9, npcMoodBonus: 2, hiddenPaths: true };
      case 'radiant':  return { regrowthMult: 2.0, spawnBonus: 2, monsterAggression: 0.7, npcMoodBonus: 3, hiddenPaths: true };
    }
  }

  /** Decay toward 50 very slowly (the island forgets, but gently). */
  dailyDrift(): void {
    for (const [k, v] of this.scores) {
      if (v > 52) this.scores.set(k, v - 1);
      else if (v < 48) this.scores.set(k, v + 1);
    }
  }

  serialize(): Record<string, number> { return Object.fromEntries(this.scores); }
  load(scores: Record<string, number>): void {
    this.scores.clear();
    for (const [k, v] of Object.entries(scores)) this.scores.set(k, this.clamp(v));
  }
}
