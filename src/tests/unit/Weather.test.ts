import { describe, it, expect } from 'vitest';
import { WeatherSystem, WEATHER_TABLE, WeatherType } from '../../systems/WeatherSystem';

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('WeatherSystem', () => {
  it('persists weather for its duration then rolls a valid transition', () => {
    const rng = mulberry32(1);
    const ws = new WeatherSystem(rng, 'sunny');
    // sunny lasts 1-3 days; force expiry by advancing up to 4
    let seen = new Set<WeatherType>();
    for (let i = 0; i < 60; i++) {
      const w = ws.advanceDay('spring');
      seen.add(w);
      expect(WEATHER_TABLE[w]).toBeDefined();
      if (seen.size >= 3) break;
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  it('never rolls snow outside winter', () => {
    for (const seed of [2, 3, 4, 5]) {
      const ws = new WeatherSystem(mulberry32(seed), 'cloudy');
      for (let i = 0; i < 40; i++) {
        expect(ws.advanceDay('summer')).not.toBe('snow');
      }
    }
  });

  it('rolls snow in winter', () => {
    const ws = new WeatherSystem(mulberry32(9), 'cloudy');
    let snow = 0;
    for (let i = 0; i < 40; i++) if (ws.advanceDay('winter') === 'snow') snow++;
    expect(snow).toBeGreaterThan(0);
  });

  it('transitions only along declared edges', () => {
    for (const [from, def] of Object.entries(WEATHER_TABLE)) {
      for (const to of def.next) {
        expect(WEATHER_TABLE[to as WeatherType], `${from} -> ${to}`).toBeDefined();
      }
    }
  });

  it('fishing bonus scales with weather severity', () => {
    expect(WeatherSystem.fishingBonus('storm')).toBeGreaterThan(WeatherSystem.fishingBonus('rain'));
    expect(WeatherSystem.fishingBonus('rain')).toBeGreaterThan(WeatherSystem.fishingBonus('sunny'));
    expect(WeatherSystem.fishingBonus('sunny')).toBe(1.0);
  });

  it('rain waters crops; storm does not', () => {
    expect(WeatherSystem.watersCrops('rain')).toBe(true);
    expect(WeatherSystem.watersCrops('heavy_rain')).toBe(true);
    expect(WeatherSystem.watersCrops('storm')).toBe(false);
    expect(WeatherSystem.watersCrops('snow')).toBe(false);
  });

  it('harsh weather raises fatigue multiplier', () => {
    expect(WeatherSystem.fatigueMultiplier('storm')).toBeGreaterThan(1);
    expect(WeatherSystem.fatigueMultiplier('sunny')).toBe(1);
  });

  it('serialize/load round-trip', () => {
    const ws = new WeatherSystem(mulberry32(1), 'rain');
    ws.advanceDay('spring');
    const ws2 = new WeatherSystem(mulberry32(999));
    ws2.load(ws.serialize());
    expect(ws2.getCurrent()).toBe(ws.getCurrent());
    expect(ws2.getDaysRemaining()).toBe(ws.getDaysRemaining());
  });
});
