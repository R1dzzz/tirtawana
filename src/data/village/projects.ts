import { VillageProject } from '../types/VillageTypes';

/** Village development projects — visible, collective, material-gated. */
export const VILLAGE_PROJECTS: Record<string, VillageProject> = {
  bridge_river: {
    id: 'bridge_river', name: 'Repair the River Bridge',
    description: 'The old bridge to River Valley is rotting. Rebuild it and new lands open.',
    costs: [
      { itemId: 'wood_soft', quantity: 10 },
      { itemId: 'wood_hard', quantity: 5 },
      { itemId: 'mat_stone', quantity: 10 }
    ],
    gold: 200,
    effect: { type: 'bridge', bridgeId: 'river_bridge' }
  },
  well_upgrade: {
    id: 'well_upgrade', name: 'Deepen the Village Well',
    description: 'A deeper well means cleaner water for everyone. Pak Darma approves of this one.',
    costs: [{ itemId: 'mat_stone', quantity: 15 }],
    gold: 100,
    effect: { type: 'flag', flag: 'well_upgraded' }
  },
  coop_upgrade: {
    id: 'coop_upgrade', name: 'Expand the Trading Post',
    description: 'A bigger store room means Sari can stock climbing gear and rare seeds.',
    costs: [
      { itemId: 'wood_hard', quantity: 8 },
      { itemId: 'mat_plank_hard', quantity: 4 }
    ],
    gold: 300,
    effect: { type: 'shopStock', itemId: 'seed_glowberry' }
  }
};

export const PROJECT_ORDER = ['bridge_river', 'well_upgrade', 'coop_upgrade'];
