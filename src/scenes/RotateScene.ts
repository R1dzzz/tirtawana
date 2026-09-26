import Phaser from 'phaser';

export class RotateScene extends Phaser.Scene {
  private rotateIcon!: any;
  private pulseTween: any | null = null;

  constructor() { super({ key: 'RotateScene', active: false }); }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0f0a);

    const phoneBody = this.add.rectangle(0, 0, 40, 70, 0x333333).setStrokeStyle(3, 0x666666);
    const phoneScreen = this.add.rectangle(0, 0, 32, 58, 0x1a2f1a);
    this.rotateIcon = this.add.container(width / 2, height / 2 - 30, [phoneBody, phoneScreen]);

    const arrow = this.add.graphics();
    arrow.lineStyle(4, 0xf0d040, 1);
    arrow.beginPath();
    arrow.arc(0, 0, 50, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45), false);
    arrow.strokePath();
    arrow.fillStyle(0xf0d040, 1);
    arrow.fillTriangle(50, -10, 50, 10, 62, 0);
    this.rotateIcon.add(arrow);

    this.add.text(width / 2, height / 2 + 60, 'ROTATE YOUR DEVICE', {
      fontFamily: 'monospace', fontSize: '24px', color: '#f0d040', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 95, 'TIRTAWANA is designed for landscape play', {
      fontFamily: 'monospace', fontSize: '12px', color: '#a0c0a0'
    }).setOrigin(0.5);

    this.pulseTween = this.tweens.add({
      targets: this.rotateIcon, angle: 90, duration: 1500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.scale.on('resize', this.checkExit, this);
  }

  private checkExit(): void {
    if (window.innerWidth >= window.innerHeight) this.scene.stop('RotateScene');
  }

  shutdown(): void {
    this.pulseTween?.stop();
    this.scale.off('resize', this.checkExit, this);
  }
}
