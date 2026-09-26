import { describe, it, expect } from 'vitest';
import { SaveValidator } from '../../save/SaveValidator';
import { createDefaultSave, SAVE_VERSION } from '../../data/types/SaveTypes';

describe('SaveValidator', () => {
  it('accepts a fresh default save', () => {
    const r = SaveValidator.validate(createDefaultSave());
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejects non-objects and missing core fields', () => {
    expect(SaveValidator.validate(null).ok).toBe(false);
    expect(SaveValidator.validate('string').ok).toBe(false);
    const bad = SaveValidator.validate({ version: 1 });
    expect(bad.ok).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(0);
  });

  it('repairs a corrupted save into a playable shape', () => {
    const broken = { version: 1, player: { gold: 123 } };
    const repaired = SaveValidator.repair(broken);
    expect(SaveValidator.validate(repaired).ok).toBe(true);
    expect(repaired.player.gold).toBe(123);        // preserved
    expect(repaired.world.day).toBe(1);            // defaulted
    expect(Array.isArray(repaired.inventory)).toBe(true);
    expect(Array.isArray(repaired.farm.plots)).toBe(true);
    expect(repaired.version).toBe(SAVE_VERSION);
    expect(repaired.player.health).toBeGreaterThan(0);
  });

  it('repair keeps valid nested data intact', () => {
    const good = createDefaultSave();
    good.world.resonance.forest = 77;
    good.journal.notes.push('poi:test');
    const repaired = SaveValidator.repair(JSON.parse(JSON.stringify(good)));
    expect(repaired.world.resonance.forest).toBe(77);
    expect(repaired.journal.notes).toContain('poi:test');
  });

  it('deeply broken input still yields valid structure after repair', () => {
    const garbage = { version: 'x', world: null, player: null, inventory: 'nope' };
    const repaired = SaveValidator.repair(garbage);
    expect(SaveValidator.validate(repaired).ok).toBe(true);
  });
});
