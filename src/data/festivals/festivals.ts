import { FestivalData } from '../types/FestivalTypes';

/** One festival per season, always on day 28, at the plaza. */
export const FESTIVALS: Record<string, FestivalData> = {
  spring_bloom: {
    id: 'spring_bloom', name: 'Bloom Festival',
    dayOfSeason: 28, season: 'spring', location: 'plaza',
    description: 'The village celebrates the first full bloom. Bring your finest crop!',
    contestItemType: 'crop',
    contestPrompt: 'Present your best crop for judging:',
    rewardBase: 100, rewardValueMult: 2
  },
  summer_ember: {
    id: 'summer_ember', name: 'Embernight Feast',
    dayOfSeason: 28, season: 'summer', location: 'plaza',
    description: 'A night feast under lanterns. The best dish wins the Golden Ladle.',
    contestItemType: 'food',
    contestPrompt: 'Serve your best dish:',
    rewardBase: 100, rewardValueMult: 2
  },
  autumn_harvest: {
    id: 'autumn_harvest', name: 'Harvest Fair',
    dayOfSeason: 28, season: 'autumn', location: 'plaza',
    description: "Give thanks for the year's bounty. Fishers compete for the Silver Scale.",
    contestItemType: 'fish',
    contestPrompt: 'Show your finest catch:',
    rewardBase: 100, rewardValueMult: 2
  },
  winter_star: {
    id: 'winter_star', name: 'Starlight Gala',
    dayOfSeason: 28, season: 'winter', location: 'plaza',
    description: 'The longest night, lit by a thousand candles. Bring something luminous.',
    contestItemType: 'food',
    contestPrompt: 'Offer your most brilliant creation:',
    rewardBase: 150, rewardValueMult: 2
  }
};

export const FESTIVAL_ORDER = ['spring_bloom', 'summer_ember', 'autumn_harvest', 'winter_star'];
