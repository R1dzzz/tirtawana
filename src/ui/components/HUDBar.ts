import Phaser from 'phaser';

export type BarColor = 'red' | 'green' | 'orange' | 'blue' | 'purple';

export class HUDBar {
  private scene: any;
  private bg: any;
  private fill: any;
  private label: any;
  private maxWidth: number;
  private baseColor: number;
  private readonly HEIGHT = 10;

  constructor(scene: any, x: number, y: number, width: number, label: string, color: BarColor) {
    this.scene = scene;
    this.maxWidth = width;
    const colors: Record<BarColor, number> = {
      red: 0xd94a4a, green: 0x4ad94a, orange: 0xd9a04a, blue: 0x4a90d9, purple: 0x9a4ad9
    };
    this.baseColor = colors[color];

    this.bg = scene.add.rectangle(x, y, width, this.HEIGHT, 0x000000, 0.5)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(1000)
      .setStrokeStyle(1, 0xffffff, 0.3);
    this.fill = scene.add.rectangle(x, y, width, this.HEIGHT - 2, this.baseColor, 0.9)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
    this.label = scene.add.text(x + 2, y - 14, label, {
      fontFamily: 'monospace', fontSize: '9px', color: '#ffffff'
    }).setScrollFactor(0).setDepth(1001);
  }

  setValue(current: number, max: number): void {
    const pct = Phaser.Math.Clamp(current / max, 0, 1);
    this.fill.width = this.maxWidth * pct;
    this.fill.setFillStyle(pct < 0.25 ? 0xd94a4a : this.baseColor);
  }

  setPosition(x: number, y: number): void {
    this.bg.setPosition(x, y);
    this.fill.setPosition(x, y);
    this.label.setPosition(x + 2, y - 14);
  }

  destroy(): void { this.bg.destroy(); this.fill.destroy(); this.label.destroy(); }
}
