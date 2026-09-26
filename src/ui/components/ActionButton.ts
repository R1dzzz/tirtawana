import Phaser from 'phaser';

export class ActionButton {
  private scene: any;
  public button: any;
  private label: any;

  onPress: (() => void) | null = null;

  constructor(scene: any, x: number, y: number, texture: string, label: string) {
    this.scene = scene;
    this.button = scene.add.image(x, y, texture)
      .setScrollFactor(0).setDepth(1000)
      .setInteractive({ useHandCursor: true }).setAlpha(0.85);
    this.label = scene.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    this.button.on('pointerdown', () => {
      this.button.setAlpha(1); this.button.setScale(0.92);
      this.onPress?.();
    });
    this.button.on('pointerup', () => { this.button.setAlpha(0.85); this.button.setScale(1); });
    this.button.on('pointerout', () => { this.button.setAlpha(0.85); this.button.setScale(1); });
  }

  setLabel(text: string): void { this.label.setText(text); }

  setPosition(x: number, y: number): void {
    this.button.setPosition(x, y);
    this.label.setPosition(x, y);
  }

  destroy(): void { this.button.destroy(); this.label.destroy(); }
}
