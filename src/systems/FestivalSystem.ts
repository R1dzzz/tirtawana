import { FESTIVALS } from '../data/festivals/festivals';
import { FestivalData, FestivalEntry } from '../data/types/FestivalTypes';
import { Season, DAYS_PER_SEASON } from './TimeSystem';
import { ITEMS } from '../data/items';

const QUALITY_MULT = [1, 1.3, 1.7, 2.2];

/** Pure festival logic: date resolution, judging, one-entry-per-festival rule. */
export class FestivalSystem {
  private entries: FestivalEntry[] = [];

  /** Which festival (if any) runs on this absolute day. */
  static festivalOnDay(day: number, season: Season): FestivalData | null {
    const dayOfSeason = ((day - 1) % DAYS_PER_SEASON) + 1;
    for (const f of Object.values(FESTIVALS)) {
      if (f.season === season && f.dayOfSeason === dayOfSeason) return f;
    }
    return null;
  }

  /** Is today a festival day? */
  isFestivalDay(day: number, season: Season): FestivalData | null {
    return FestivalSystem.festivalOnDay(day, season);
  }

  /** Eligible items from inventory stacks for a festival contest. */
  static eligibleItems(festival: FestivalData, stacks: Array<{ itemId: string; quality: number; quantity: number }>) {
    return stacks.filter(s => {
      const item = ITEMS[s.itemId];
      if (!item || s.quantity < 1) return false;
      if (festival.contestItemType === 'food') return item.type === 'food';
      if (festival.contestItemType === 'crop') return item.type === 'crop';
      if (festival.contestItemType === 'fish') return item.type === 'fish';
      return false;
    });
  }

  /**
   * Judge a submission: score = sellValue × qualityMult.
   * Reward = rewardBase + rewardValueMult × score.
   * One entry per festival (per profile); best first entry stands.
   */
  judge(festival: FestivalData, itemId: string, quality: number): { score: number; rewardGold: number } {
    const item = ITEMS[itemId];
    const q = QUALITY_MULT[Math.min(quality, 3)];
    const score = Math.round((item?.sellValue ?? 0) * q);
    const rewardGold = festival.rewardBase + Math.round(festival.rewardValueMult * score);
    this.entries.push({ festivalId: festival.id, itemId, quality, score });
    return { score, rewardGold };
  }

  hasEntered(festivalId: string): boolean {
    return this.entries.some(e => e.festivalId === festivalId);
  }

  bestScore(festivalId: string): number {
    const fest = this.entries.filter(e => e.festivalId === festivalId);
    return fest.length ? Math.max(...fest.map(e => e.score)) : 0;
  }

  serialize(): FestivalEntry[] { return this.entries.map(e => ({ ...e })); }
  load(entries: FestivalEntry[]): void { this.entries = entries.map(e => ({ ...e })); }
}
