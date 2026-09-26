import Phaser from 'phaser';

/**
 * Lightweight loading screen shown before the heavy GameScene setup.
 * GameScene.create() is synchronous and can block several seconds on
 * low-end phones; this scene renders first so the player gets feedback.
 */
export class LoadingScene extends Phaser.Scene {
  constructor() { super({ key: 'LoadingScene', active: false }); }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a140a);

    this.add.text(width / 2, height / 2 - 30, 'TIRTAWANA', {
      fontFamily: 'monospace', fontSize: '28px', color: '#f0d040', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 12, 'Growing the island...', {
      fontFamily: 'monospace', fontSize: '13px', color: '#a0c0a0'
    }).setOrigin(0.5);

    const dots = this.add.text(width / 2, height / 2 + 40, '.', {
      fontFamily: 'monospace', fontSize: '16px', color: '#f0d040'
    }).setOrigin(0.5);
    let n = 1;
    this.time.addEvent({
      delay: 300, loop: true,
      callback: () => { n = (n % 3) + 1; dots.setText('.'.repeat(n)); }
    });

    // Let this scene render at least one frame, then hand off to GameScene
    this.time.delayedCall(120, () => {
      this.scene.start('GameScene');
      this.scene.launch('HUDScene');
    });
  }
}
