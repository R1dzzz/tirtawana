import Phaser from 'phaser';
import { PixelArtGenerator } from '../utils/PixelArtGenerator';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { SaveManager } from '../save/SaveManager';
import { Logger } from '../core/Logger';
import { SyncManager, createSupabaseClient } from '../save/SyncManager';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  async create(): Promise<void> {
    Logger.info('BootScene: Initializing...');
    new PixelArtGenerator(this).generateAll();

    const saveManager = new SaveManager();
    try {
      await saveManager.init();
      ServiceLocator.register(SERVICE_KEYS.SAVE_MANAGER, saveManager);
    } catch (e) {
      Logger.error('Failed to init SaveManager:', e);
    }

    // Optional cloud sync — game is fully playable without it
    const syncClient = createSupabaseClient();
    if (syncClient) {
      const syncManager = new SyncManager(syncClient);
      ServiceLocator.register('SyncManager', syncManager);
      syncManager.signIn(); // fire-and-forget; failures are non-fatal
    } else {
      Logger.info('Supabase not configured — running offline-only mode');
    }

    this.showStudioIntro();
  }

  private showStudioIntro(): void {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setAlpha(0);
    const logo = this.add.text(width / 2, height / 2, 'DYSTANCEE', {
      fontFamily: 'monospace', fontSize: '32px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);
    const studio = this.add.text(width / 2, height / 2 + 40, 'STUDIO', {
      fontFamily: 'monospace', fontSize: '14px', color: '#888888'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [bg, logo, studio],
      alpha: { value: 1, duration: 1000 },
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          this.tweens.add({
            targets: [logo, studio], alpha: 0, duration: 800,
            onComplete: () => {
              this.tweens.add({
                targets: bg, alpha: 0, duration: 500,
                onComplete: () => this.scene.start('TitleScene')
              });
            }
          });
        });
      }
    });

    this.input.once('pointerdown', () => this.scene.start('TitleScene'));
  }
}
