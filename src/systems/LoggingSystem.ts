import { EventBus, Events } from '../core/EventBus';

export interface TreeInstance {
  id: string;
  regionId: string;
  growth: number;
  alive: boolean;
}

export interface ChopResult {
  depleted: boolean;
  drops: Array<{ itemId: string; quantity: number }>;
}

/** Tree growth cycles + chopping. Regeneration scales with Forest Resonance. */
export class LoggingSystem {
  private rng: () => number;
  private trees = new Map<string, TreeInstance>();
  private counter = 0;

  static readonly BASE_REGROWTH = 0.34;

  constructor(rng: () => number = Math.random) { this.rng = rng; }

  plant(regionId: string): TreeInstance {
    const tree: TreeInstance = { id: `tree_${++this.counter}`, regionId, growth: 0, alive: true };
    this.trees.set(tree.id, tree);
    return tree;
  }

  get(id: string): TreeInstance | undefined { return this.trees.get(id); }
  getAll(): TreeInstance[] { return Array.from(this.trees.values()); }

  chop(id: string): ChopResult {
    const tree = this.trees.get(id);
    if (!tree || !tree.alive) return { depleted: false, drops: [] };
    if (tree.growth >= 1) {
      tree.alive = false;
      const hard = tree.regionId === 'forest';
      const drops: Array<{ itemId: string; quantity: number }> = [
        { itemId: hard ? 'wood_hard' : 'wood_soft', quantity: 2 + Math.floor(this.rng() * 2) },
        { itemId: 'sap_seed', quantity: 1 }
      ];
      if (this.rng() < 0.12) drops.push({ itemId: 'resin_amber', quantity: 1 });
      EventBus.emit(Events.RESONANCE_CHANGED, { region: 'forest', delta: -2, action: 'chop' });
      return { depleted: true, drops };
    }
    tree.alive = false;
    return { depleted: true, drops: [{ itemId: 'sap_seed', quantity: 1 }] };
  }

  replant(id: string): boolean {
    const tree = this.trees.get(id);
    if (!tree || tree.alive) return false;
    tree.alive = true;
    tree.growth = 0;
    EventBus.emit(Events.RESONANCE_CHANGED, { region: 'forest', delta: +3, action: 'replant' });
    return true;
  }

  advanceDay(forestResonance: number = 50): void {
    const factor = 0.5 + (forestResonance / 50);
    for (const tree of this.trees.values()) {
      if (tree.alive && tree.growth < 1) {
        tree.growth = Math.min(1, tree.growth + LoggingSystem.BASE_REGROWTH * factor);
      }
    }
  }

  serialize(): TreeInstance[] { return this.getAll().map(t => ({ ...t })); }
  load(trees: TreeInstance[]): void {
    this.trees.clear();
    for (const t of trees) {
      this.trees.set(t.id, { ...t });
      const n = parseInt(t.id.split('_')[1], 10);
      if (n > this.counter) this.counter = n;
    }
  }
}
