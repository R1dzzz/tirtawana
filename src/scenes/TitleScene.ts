import Phaser from 'phaser';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { SaveManager } from '../save/SaveManager';

export class TitleScene extends Phaser.Scene {
  private selectedOption: number = 0;
  private menuItems: any[] = [];
  private hasSave: boolean = false;

  constructor() { super({ key: 'TitleScene' }); }

  async create(): Promise<void> {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2f1a);

    this.add.text(width / 2, height * 0.25, 'TIRTAWANA', {
      fontFamily: 'monospace', fontSize: '48px', color: '#f0d040',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.25 + 50, 'The Living Isles', {
      fontFamily: 'monospace', fontSize: '20px', color: '#a0c0a0'
    }).setOrigin(0.5);

    const saveManager = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    const existingSave = await saveManager.load('auto');
    this.hasSave = existingSave !== null;

    const options = [
      { label: 'New Game', action: () => this.startNewGame() },
      ...(this.hasSave ? [{ label: 'Continue', action: () => this.continueGame() }] : []),
      { label: 'Cloud Sync', action: () => this.cloudSync() }
    ];

    options.forEach((opt, i) => {
      const y = height * 0.5 + i * 50;
      const text = this.add.text(width / 2, y, opt.label, {
        fontFamily: 'monospace', fontSize: '24px',
        color: i === this.selectedOption ? '#f0d040' : '#ffffff'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      text.on('pointerover', () => this.selectOption(i));
      text.on('pointerdown', () => opt.action());
      this.menuItems.push(text);
    });

    this.input.keyboard?.on('keydown-UP', () => this.selectOption(
      (this.selectedOption - 1 + this.menuItems.length) % this.menuItems.length));
    this.input.keyboard?.on('keydown-DOWN', () => this.selectOption(
      (this.selectedOption + 1) % this.menuItems.length));
    this.input.keyboard?.on('keydown-ENTER', () => options[this.selectedOption].action());
    this.input.keyboard?.on('keydown-SPACE', () => options[this.selectedOption].action());

    this.add.text(10, height - 20, 'v0.1.0 | DYSTANCEE Studio', {
      fontFamily: 'monospace', fontSize: '10px', color: '#506050'
    });
  }

  private selectOption(index: number): void {
    this.selectedOption = index;
    this.menuItems.forEach((item, i) => item.setColor(i === index ? '#f0d040' : '#ffffff'));
  }

  private startNewGame(): void {
    const saveManager = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    saveManager.newGame('Traveler').then(() => {
      this.scene.start('LoadingScene'); // shows feedback while GameScene builds
    }).catch((e: any) => {
      (window as any).dispatchEvent(new ErrorEvent('error', { message: 'NewGame failed: ' + (e?.message || e) }));
    });
  }

  private continueGame(): void {
    try {
      this.scene.start('LoadingScene');
    } catch (e: any) {
      (window as any).dispatchEvent(new ErrorEvent('error', { message: 'Continue failed: ' + (e?.message || e) }));
    }
  }

  private async cloudSync(): Promise<void> {
    const status = this.add.text(this.scale.width / 2, this.scale.height * 0.88, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#a0c0a0'
    }).setOrigin(0.5);
    if (!ServiceLocator.has('SyncManager')) {
      status.setText('Cloud sync not configured — set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
      return;
    }
    const sync = ServiceLocator.get<any>('SyncManager');
    status.setText('Signing in to cloud...');
    const ok = await sync.signIn();
    status.setText(ok ? 'Cloud sync ON ✓ (anonymous)' : 'Sign-in failed — offline play unaffected');
    this.time.delayedCall(4000, () => status.destroy());
  }
}
