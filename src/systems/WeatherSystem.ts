export type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'heavy_rain' | 'storm' | 'snow' | 'fog';

export interface WeatherState {
  current: WeatherType;
  daysRemaining: number;
}

export const WEATHER_TABLE: Record<WeatherType, { weight: number; next: WeatherType[] }> = {
  sunny:     { weight: 45, next: ['sunny', 'cloudy', 'rain'] },
  cloudy:    { weight: 25, next: ['sunny', 'rain', 'fog'] },
  rain:      { weight: 15, next: ['cloudy', 'rain', 'heavy_rain', 'sunny'] },
  heavy_rain:{ weight: 6,  next: ['rain', 'storm', 'cloudy'] },
  storm:     { weight: 3,  next: ['heavy_rain', 'rain'] },
  snow:      { weight: 0,  next: ['snow', 'cloudy'] },  // winter-only, injected
  fog:       { weight: 6,  next: ['cloudy', 'sunny'] }
};

/**
 * Pure weather state machine. Rolls a new weather when daysRemaining hits 0.
 * Snow only rolls in winter. Storms boost fish but raise monster aggression (hooks).
 */
export class WeatherSystem {
  private state: WeatherState;
  private rng: () => number;

  constructor(rng: () => number = Math.random, initial: WeatherType = 'sunny') {
    this.rng = rng;
    this.state = { current: initial, daysRemaining: 1 };
  }

  getCurrent(): WeatherType { return this.state.current; }
  getDaysRemaining(): number { return this.state.daysRemaining; }

  /** Advance one day; roll new weather when the previous one expires. */
  advanceDay(season: string): WeatherType {
    this.state.daysRemaining--;
    if (this.state.daysRemaining > 0) return this.state.current;

    // Pick from current weather's next-options; snow substitution in winter
    let options = [...WEATHER_TABLE[this.state.current].next];
    if (season === 'winter') {
      options = options.map(o => (o === 'rain' || o === 'heavy_rain') ? 'snow' : o);
      if (!options.includes('snow')) options.push('snow');
    } else {
      options = options.filter(o => o !== 'snow');
    }
    const next = options[Math.floor(this.rng() * options.length)] ?? 'sunny';
    this.state.current = next;
    // Duration: sun/cloud 1-3 days; rain family 1; storm 1; fog 1
    this.state.daysRemaining = (next === 'sunny' || next === 'cloudy')
      ? 1 + Math.floor(this.rng() * 3)
      : 1;
    return next;
  }

  /** Fishing luck multiplier per weather. */
  static fishingBonus(w: WeatherType): number {
    switch (w) {
      case 'rain': return 1.2;
      case 'heavy_rain': return 1.4;
      case 'storm': return 1.6;
      default: return 1.0;
    }
  }

  /** Crops are auto-watered by rain (light rain counts, storm does not — too harsh). */
  static watersCrops(w: WeatherType): boolean {
    return w === 'rain' || w === 'heavy_rain';
  }

  /** Fatigue rises faster in harsh weather. */
  static fatigueMultiplier(w: WeatherType): number {
    switch (w) {
      case 'storm': return 1.3;
      case 'heavy_rain': return 1.15;
      case 'snow': return 1.15;
      default: return 1.0;
    }
  }

  /** Visual tint hint for the renderer. */
  static overlayColor(w: WeatherType): number | null {
    switch (w) {
      case 'rain': case 'heavy_rain': return 0x3a4a6a;
      case 'storm': return 0x2a2a4a;
      case 'snow': return 0xdae8f5;
      case 'fog': return 0x9aa5a0;
      default: return null;
    }
  }

  serialize(): WeatherState { return { ...this.state }; }
  load(s: WeatherState): void { this.state = { ...s }; }
}
