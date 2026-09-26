import { MONSTERS } from '../data/monsters/monsters';
import { MonsterData } from '../data/types/MonsterTypes';

export interface MonsterInstance {
  speciesId: string;
  hp: number;
  x: number;
  y: number;
  /** Seconds until next attack */
  cooldown: number;
  aggroed: boolean;
  alive: boolean;
}

export interface AttackResult {
  killed: boolean;
  damage: number;
}

/** Pure combat math. Rendering and movement stay in GameScene. */
export class CombatSystem {
  private rng: () => number;

  constructor(rng: () => number = Math.random) { this.rng = rng; }

  static spawn(regionId: string, isNight: boolean, rng: () => number = Math.random, maxCount = 2): MonsterInstance[] {
    const out: MonsterInstance[] = [];
    const pool = Object.values(MONSTERS).filter(m =>
      m.regions.includes(regionId) && (!m.nocturnal || isNight)
    );
    for (let i = 0; i < maxCount; i++) {
      for (const m of pool) {
        if (rng() < m.rarity) {
          out.push({
            speciesId: m.id,
            hp: m.maxHp,
            x: 100 + rng() * 824,
            y: 100 + rng() * 824,
            cooldown: 0,
            aggroed: false,
            alive: true
          });
          break;
        }
      }
    }
    return out;
  }

  static data(m: MonsterInstance): MonsterData { return MONSTERS[m.speciesId]; }

  /** Player hits a monster. */
  static attack(m: MonsterInstance, playerDamage: number): AttackResult {
    if (!m.alive) return { killed: false, damage: 0 };
    m.hp = Math.max(0, m.hp - playerDamage);
    m.aggroed = true;
    if (m.hp === 0) m.alive = false;
    return { killed: !m.alive, damage: playerDamage };
  }

  /**
   * Tick one monster's AI for dtMs. Returns damage dealt to player this tick (0 if none).
   * Player position passed for distance checks.
   */
  tick(m: MonsterInstance, playerX: number, playerY: number, dtMs: number): number {
    if (!m.alive) return 0;
    const d = MONSTERS[m.speciesId];
    m.cooldown = Math.max(0, m.cooldown - dtMs / 1000);

    const dx = playerX - m.x, dy = playerY - m.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < d.aggroRadius) m.aggroed = true;
    if (!m.aggroed) return 0;

    // Move toward player until in attack range (16px)
    if (dist > 16) {
      const step = d.speed * (dtMs / 1000);
      m.x += (dx / dist) * step;
      m.y += (dy / dist) * step;
      return 0;
    }
    if (m.cooldown <= 0) {
      m.cooldown = d.attackCooldown;
      return d.damage;
    }
    return 0;
  }

  /** Roll drops for a killed monster. */
  rollDrops(m: MonsterInstance): Array<{ itemId: string; quantity: number }> {
    const d = MONSTERS[m.speciesId];
    const out: Array<{ itemId: string; quantity: number }> = [];
    for (const drop of d.drops) {
      if (this.rng() < drop.chance) {
        out.push({ itemId: drop.itemId, quantity: drop.minQty + Math.floor(this.rng() * (drop.maxQty - drop.minQty + 1)) });
      }
    }
    return out;
  }
}
