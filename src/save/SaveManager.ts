import { IndexedDBAdapter } from './IndexedDBAdapter';
import { SaveData, createDefaultSave, SAVE_VERSION } from '../data/types/SaveTypes';
import { GAME_CONFIG } from '../app/Config';
import { EventBus, Events } from '../core/EventBus';
import { Logger } from '../core/Logger';
import { SaveValidator } from './SaveValidator';

export class SaveManager {
  private adapter: IndexedDBAdapter;
  private currentSave: SaveData | null = null;
  private autosaveTimer: number = 0;
  private readonly AUTOSAVE_INTERVAL = 60000;

  constructor() {
    this.adapter = new IndexedDBAdapter(GAME_CONFIG.DB_NAME, GAME_CONFIG.DB_VERSION);
  }

  async init(): Promise<void> {
    await this.adapter.open();
    Logger.info('SaveManager initialized');
  }

  async newGame(playerName: string = 'Traveler'): Promise<SaveData> {
    const save = createDefaultSave();
    save.player.name = playerName;
    this.currentSave = save;
    await this.persist('auto');
    return save;
  }

  async load(slotId: string = 'auto'): Promise<SaveData | null> {
    try {
      const raw = await this.adapter.get<any>('saves', slotId);
      if (!raw) return null;

      // Validate structure; attempt repair on corruption
      const check = SaveValidator.validate(raw);
      let data = raw;
      if (!check.ok) {
        Logger.warn(`Save validation failed (${check.errors.join('; ')}) — attempting repair`);
        data = SaveValidator.repair(raw);
        const after = SaveValidator.validate(data);
        if (!after.ok) {
          Logger.error('Repair incomplete:', after.errors);
          // Fall back to latest backup snapshot
          const backup = await this.latestBackup();
          if (backup) {
            Logger.warn('Restoring from backup snapshot');
            data = backup;
          } else {
            return null;
          }
        }
        await this.persist(slotId); // persist repaired data back
      }

      if (data.version < SAVE_VERSION) {
        Logger.warn(`Migrating save from v${data.version} to v${SAVE_VERSION}`);
        data.version = SAVE_VERSION;
      }
      this.currentSave = data;
      Logger.info(`Save loaded from slot: ${slotId}`);
      await this.dailySnapshot(data);
      return data;
    } catch (e) {
      Logger.error('Failed to load save:', e);
      return null;
    }
  }

  /** Keep one rolling daily snapshot so a bad save never loses everything. */
  private async dailySnapshot(save: SaveData): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const existing = await this.adapter.get<any>('backups', `daily_${today}`);
      if (!existing) {
        await this.adapter.put('backups', {
          backupId: `daily_${today}`,
          createdAt: Date.now(),
          data: save
        });
      }
    } catch (e) {
      Logger.warn('Snapshot failed (non-fatal):', e);
    }
  }

  private async latestBackup(): Promise<SaveData | null> {
    try {
      const backups = await this.adapter.getAll<any>('backups');
      if (!backups.length) return null;
      backups.sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      return backups[0].data ?? null;
    } catch {
      return null;
    }
  }

  async save(slotId: string = 'auto'): Promise<void> {
    if (!this.currentSave) { Logger.warn('No active save to persist'); return; }
    await this.persist(slotId);
  }

  private async persist(slotId: string): Promise<void> {
    if (!this.currentSave) return;
    this.currentSave.updatedAt = Date.now();
    this.currentSave.revisionId = crypto.randomUUID();
    this.currentSave.syncStatus = 'local';
    try {
      await this.adapter.put('saves', { slotId, ...this.currentSave });
      EventBus.emit(Events.SAVE_COMPLETED, { slotId });
    } catch (e) {
      Logger.error('Failed to persist save:', e);
    }
  }

  getCurrentSave(): SaveData | null { return this.currentSave; }

  updateSave(mutator: (save: SaveData) => void): void {
    if (!this.currentSave) return;
    mutator(this.currentSave);
  }

  startAutosave(): void {
    this.stopAutosave();
    this.autosaveTimer = window.setInterval(() => {
      EventBus.emit(Events.SAVE_REQUESTED);
      this.save('auto');
    }, this.AUTOSAVE_INTERVAL);
  }

  stopAutosave(): void {
    if (this.autosaveTimer) { clearInterval(this.autosaveTimer); this.autosaveTimer = 0; }
  }

  async createBackup(): Promise<void> {
    if (!this.currentSave) return;
    const backupId = `backup_${Date.now()}`;
    await this.adapter.put('backups', { backupId, createdAt: Date.now(), data: this.currentSave });
    Logger.info(`Backup created: ${backupId}`);
  }

  async listBackups(): Promise<Array<{ backupId: string; createdAt: number }>> {
    const backups = await this.adapter.getAll<any>('backups');
    return backups.map((b: any) => ({ backupId: b.backupId, createdAt: b.createdAt }));
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    const backup = await this.adapter.get<any>('backups', backupId);
    if (!backup?.data) return false;
    this.currentSave = backup.data;
    await this.persist('auto');
    return true;
  }

  destroy(): void { this.stopAutosave(); this.adapter.close(); }
}
