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
      { label: 'Settings', action: () => console.log('Settings: coming in M20') }
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
      this.scene.start('GameScene');
      this.scene.launch('HUDScene');
    });
  }

  private continueGame(): void {
    this.scene.start('GameScene');
    this.scene.launch('HUDScene');
  }
}
