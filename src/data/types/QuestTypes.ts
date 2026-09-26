export type QuestType = 'main' | 'npc' | 'bounty' | 'collection' | 'exploration';

export interface QuestObjective {
  id: string;
  description: string;
  /** Event key the system listens for (e.g. 'harvest', 'fish', 'mine', 'chop', 'discover') */
  event: string;
  target: number;
}

export interface QuestData {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  giver: string;              // npcId or 'world'
  objectives: QuestObjective[];
  rewardGold: number;
  rewardItems?: Array<{ itemId: string; quantity: number }>;
  /** Quest that must be completed first */
  requires?: string;
  /** Auto-accepted at game start / after prerequisite completes */
  autoAccept?: boolean;
}

export interface ActiveQuest {
  questId: string;
  progress: Record<string, number>; // objectiveId -> count
  completed: boolean;
  turnedIn: boolean;
}
