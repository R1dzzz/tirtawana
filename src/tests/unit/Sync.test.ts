import { describe, it, expect } from 'vitest';
import { SyncManager, SyncClient } from '../../save/SyncManager';
import { createDefaultSave } from '../../data/types/SaveTypes';

function makeClient(cloudUpdatedAt: number | null, failFetch = false): SyncClient & { uploads: number } {
  const client: any = {
    uploads: 0,
    async signInAnonymously() { return { userId: 'u1' }; },
    async fetchSave() {
      if (failFetch) throw new Error('network down');
      if (cloudUpdatedAt === null) return null;
      const save = createDefaultSave();
      save.updatedAt = cloudUpdatedAt;
      return { updatedAt: cloudUpdatedAt, data: save };
    },
    async uploadSave() { client.uploads++; return true; }
  };
  return client;
}

describe('SyncManager', () => {
  it('is unavailable without a client; push queues offline', async () => {
    const sm = new SyncManager();
    expect(sm.isAvailable).toBe(false);
    await sm.push(createDefaultSave());
    expect(sm.queueDepth()).toBe(1);
  });

  it('queues pushes when signed out, flushes on sign-in', async () => {
    const client = makeClient(null);
    const sm = new SyncManager(client);
    await sm.push(createDefaultSave());
    expect(sm.queueDepth()).toBe(1);
    expect(await sm.signIn()).toBe(true);
    expect(sm.queueDepth()).toBe(0);
    expect((client as any).uploads).toBe(1);
  });

  it('newer-wins conflict resolution picks the fresher save', async () => {
    const local = createDefaultSave();
    local.updatedAt = 2000;
    const sm = new SyncManager(makeClient(1000));
    await sm.signIn();
    const r = await sm.pull(local);
    expect(r!.source).toBe('local');
    expect(r!.save.updatedAt).toBe(2000);
    expect(r!.conflict).toBe(true); // both exist → surfaced for UI
  });

  it('cloud wins when newer', async () => {
    const local = createDefaultSave();
    local.updatedAt = 500;
    const sm = new SyncManager(makeClient(5000));
    await sm.signIn();
    const r = await sm.pull(local);
    expect(r!.source).toBe('cloud');
    expect(r!.save.updatedAt).toBe(5000);
  });

  it('no cloud save → local, no conflict', async () => {
    const sm = new SyncManager(makeClient(null));
    await sm.signIn();
    const r = await sm.pull(createDefaultSave());
    expect(r!.source).toBe('local');
    expect(r!.conflict).toBe(false);
  });

  it('fetch failure falls back to local without crashing', async () => {
    const sm = new SyncManager(makeClient(0, true));
    await sm.signIn();
    const r = await sm.pull(createDefaultSave());
    expect(r!.source).toBe('local');
  });

  it('force resolution overrides newer-wins', async () => {
    const local = createDefaultSave();
    local.updatedAt = 100;
    local.player.gold = 9999;
    const sm = new SyncManager(makeClient(9999));
    await sm.signIn();
    const r = await sm.pull(local, 'auto', 'local');
    expect(r!.save.player.gold).toBe(9999);
    const r2 = await sm.pull(local, 'auto', 'cloud');
    expect(r2!.save.player.gold).toBe(500); // default cloud gold
  });

  it('queue is capped (never grows unbounded offline)', async () => {
    const sm = new SyncManager();
    for (let i = 0; i < 25; i++) await sm.push(createDefaultSave());
    expect(sm.queueDepth()).toBe(10);
  });
});
