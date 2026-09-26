export interface DialogueNode {
  id: string;
  text: string;
  /** Options; empty/undefined = single "continue" to `next` */
  options?: Array<{
    label: string;
    next?: string;           // node id; ends conversation if omitted
    friendship?: number;     // delta on choose
    condition?: DialogueCondition;
  }>;
  next?: string;             // auto-continue target when no options
  condition?: DialogueCondition;
}

export interface DialogueCondition {
  minHearts?: number;
  maxHearts?: number;
  season?: string;
  hasItem?: string;
  flag?: string;             // save.world.villageDevelopment key > 0
}

export interface DialogueTree {
  id: string;
  npcId: string;
  nodes: Record<string, DialogueNode>;
  start: string;
}
