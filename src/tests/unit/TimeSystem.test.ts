import { describe, it, expect } from 'vitest';
import { TimeSystem, SEASON_ORDER } from '../../systems/TimeSystem';
import { GAME_CONFIG } from '../../app/Config';

const MS_PER_MIN = (GAME_CONFIG.DAY_LENGTH_MINUTES * 60 * 1000) / 1440;

describe('TimeSystem', () => {
  it('converts real time to game minutes (10 min real = 1 game day)', () => {
    const ts = new TimeSystem(10, 1, 360);
    for (let i = 0; i < 60; i++) ts.update(MS_PER_MIN);
    expect(ts.getTimeMinutes()).toBe(420);
  });

  it('rolls over at midnight and fires onDayRollover', () => {
    const ts = new TimeSystem(10, 1, 23 * 60);
    let rolled = 0;
    ts.onDayRollover = () => rolled++;
    ts.debugAddMinutes(120);
    expect(ts.getDay()).toBe(2);
    expect(ts.getHour()).toBe(1);
    expect(rolled).toBe(1);
  });

  it('fires exhaustion threshold after 20 awake hours, once', () => {
    const ts = new TimeSystem(10, 1, 360);
    let fired = 0;
    ts.onExhaustionThreshold = () => fired++;
    ts.debugAddMinutes(1199);
    expect(fired).toBe(0);
    ts.debugAddMinutes(1);
    expect(fired).toBe(1);
    ts.debugAddMinutes(200);
    expect(fired).toBe(1);
  });

  it('sleepUntilMorning advances to next 06:00 and resets exhaustion', () => {
    const ts = new TimeSystem(10, 1, 20 * 60);
    let rolled = 0;
    ts.onDayRollover = () => rolled++;
    ts.sleepUntilMorning();
    expect(ts.getDay()).toBe(2);
    expect(ts.getTimeMinutes()).toBe(360);
    expect(rolled).toBe(1);

    let fired = 0;
    ts.onExhaustionThreshold = () => fired++;
    ts.debugAddMinutes(1200);
    expect(fired).toBe(1);
  });

  it('sleeping after midnight does not skip a day', () => {
    const ts = new TimeSystem(10, 1, 23 * 60);
    ts.debugAddMinutes(180);
    expect(ts.getDay()).toBe(2);
    ts.sleepUntilMorning();
    expect(ts.getDay()).toBe(2);
    expect(ts.getTimeMinutes()).toBe(360);
  });

  it('cycles seasons every 28 days', () => {
    expect(new TimeSystem(10, 1).getSeason()).toBe('spring');
    expect(new TimeSystem(10, 29).getSeason()).toBe('summer');
    expect(new TimeSystem(10, 57).getSeason()).toBe('autumn');
    expect(new TimeSystem(10, 85).getSeason()).toBe('winter');
    expect(new TimeSystem(10, 113).getSeason()).toBe('spring');
    expect(SEASON_ORDER.length).toBe(4);
  });

  it('classifies day phases per spec', () => {
    expect(new TimeSystem(10, 1, 7 * 60).getPhase()).toBe('morning');
    expect(new TimeSystem(10, 1, 11 * 60).getPhase()).toBe('late_morning');
    expect(new TimeSystem(10, 1, 15 * 60).getPhase()).toBe('afternoon');
    expect(new TimeSystem(10, 1, 19 * 60).getPhase()).toBe('evening');
    expect(new TimeSystem(10, 1, 23 * 60).getPhase()).toBe('night');
    expect(new TimeSystem(10, 1, 2 * 60).getPhase()).toBe('deep_night');
  });
});
