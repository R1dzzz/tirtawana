import { VILLAGE_PROJECTS } from '../data/village/projects';
import { VillageProject, ProjectProgress } from '../data/types/VillageTypes';
import { InventorySystem } from './InventorySystem';

export interface DonateResult {
  ok: boolean;
  message: string;
  completed?: boolean;
}

/** Village development: collective projects funded by items + gold. */
export class VillageSystem {
  private progress = new Map<string, ProjectProgress>();
  private inventory: InventorySystem;
  /** Effects applied to save on completion (bridge flags etc.) */
  onProjectCompleted: ((project: VillageProject) => void) | null = null;

  constructor(inventory: InventorySystem) {
    this.inventory = inventory;
    for (const id of Object.keys(VILLAGE_PROJECTS)) {
      this.progress.set(id, { contributed: {}, goldGiven: 0, completed: false });
    }
  }

  getProject(id: string): VillageProject | undefined { return VILLAGE_PROJECTS[id]; }
  getProgress(id: string): ProjectProgress | undefined { return this.progress.get(id); }
  allProjects(): VillageProject[] { return Object.values(VILLAGE_PROJECTS); }

  /** 0..1 overall completion fraction. */
  projectFraction(id: string): number {
    const p = VILLAGE_PROJECTS[id];
    const prog = this.progress.get(id);
    if (!p || !prog || prog.completed) return prog?.completed ? 1 : 0;
    let parts = 0, total = 0;
    for (const c of p.costs) {
      total++;
      parts += Math.min(1, (prog.contributed[c.itemId] ?? 0) / c.quantity);
    }
    total++;
    parts += Math.min(1, prog.goldGiven / p.gold);
    return parts / total;
  }

  /** Contribute one unit of an item the project still needs. */
  donateItem(projectId: string, itemId: string): DonateResult {
    const p = VILLAGE_PROJECTS[projectId];
    const prog = this.progress.get(projectId);
    if (!p || !prog) return { ok: false, message: 'Unknown project' };
    if (prog.completed) return { ok: false, message: 'Already completed' };
    const cost = p.costs.find(c => c.itemId === itemId);
    if (!cost) return { ok: false, message: `${p.name} does not need that` };
    const given = prog.contributed[itemId] ?? 0;
    if (given >= cost.quantity) return { ok: false, message: 'Enough of that already' };
    if (!this.inventory.remove(itemId, 1)) return { ok: false, message: 'You have none to give' };
    prog.contributed[itemId] = given + 1;
    return this.checkCompletion(projectId);
  }

  donateGold(projectId: string, amount: number): DonateResult {
    const p = VILLAGE_PROJECTS[projectId];
    const prog = this.progress.get(projectId);
    if (!p || !prog) return { ok: false, message: 'Unknown project' };
    if (prog.completed) return { ok: false, message: 'Already completed' };
    const remaining = p.gold - prog.goldGiven;
    const give = Math.min(amount, remaining);
    if (give <= 0) return { ok: false, message: 'Gold goal already met' };
    prog.goldGiven += give;
    const res = this.checkCompletion(projectId, true);
    return { ...res, ok: true };
  }

  private checkCompletion(projectId: string, fromGold = false): DonateResult {
    const p = VILLAGE_PROJECTS[projectId];
    const prog = this.progress.get(projectId)!;
    const itemsDone = p.costs.every(c => (prog.contributed[c.itemId] ?? 0) >= c.quantity);
    const goldDone = prog.goldGiven >= p.gold;
    if (itemsDone && goldDone) {
      prog.completed = true;
      this.onProjectCompleted?.(p);
      return { ok: true, message: `${p.name} COMPLETE! The village cheers!`, completed: true };
    }
    return fromGold
      ? { ok: true, message: `Donated ${prog.goldGiven}/${p.gold}g` }
      : { ok: true, message: 'Contribution accepted' };
  }

  serialize(): Record<string, ProjectProgress> {
    return Object.fromEntries([...this.progress.entries()].map(([k, v]) => [k, { contributed: { ...v.contributed }, goldGiven: v.goldGiven, completed: v.completed }]));
  }
  load(data: Record<string, ProjectProgress>): void {
    for (const [k, v] of Object.entries(data)) {
      if (this.progress.has(k)) {
        this.progress.set(k, { contributed: { ...(v.contributed ?? {}) }, goldGiven: v.goldGiven ?? 0, completed: !!v.completed });
      }
    }
  }
}
