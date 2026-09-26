import Phaser from 'phaser';
import { GAME_CONFIG } from '../app/Config';
import { EventBus, Events } from '../core/EventBus';

export type Direction = 'down' | 'left' | 'right' | 'up';

export class Player {
  public sprite: any;
  private cursors: any | null = null;
  private wasd: any = null;
  private currentDirection: Direction = 'down';
  private isMoving: boolean = false;
  private animFrame: number = 0;
  private animTimer: number = 0;
  private readonly ANIM_SPEED = 150;

  private joystickVector: any = new Phaser.Math.Vector2(0, 0);
  private touchTarget: any | null = null;

  /** Movement efficiency multiplier from fatigue/needs (NeedsSystem, M3). */
  moveEfficiency: number = 1;

  constructor(scene: any, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'player_down_0');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(12, 8);
    this.sprite.setOffset(2, 16);

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = scene.input.keyboard.addKeys('W,S,A,D');
    }
  }

  setJoystickVector(v: any): void { this.joystickVector = v; }
  setTouchTarget(target: any | null): void { this.touchTarget = target; }

  update(delta: number): void {
    const vx0 = 0;
    let vx = vx0, vy = 0;

    if (this.cursors) {
      if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;
    }

    if (this.joystickVector.length() > 0.1) {
      vx = this.joystickVector.x;
      vy = this.joystickVector.y;
    }

    if (this.touchTarget && vx === 0 && vy === 0) {
      const dx = this.touchTarget.x - this.sprite.x;
      const dy = this.touchTarget.y - this.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 8) { vx = dx / dist; vy = dy / dist; }
      else { this.touchTarget = null; }
    }

    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0) { vx /= len; vy /= len; this.isMoving = true; }
    else { this.isMoving = false; }

    const speed = GAME_CONFIG.PLAYER_SPEED * this.moveEfficiency;
    this.sprite.setVelocity(vx * speed, vy * speed);

    if (Math.abs(vx) > Math.abs(vy)) this.currentDirection = vx > 0 ? 'right' : 'left';
    else if (vy !== 0) this.currentDirection = vy > 0 ? 'down' : 'up';

    this.updateAnimation(delta);

    if (this.isMoving) {
      EventBus.emit(Events.PLAYER_MOVED, {
        x: this.sprite.x, y: this.sprite.y, direction: this.currentDirection
      });
    }
  }

  private updateAnimation(delta: number): void {
    if (this.isMoving) {
      this.animTimer += delta;
      if (this.animTimer >= this.ANIM_SPEED) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 2; }
    } else { this.animFrame = 0; this.animTimer = 0; }

    const textureKey = `player_${this.currentDirection}_${this.animFrame}`;
    if (this.sprite.texture.key !== textureKey) this.sprite.setTexture(textureKey);
  }

  getDirection(): Direction { return this.currentDirection; }
  getPosition(): { x: number; y: number } { return { x: this.sprite.x, y: this.sprite.y }; }
  setPosition(x: number, y: number): void { this.sprite.setPosition(x, y); }
  isPlayerMoving(): boolean { return this.isMoving; }
  destroy(): void { this.sprite.destroy(); }
}
