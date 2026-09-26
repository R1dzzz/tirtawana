import Phaser from 'phaser';

export class VirtualJoystick {
  private scene: any;
  private base: any;
  private knob: any;
  private zone: any;
  private pointerId: number | null = null;
  private origin: any = new Phaser.Math.Vector2();
  private vector: any = new Phaser.Math.Vector2();
  private readonly RADIUS = 48;
  private readonly DEADZONE = 0.12;

  onChange: ((v: any) => void) | null = null;

  constructor(scene: any) {
    this.scene = scene;
    const cam = scene.cameras.main;

    this.base = scene.add.image(100, cam.height - 100, 'joystick_base')
      .setScrollFactor(0).setDepth(1000).setAlpha(0.6).setVisible(false);
    this.knob = scene.add.image(100, cam.height - 100, 'joystick_knob')
      .setScrollFactor(0).setDepth(1001).setAlpha(0.8).setVisible(false);

    this.zone = scene.add.zone(0, 0, cam.width * 0.5, cam.height)
      .setOrigin(0, 0).setScrollFactor(0)
      .setInteractive({ useHandCursor: false });

    this.zone.on('pointerdown', this.onPointerDown, this);
    this.zone.on('pointermove', this.onPointerMove, this);
    this.zone.on('pointerup', this.onPointerUp, this);
    this.zone.on('pointerupoutside', this.onPointerUp, this);
    scene.scale.on('resize', this.onResize, this);
  }

  private onResize(): void {
    const cam = this.scene.cameras.main;
    this.zone.setSize(cam.width * 0.5, cam.height);
  }

  private onPointerDown(pointer: any): void {
    if (this.pointerId !== null) return;
    this.pointerId = pointer.id;
    this.origin.set(pointer.x, pointer.y);
    this.base.setPosition(pointer.x, pointer.y).setVisible(true);
    this.knob.setPosition(pointer.x, pointer.y).setVisible(true);
  }

  private onPointerMove(pointer: any): void {
    if (pointer.id !== this.pointerId) return;
    const dx = pointer.x - this.origin.x;
    const dy = pointer.y - this.origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, this.RADIUS);
    const angle = Math.atan2(dy, dx);
    this.knob.setPosition(
      this.origin.x + Math.cos(angle) * clampedDist,
      this.origin.y + Math.sin(angle) * clampedDist
    );
    this.vector.set(
      Math.cos(angle) * (clampedDist / this.RADIUS),
      Math.sin(angle) * (clampedDist / this.RADIUS)
    );
    if (this.vector.length() < this.DEADZONE) this.vector.set(0, 0);
    this.onChange?.(this.vector);
  }

  private onPointerUp(pointer: any): void {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.vector.set(0, 0);
    this.base.setVisible(false);
    this.knob.setVisible(false);
    this.onChange?.(this.vector);
  }

  getVector(): any { return this.vector; }

  destroy(): void {
    this.scene.scale.off('resize', this.onResize, this);
    this.base.destroy();
    this.knob.destroy();
    this.zone.destroy();
  }
}
