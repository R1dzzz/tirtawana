import type { ISystem } from './interfaces/ISystem';
import { EventBus, Events } from '../core/EventBus';

export interface NeedsState {
  health: number; maxHealth: number;
  stamina: number; maxStamina: number;
  hunger: number; maxHunger: number;
  thirst: number; maxThirst: number;
  fatigue: number; maxFatigue: number;
}

export class NeedsSystem implements ISystem {
  state: NeedsState;

  private static readonly HUNGER_PER_MIN = 100 / 1440;
  private static readonly THIRST_PER_MIN = 100 / 960;
  private static readonly FATIGUE_PER_MIN = 100 / 1200;
  private static readonly FATIGUE_MOVING_MULT = 1.5;
  private static readonly STAMINA_REGEN = 100 / 30;
  private static readonly STAMINA_REGEN_LOW_NEEDS = 100 / 120;
  private static readonly STARVATION_DAMAGE = 100 / 1440;
  private static readonly DEHYDRATION_DAMAGE = 100 / 960;

  private msPerGameMinute: number;
  private accumulatorMs = 0;
  private isMoving = false;

  constructor(msPerGameMinute: number, initial?: Partial<NeedsState>) {
    this.msPerGameMinute = msPerGameMinute;
    this.state = {
      health: 100, maxHealth: 100,
      stamina: 100, maxStamina: 100,
      hunger: 100, maxHunger: 100,
      thirst: 100, maxThirst: 100,
      fatigue: 0, maxFatigue: 100,
      ...initial
    };
  }

  init(): void {}
  destroy(): void {}

  update(deltaMs: number): void {
    this.accumulatorMs += deltaMs;
    let minutes = 0;
    while (this.accumulatorMs >= this.msPerGameMinute) {
      this.accumulatorMs -= this.msPerGameMinute;
      minutes++;
    }
    if (minutes > 0) this.applyMinutes(minutes);
  }

  applyMinutes(minutes: number): void {
    const s = this.state;
    const fatigueRate = NeedsSystem.FATIGUE_PER_MIN * (this.isMoving ? NeedsSystem.FATIGUE_MOVING_MULT : 1);

    s.hunger = Math.max(0, s.hunger - NeedsSystem.HUNGER_PER_MIN * minutes);
    s.thirst = Math.max(0, s.thirst - NeedsSystem.THIRST_PER_MIN * minutes);
    s.fatigue = Math.min(s.maxFatigue, s.fatigue + fatigueRate * minutes);

    const lowNeeds = s.hunger < 25 || s.thirst < 25;
    const regen = (lowNeeds || s.fatigue > 75) ? NeedsSystem.STAMINA_REGEN_LOW_NEEDS : NeedsSystem.STAMINA_REGEN;
    s.stamina = Math.min(s.maxStamina, s.stamina + regen * minutes);

    if (s.hunger <= 0) s.health = Math.max(0, s.health - NeedsSystem.STARVATION_DAMAGE * minutes);
    if (s.thirst <= 0) s.health = Math.max(0, s.health - NeedsSystem.DEHYDRATION_DAMAGE * minutes);
  }

  setMoving(moving: boolean): void { this.isMoving = moving; }

  getMoveEfficiency(): number {
    const s = this.state;
    if (s.fatigue >= 90 || s.hunger < 15 || s.thirst < 15) return 0.7;
    if (s.fatigue >= 70 || s.hunger < 30 || s.thirst < 30) return 0.85;
    return 1.0;
  }

  heal(amount: number): void {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
  }

  energize(amount: number): void {
    this.state.stamina = Math.min(this.state.maxStamina, this.state.stamina + amount);
  }

  feed(amount: number): void {
    this.state.hunger = Math.min(this.state.maxHunger, this.state.hunger + amount);
    EventBus.emit(Events.INVENTORY_CHANGED, null);
  }

  drink(amount: number): void {
    this.state.thirst = Math.min(this.state.maxThirst, this.state.thirst + amount);
    EventBus.emit(Events.INVENTORY_CHANGED, null);
  }

  applySleep(): void {
    const s = this.state;
    s.fatigue = 0;
    s.stamina = s.maxStamina;
    s.hunger = Math.max(0, s.hunger - 15);
    s.thirst = Math.max(0, s.thirst - 20);
    s.health = Math.min(s.maxHealth, s.health + 10);
  }

  applyCollapse(): void {
    const s = this.state;
    s.health = Math.max(1, s.health - s.maxHealth * 0.1); // never kills
    s.fatigue = 40;
    s.stamina = s.maxStamina * 0.5;
    s.hunger = Math.max(0, s.hunger - 15);
    s.thirst = Math.max(0, s.thirst - 20);
  }

  snapshot(): NeedsState {
    return { ...this.state };
  }
}
