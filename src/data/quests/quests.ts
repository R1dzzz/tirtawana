import { QuestData } from '../types/QuestTypes';

/** Original TIRTAWANA quests. */
export const QUESTS: Record<string, QuestData> = {
  settle_in: {
    id: 'settle_in', title: 'Settle In',
    description: 'Make the farm your own. Harvest 3 Turnipa and introduce yourself around the village.',
    type: 'main', giver: 'world', autoAccept: true,
    objectives: [
      { id: 'harvest3', description: 'Harvest 3 Turnipa', event: 'harvest', target: 3 },
      { id: 'meet2', description: 'Talk to 2 villagers', event: 'talk', target: 2 }
    ],
    rewardGold: 150,
    rewardItems: [{ itemId: 'animal_feed', quantity: 3 }]
  },
  bridge_blues: {
    id: 'bridge_blues', title: 'Bridge Blues',
    description: 'The river bridge is falling apart. Pak Darma mutters about repairs. Gather materials.',
    type: 'npc', giver: 'pak_darma', requires: 'settle_in',
    objectives: [
      { id: 'wood15', description: 'Gather 15 wood', event: 'chop', target: 15 },
      { id: 'stone10', description: 'Gather 10 stone', event: 'mine', target: 10 }
    ],
    rewardGold: 200,
    rewardItems: [{ itemId: 'tool_climbing_gear', quantity: 1 }]
  },
  angler_green: {
    id: 'angler_green', title: 'Greenhorn Angler',
    description: 'Prove yourself on the water. Catch 5 fish of any kind.',
    type: 'collection', giver: 'sari',
    objectives: [{ id: 'fish5', description: 'Catch 5 fish', event: 'fish', target: 5 }],
    rewardGold: 120,
    rewardItems: [{ itemId: 'seed_glowberry', quantity: 2 }]
  },
  deep_delver: {
    id: 'deep_delver', title: 'Deep Delver',
    description: 'Something hums in the depths of the Echoing Mines. Mine 8 ore veins.',
    type: 'exploration', giver: 'world', requires: 'bridge_blues',
    objectives: [{ id: 'ore8', description: 'Mine 8 ore', event: 'mine', target: 8 }],
    rewardGold: 300,
    rewardItems: [{ itemId: 'crystal_shard', quantity: 2 }]
  }
};

/** Chain order for main-quest progression display. */
export const QUEST_ORDER = ['settle_in', 'bridge_blues', 'angler_green', 'deep_delver'];
