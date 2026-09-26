import { SaveData } from '../data/types/SaveTypes';
import { Logger } from '../core/Logger';

/**
 * Optional Supabase cloud sync. The game is fully playable without it;
 * this module only activates when env credentials are present.
 */
export interface SyncClient {
  signInAnonymously(): Promise<{ userId: string } | null>;
  fetchSave(userId: string, slotId: string): Promise<{ updatedAt: number; data: SaveData } | null>;
  uploadSave(userId: string, slotId: string, save: SaveData): Promise<boolean>;
}

export type ConflictResolution = 'local' | 'cloud' | 'newer';

export class SyncManager {
  private client: SyncClient | null = null;
  private userId: string | null = null;
  private queue: SaveData[] = [];

  constructor(client?: SyncClient) {
    this.client = client ?? null;
  }

  get isAvailable(): boolean { return this.client !== null; }
  get isSignedIn(): boolean { return this.userId !== null; }

  async signIn(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const res = await this.client.signInAnonymously();
      if (!res) return false;
      this.userId = res.userId;
      Logger.info('Cloud sync signed in');
      await this.flushQueue();
      return true;
    } catch (e) {
      Logger.warn('Cloud sign-in failed (offline?):', e);
      return false;
    }
  }

  /** Enqueue a save for upload; uploads immediately if online, else queues. */
  async push(save: SaveData, slotId = 'auto'): Promise<void> {
    if (!this.client || !this.userId) {
      this.queue.push({ ...save });
      if (this.queue.length > 10) this.queue.shift();
      return;
    }
    try {
      await this.client.uploadSave(this.userId, slotId, save);
    } catch (e) {
      Logger.warn('Upload failed, queued for later:', e);
      this.queue.push({ ...save });
    }
  }

  private async flushQueue(): Promise<void> {
    if (!this.client || !this.userId) return;
    while (this.queue.length) {
      const save = this.queue.shift()!;
      try {
        await this.client.uploadSave(this.userId, 'auto', save);
      } catch (e) {
        Logger.warn('Queued upload failed:', e);
        this.queue.unshift(save);
        return;
      }
    }
  }

  /**
   * Resolve local vs cloud conflict. Default: newer `updatedAt` wins,
   * but the caller may force 'local' or 'cloud'. Never silently overwrites:
   * the resolution is returned for the UI to confirm.
   */
  async pull(local: SaveData, slotId = 'auto', force?: ConflictResolution)
    : Promise<{ save: SaveData; source: 'local' | 'cloud'; conflict: boolean } | null> {
    if (!this.client || !this.userId) return { save: local, source: 'local', conflict: false };
    let cloud: { updatedAt: number; data: SaveData } | null = null;
    try {
      cloud = await this.client.fetchSave(this.userId, slotId);
    } catch (e) {
      Logger.warn('Cloud fetch failed, using local:', e);
      return { save: local, source: 'local', conflict: false };
    }
    if (!cloud) return { save: local, source: 'local', conflict: false };

    const localNewer = local.updatedAt > cloud.updatedAt;
    if (force === 'local') return { save: local, source: 'local', conflict: true };
    if (force === 'cloud') return { save: cloud.data, source: 'cloud', conflict: true };
    // 'newer' default
    return localNewer
      ? { save: local, source: 'local', conflict: true }
      : { save: cloud.data, source: 'cloud', conflict: true };
  }

  queueDepth(): number { return this.queue.length; }
}

/** Real Supabase client adapter (created only when env vars exist). */
function envVar(name: string): string | undefined {
  try {
    return (globalThis as any).process?.env?.[name]
      ?? (new Function(`return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.${name}) || undefined`))();
  } catch { return undefined; }
}

export function createSupabaseClient(): SyncClient | null {
  const url = envVar('VITE_SUPABASE_URL');
  const key = envVar('VITE_SUPABASE_ANON_KEY');
  if (!url || !key) return null;
  // Lazy import so the bundle works without supabase installed/configured
  return {
    async signInAnonymously() {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(url, key);
      const { data, error } = await sb.auth.signInAnonymously();
      if (error || !data.user) return null;
      return { userId: data.user.id };
    },
    async fetchSave(userId, slotId) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(url, key);
      const { data, error } = await sb
        .from('saves')
        .select('updated_at, data')
        .eq('user_id', userId)
        .eq('slot_id', slotId)
        .maybeSingle();
      if (error || !data) return null;
      return { updatedAt: new Date(data.updated_at).getTime(), data: data.data as SaveData };
    },
    async uploadSave(userId, slotId, save) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(url, key);
      const { error } = await sb.from('saves').upsert({
        user_id: userId,
        slot_id: slotId,
        revision_id: save.revisionId,
        updated_at: new Date(save.updatedAt).toISOString(),
        data: save
      }, { onConflict: 'user_id,slot_id' });
      return !error;
    }
  };
}
