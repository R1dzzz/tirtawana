import { GAME_CONFIG } from '../app/Config';
import { EventBus, Events } from '../core/EventBus';
import type { ISystem } from './interfaces/ISystem';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const DAYS_PER_SEASON = 28;

export type DayPhase =
  | 'morning' | 'late_morning' | 'afternoon' | 'evening' | 'night' | 'deep_night';

export class TimeSystem implements ISystem {
  private day: number;
  private timeMinutes: number;
  private msPerGameMinute: number;
  private accumulatorMs = 0;
  private awakeMinutes = 0;
  private exhaustionFired = false;

  onDayRollover: (() => void) | null = null;
  onExhaustionThreshold: (() => void) | null = null;

  constructor(
    dayLengthRealMinutes: number = GAME_CONFIG.DAY_LENGTH_MINUTES,
    startDay = 1,
    startMinutes = GAME_CONFIG.DAY_START_HOUR * 60
  ) {
    this.msPerGameMinute = (dayLengthRealMinutes * 60 * 1000) / 1440;
    this.day = startDay;
    this.timeMinutes = startMinutes;
  }

  init(): void {}
  destroy(): void {
    this.onDayRollover = null;
    this.onExhaustionThreshold = null;
  }

  update(deltaMs: number): void {
    this.accumulatorMs += deltaMs;
    while (this.accumulatorMs >= this.msPerGameMinute) {
      this.accumulatorMs -= this.msPerGameMinute;
      this.tickMinute();
    }
  }

  private tickMinute(): void {
    this.timeMinutes++;
    this.awakeMinutes++;

    const awakeLimit = (GAME_CONFIG.DAY_END_HOUR - GAME_CONFIG.DAY_START_HOUR) * 60;
    if (this.awakeMinutes >= awakeLimit && !this.exhaustionFired) {
      this.exhaustionFired = true;
      this.onExhaustionThreshold?.();
    }

    if (this.timeMinutes >= 1440) {
      this.timeMinutes -= 1440;
      this.day++;
      this.onDayRollover?.();
      EventBus.emit(Events.DAY_ADVANCED, { day: this.day });
    }

    EventBus.emit(Events.TIME_CHANGED, this.getState());
  }

  sleepUntilMorning(): void {
    const morning = GAME_CONFIG.DAY_START_HOUR * 60;
    if (this.timeMinutes >= morning) this.day++;
    this.timeMinutes = morning;
    this.awakeMinutes = 0;
    this.exhaustionFired = false;
    this.onDayRollover?.();
    EventBus.emit(Events.DAY_ADVANCED, { day: this.day });
    EventBus.emit(Events.SLEEP_COMPLETED, this.getState());
  }

  getDay(): number { return this.day; }
  getTimeMinutes(): number { return this.timeMinutes; }
  getAwakeMinutes(): number { return this.awakeMinutes; }
  getHour(): number { return Math.floor(this.timeMinutes / 60); }
  getMinute(): number { return Math.floor(this.timeMinutes % 60); }

  getSeason(): Season {
    const idx = Math.floor((this.day - 1) / DAYS_PER_SEASON) % SEASON_ORDER.length;
    return SEASON_ORDER[idx];
  }

  getPhase(): DayPhase {
    const h = this.getHour();
    if (h >= 22) return 'night';
    if (h >= 18) return 'evening';
    if (h >= 14) return 'afternoon';
    if (h >= 10) return 'late_morning';
    if (h >= 6) return 'morning';
    return 'deep_night';
  }

  isNight(): boolean {
    const h = this.getHour();
    return h >= 22 || h < 6;
  }

  formatTime(): string {
    const h = this.getHour().toString().padStart(2, '0');
    const m = this.getMinute().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  getState(): { day: number; timeMinutes: number; season: Season; phase: DayPhase } {
    return {
      day: this.day,
      timeMinutes: this.timeMinutes,
      season: this.getSeason(),
      phase: this.getPhase()
    };
  }

  loadFromSave(day: number, timeMinutes: number): void {
    this.day = day;
    this.timeMinutes = timeMinutes;
    this.awakeMinutes = 0;
    this.exhaustionFired = false;
  }

  debugAddMinutes(minutes: number): void {
    for (let i = 0; i < minutes; i++) this.tickMinute();
  }
}
