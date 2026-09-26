import { NPCData } from '../types/NPCTypes';

/** Location anchors within the village region (pixel coords, 1024x1024 map). */
export const VILLAGE_ANCHORS: Record<string, { x: number; y: number }> = {
  home_sari: { x: 300, y: 260 },
  shop: { x: 420, y: 545 },
  plaza: { x: 512, y: 512 },
  well: { x: 560, y: 470 },
  farm_gate: { x: 512, y: 950 }
};

export const NPCS: Record<string, NPCData> = {
  sari: {
    id: 'sari', name: 'Sari', age: 28,
    personality: 'cheerful',
    homeRegion: 'village', workplace: 'shop',
    schedule: [
      { start: 6 * 60, end: 9 * 60, location: 'home_sari', activity: 'breakfast' },
      { start: 9 * 60, end: 18 * 60, location: 'shop', activity: 'tending the store' },
      { start: 18 * 60, end: 22 * 60, location: 'plaza', activity: 'socializing' }
    ],
    likes: ['crop_turnipa', 'egg_fresh'],
    dislikes: ['fish_duskgill'],
    romanceable: true,
    color: 0xe87a9a,
    greet: 'Morning! The turnipa crop looks lovely this season.'
  },
  pak_darma: {
    id: 'pak_darma', name: 'Pak Darma', age: 61,
    personality: 'grumpy',
    homeRegion: 'village', workplace: 'well',
    schedule: [
      { start: 5 * 60, end: 12 * 60, location: 'well', activity: 'drawing water' },
      { start: 12 * 60, end: 14 * 60, location: 'plaza', activity: 'midday meal' },
      { start: 14 * 60, end: 20 * 60, location: 'farm_gate', activity: 'watching the fields' }
    ],
    likes: ['wood_hard', 'milk_rich'],
    dislikes: ['sap_seed'],
    romanceable: false,
    color: 0x8a7a5a,
    greet: 'Hmph. Mind the mud on your boots, youngster.'
  },
  lila: {
    id: 'lila', name: 'Lila', age: 17,
    personality: 'shy',
    homeRegion: 'village', workplace: 'plaza',
    schedule: [
      { start: 8 * 60, end: 15 * 60, location: 'plaza', activity: 'reading' },
      { start: 15 * 60, end: 19 * 60, location: 'well', activity: 'daydreaming' }
    ],
    likes: ['fish_silversip', 'crystal_shard'],
    dislikes: ['ore_iron'],
    romanceable: false,
    color: 0x9ac8e8,
    greet: 'Oh! I was watching the butterflies. Did you need something?'
  }
};
