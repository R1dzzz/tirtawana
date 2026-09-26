import { describe, it, expect } from 'vitest';
import { createDefaultSave, SAVE_VERSION } from '../../data/types/SaveTypes';

describe('SaveSerialization', () => {
  it('creates valid default save', () => {
    const save = createDefaultSave();
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.player.health).toBe(100);
    expect(save.world.day).toBe(1);
    expect(save.world.timeMinutes).toBe(360);
    expect(save.world.resonance.village).toBe(50);
  });

  it('serializes and deserializes without data loss', () => {
    const save = createDefaultSave();
    save.player.gold = 999;
    save.world.playerPosition = { x: 123, y: 456 };
    const restored = JSON.parse(JSON.stringify(save));
    expect(restored.player.gold).toBe(999);
    expect(restored.world.playerPosition.x).toBe(123);
    expect(restored.revisionId).toBe(save.revisionId);
  });

  it('has unique revision IDs', () => {
    expect(createDefaultSave().revisionId).not.toBe(createDefaultSave().revisionId);
  });
});
