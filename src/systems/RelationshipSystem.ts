import { DIALOGUE_TREES } from '../data/dialogue/trees';
import { DialogueNode, DialogueTree, DialogueCondition } from '../data/types/DialogueTypes';
import { NPCS } from '../data/npcs/villagers';

export interface RelationshipState {
  friendship: number;
  hearts: number;
  romanceable: boolean;
  dating: boolean;
  married: boolean;
  heartEventsSeen: string[];
}

/** Pure dialogue-tree walker + romance progression. */
export class RelationshipSystem {
  private states = new Map<string, RelationshipState>();

  constructor() {
    for (const id of Object.keys(NPCS)) {
      const romanceable = NPCS[id].romanceable;
      this.states.set(id, {
        friendship: 0, hearts: 0, romanceable,
        dating: false, married: false, heartEventsSeen: []
      });
    }
  }

  getState(npcId: string): RelationshipState | undefined { return this.states.get(npcId); }

  /** Friendship drives hearts; cap at 10. */
  addFriendship(npcId: string, delta: number): number {
    const st = this.states.get(npcId);
    if (!st) return 0;
    st.friendship = Math.max(0, st.friendship + delta);
    st.hearts = Math.min(10, Math.floor(st.friendship / 100));
    return st.friendship;
  }

  getTree(npcId: string): DialogueTree | undefined {
    const tree = DIALOGUE_TREES[npcId];
    return tree && tree.npcId === npcId ? tree : undefined;
  }

  static checkCondition(cond: DialogueCondition | undefined, ctx: {
    hearts: number; season: string; hasItem: (id: string) => boolean; flag: (k: string) => boolean;
  }): boolean {
    if (!cond) return true;
    if (cond.minHearts !== undefined && ctx.hearts < cond.minHearts) return false;
    if (cond.maxHearts !== undefined && ctx.hearts > cond.maxHearts) return false;
    if (cond.season && ctx.season !== cond.season) return false;
    if (cond.hasItem && !ctx.hasItem(cond.hasItem)) return false;
    if (cond.flag && !ctx.flag(cond.flag)) return false;
    return true;
  }

  /** Heart events begin at this many hearts (below = regular conditional nodes). */
  static readonly HEART_EVENT_MIN_HEARTS = 4;

  /**
   * Get the start node for a conversation, preferring unseen heart-event nodes.
   * Only nodes with minHearts >= HEART_EVENT_MIN_HEARTS count as heart events;
   * lower-threshold conditional nodes are reached through dialogue options.
   */
  getStartNode(npcId: string): DialogueNode | null {
    const tree = this.getTree(npcId);
    const st = this.states.get(npcId);
    if (!tree || !st) return null;

    // Find best heart event not yet seen
    let best: DialogueNode | null = null;
    let bestHearts = -1;
    for (const node of Object.values(tree.nodes)) {
      if (node.condition?.minHearts === undefined) continue;
      if (node.condition.minHearts < RelationshipSystem.HEART_EVENT_MIN_HEARTS) continue;
      if (node.condition.minHearts > st.hearts) continue;
      const key = `${tree.id}:${node.id}`;
      if (st.heartEventsSeen.includes(key)) continue;
      if (node.condition.minHearts > bestHearts) {
        best = node;
        bestHearts = node.condition.minHearts;
      }
    }
    if (best) {
      st.heartEventsSeen.push(`${tree.id}:${best.id}`);
      return best;
    }
    return tree.nodes[tree.start] ?? null;
  }

  getNode(treeId: string, nodeId: string): DialogueNode | null {
    return DIALOGUE_TREES[treeId]?.nodes[nodeId] ?? null;
  }

  /** Romance: ask to date at 6+ hearts; propose at 10 hearts. */
  canAskOut(npcId: string): boolean {
    const st = this.states.get(npcId);
    return !!st && st.romanceable && !st.dating && st.hearts >= 6;
  }

  askOut(npcId: string): boolean {
    if (!this.canAskOut(npcId)) return false;
    this.states.get(npcId)!.dating = true;
    return true;
  }

  canPropose(npcId: string): boolean {
    const st = this.states.get(npcId);
    return !!st && st.dating && !st.married && st.hearts >= 10;
  }

  propose(npcId: string): boolean {
    if (!this.canPropose(npcId)) return false;
    const st = this.states.get(npcId)!;
    st.married = true;
    return true;
  }

  serialize(): Record<string, RelationshipState> {
    return Object.fromEntries([...this.states.entries()].map(([k, v]) => [k, { ...v, heartEventsSeen: [...v.heartEventsSeen] }]));
  }
  load(states: Record<string, RelationshipState>): void {
    for (const [k, v] of Object.entries(states)) {
      if (this.states.has(k)) this.states.set(k, { ...v, heartEventsSeen: [...(v.heartEventsSeen ?? [])] });
    }
  }
}
