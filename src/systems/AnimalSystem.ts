import { ANIMAL_SPECIES } from '../data/animals/species';
import { AnimalInstance } from '../data/types/AnimalTypes';

export interface AnimalActionResult {
  ok: boolean;
  message: string;
}

const PERSONALITIES: AnimalInstance['personality'][] = ['calm', 'playful', 'shy', 'stubborn'];

/** Pure farm-animal logic: needs, bonding, production. */
export class AnimalSystem {
  private rng: () => number;
  private animals = new Map<string, AnimalInstance>();
  private counter = 0;

  constructor(rng: () => number = Math.random) { this.rng = rng; }

  buy(speciesId: string, name?: string): AnimalInstance | null {
    const sp = ANIMAL_SPECIES[speciesId];
    if (!sp) return null;
    const a: AnimalInstance = {
      id: `animal_${++this.counter}`,
      speciesId,
      name: name ?? sp.name,
      hunger: 80, happiness: 60, cleanliness: 70,
      bond: 0, age: 0, daysSinceProduct: sp.produceDays, // ready on day 1
      personality: PERSONALITIES[Math.floor(this.rng() * PERSONALITIES.length)]
    };
    this.animals.set(a.id, a);
    return a;
  }

  get(id: string): AnimalInstance | undefined { return this.animals.get(id); }
  getAll(): AnimalInstance[] { return Array.from(this.animals.values()); }

  feed(id: string): AnimalActionResult {
    const a = this.animals.get(id);
    if (!a) return { ok: false, message: 'No such animal' };
    if (a.hunger > 90) return { ok: false, message: `${a.name} is full` };
    a.hunger = Math.min(100, a.hunger + 40);
    a.happiness = Math.min(100, a.happiness + 5);
    return { ok: true, message: `Fed ${a.name}` };
  }

  pet(id: string): AnimalActionResult {
    const a = this.animals.get(id);
    if (!a) return { ok: false, message: 'No such animal' };
    a.bond = Math.min(100, a.bond + 8);
    a.happiness = Math.min(100, a.happiness + 10);
    return { ok: true, message: `${a.name} enjoys the attention` };
  }

  clean(id: string): AnimalActionResult {
    const a = this.animals.get(id);
    if (!a) return { ok: false, message: 'No such animal' };
    a.cleanliness = 100;
    a.happiness = Math.min(100, a.happiness + 3);
    return { ok: true, message: `Cleaned ${a.name}'s space` };
  }

  /** Daily tick: needs decay; product ready if well kept. */
  advanceDay(): string[] {
    const ready: string[] = [];
    for (const a of this.animals.values()) {
      const sp = ANIMAL_SPECIES[a.speciesId];
      a.age++;
      a.hunger = Math.max(0, a.hunger - 25);
      a.cleanliness = Math.max(0, a.cleanliness - 15);
      const wellKept = a.hunger > 30 && a.cleanliness > 20;
      a.happiness = Math.max(0, Math.min(100,
        a.happiness + (wellKept ? 5 : -10) + (a.bond / 50)));
      a.daysSinceProduct++;
      if (wellKept && a.daysSinceProduct >= sp.produceDays) {
        a.daysSinceProduct = 0;
        ready.push(a.id);
      }
    }
    return ready;
  }

  /** Product quality from overall care. */
  static quality(a: AnimalInstance): number {
    const avg = (a.hunger + a.happiness + a.cleanliness + a.bond) / 4;
    return avg > 75 ? 2 : avg > 45 ? 1 : 0;
  }

  serialize(): AnimalInstance[] { return this.getAll().map(a => ({ ...a })); }
  load(animals: AnimalInstance[]): void {
    this.animals.clear();
    for (const a of animals) {
      this.animals.set(a.id, { ...a });
      const n = parseInt(a.id.split('_')[1], 10);
      if (n > this.counter) this.counter = n;
    }
  }
}
