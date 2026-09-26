import { DialogueTree } from '../types/DialogueTypes';

/** Data-driven dialogue trees — original TIRTAWANA writing. */
export const DIALOGUE_TREES: Record<string, DialogueTree> = {
  sari: {
    id: 'sari', npcId: 'sari', start: 'start',
    nodes: {
      start: {
        id: 'start',
        text: 'Welcome to the Trading Post! Anything catching your eye today?',
        options: [
          { label: 'Just browsing.', next: 'browse' },
          { label: 'How are you?', next: 'howareyou', friendship: 5 },
          { label: 'Tell me about the village.', next: 'village' }
        ]
      },
      browse: { id: 'browse', text: 'Take your time. Fresh stock arrives with the seasons.' },
      howareyou: {
        id: 'howareyou',
        text: 'Busy, but happy! Sales have been kind since you moved in.',
        next: 'start'
      },
      village: {
        id: 'village',
        text: 'Tirtawana Village is small, but the land is alive. Treat it well and it treats you well.',
        next: 'village2'
      },
      village2: {
        id: 'village2',
        text: 'Pak Darma grumbles, but he has a good heart. And Lila... she sees things the rest of us miss.',
        options: [
          { label: 'What things?', next: 'lila_secret', friendship: 5 },
          { label: 'I should go.', next: undefined }
        ]
      },
      lila_secret: {
        id: 'lila_secret',
        text: 'She says the Resonance speaks at the old well at dusk. I just hear frogs. But who knows?',
        condition: { minHearts: 1 }
      },
      // Romance path — requires 4+ hearts
      heart4: {
        id: 'heart4',
        text: 'You know... the shop feels brighter when you visit. I mean — that came out wrong. Forget I said anything!',
        options: [
          { label: 'I feel the same.', friendship: 20 },
          { label: 'Friends. Good friends.', friendship: 5 }
        ],
        condition: { minHearts: 4 }
      }
    }
  },
  pak_darma: {
    id: 'pak_darma', npcId: 'pak_darma', start: 'start',
    nodes: {
      start: {
        id: 'start',
        text: 'Hmph. The well water runs clear today. That is all the news I have.',
        options: [
          { label: 'Lovely weather.', next: 'weather', friendship: 5 },
          { label: 'Any wisdom for a farmer?', next: 'wisdom' },
          { label: 'Goodbye.', next: undefined }
        ]
      },
      weather: { id: 'weather', text: 'Weather is weather. It does not ask my opinion either.' },
      wisdom: {
        id: 'wisdom',
        text: 'Replanted trees grow faster in a forest that trusts you. The land keeps score, youngster.',
        next: 'wisdom2'
      },
      wisdom2: {
        id: 'wisdom2',
        text: 'Chop one, plant two. That was my rule for fifty years. The forest remembers kindness.',
        options: [{ label: 'I will remember that.', friendship: 10 }]
      }
    }
  },
  lila: {
    id: 'lila', npcId: 'lila', start: 'start',
    nodes: {
      start: {
        id: 'start',
        text: 'Oh! Hello. I was just... the light on the water, did you see it?',
        options: [
          { label: 'It is beautiful.', next: 'beautiful', friendship: 5 },
          { label: 'What were you reading?', next: 'book' },
          { label: 'Sorry to bother you.', next: undefined }
        ]
      },
      beautiful: {
        id: 'beautiful',
        text: 'It happens at dusk, when the Resonance is calm. Like the island is breathing out.',
        next: 'start'
      },
      book: {
        id: 'book',
        text: 'An old journal about the ruins across the river. Someday I want to see them myself...',
        options: [
          { label: 'Maybe we could go together.', next: 'together', friendship: 15 },
          { label: 'Sounds dangerous.', next: undefined }
        ]
      },
      together: {
        id: 'together',
        text: 'R-really? I mean — yes! When the bridge is repaired. Promise?',
        options: [{ label: 'Promise.', friendship: 10 }],
        condition: { minHearts: 2 }
      }
    }
  }
};
