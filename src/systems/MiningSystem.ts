import { ROCK_TYPES } from '../data/rocks/mineRocks';
import { MiningHitResult } from '../data/types/OreTypes';

export class MiningSystem {
  private rng: () => number;
  constructor(rng: () => number = Math.random) { this.rng = rng; }

  static maxHp(typeId: string): number { return ROCK_TYPES[typeId]?.hp ?? 0; }
  static requiredTool(typeId: string): string | null { return ROCK_TYPES[typeId]?.requiredTool ?? null; }

  canDamage(typeId: string, toolId: string | null): boolean {
    const req = MiningSystem.requiredTool(typeId);
    return req !== null && toolId === req;
  }

  hit(rock: { typeId: string; hp: number }, toolId: string | null): MiningHitResult {
    const data = ROCK_TYPES[rock.typeId];
    if (!data) return { depleted: false, drops: [] };
    if (!this.canDamage(rock.typeId, toolId)) return { depleted: false, drops: [] };
    rock.hp = Math.max(0, rock.hp - 1);
    if (rock.hp > 0) return { depleted: false, drops: [] };
    const drops: Array<{ itemId: string; quantity: number }> = [];
    for (const y of data.yields) {
      if (this.rng() < y.chance) {
        drops.push({ itemId: y.itemId, quantity: y.minQty + Math.floor(this.rng() * (y.maxQty - y.minQty + 1)) });
      }
    }
    return { depleted: true, drops };
  }

  static rollRockType(table: Array<{ rockId: string; weight: number }>, rng: () => number = Math.random): string | null {
    if (table.length === 0) return null;
    const total = table.reduce((s, e) => s + e.weight, 0);
    let roll = rng() * total;
    for (const e of table) { roll -= e.weight; if (roll <= 0) return e.rockId; }
    return table[table.length - 1].rockId;
  }
}
