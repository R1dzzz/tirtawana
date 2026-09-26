import Phaser from 'phaser';

/**
 * Generates simple placeholder pixel-art textures at runtime.
 * All original, no external assets needed.
 */
export class PixelArtGenerator {
  private scene: any;
  private generated: Set<string> = new Set();

  constructor(scene: any) { this.scene = scene; }

  generateAll(): void {
    this.generatePlayer();
    this.generateTiles();
    this.generateUI();
    this.generateTrees();
    this.generateHouse();
  }

  private makeTexture(key: string, width: number, height: number, draw: (g: any) => void): void {
    if (this.generated.has(key) || this.scene.textures.exists(key)) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, width, height);
    g.destroy();
    this.generated.add(key);
  }

  private generatePlayer(): void {
    const directions = ['down', 'left', 'right', 'up'];
    const colors = { body: '#4a90d9', skin: '#f0c8a0', hair: '#5a3a2a', pants: '#3a5a2a' };
    directions.forEach((dir) => {
      for (let frame = 0; frame < 2; frame++) {
        this.makeTexture(`player_${dir}_${frame}`, 16, 24, (g) => {
          g.fillStyle(colors.hair, 1); g.fillRect(3, 0, 10, 4);
          g.fillStyle(colors.skin, 1); g.fillRect(3, 4, 10, 6);
          if (dir !== 'up') {
            g.fillStyle(0x000000, 1);
            if (dir === 'down') { g.fillRect(5, 6, 2, 2); g.fillRect(9, 6, 2, 2); }
            else if (dir === 'left') { g.fillRect(4, 6, 2, 2); }
            else { g.fillRect(10, 6, 2, 2); }
          }
          g.fillStyle(colors.body, 1); g.fillRect(3, 10, 10, 8);
          g.fillStyle(colors.skin, 1);
          const armOffset = frame === 0 ? 0 : (dir === 'left' ? -1 : dir === 'right' ? 1 : 0);
          g.fillRect(1 + armOffset, 10, 2, 6);
          g.fillRect(13 - armOffset, 10, 2, 6);
          g.fillStyle(colors.pants, 1);
          const legOffset = frame === 0 ? 0 : 1;
          g.fillRect(4, 18, 3, 6);
          g.fillRect(9, 18, 3, 6);
          if (frame === 1) {
            g.fillRect(4 + legOffset, 22, 3, 2);
            g.fillRect(9 - legOffset, 22, 3, 2);
          }
        });
      }
    });
  }

  private generateTiles(): void {
    this.makeTexture('tile_grass', 16, 16, (g) => {
      g.fillStyle(0x3d6b2f, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x4a7c3a, 1);
      for (let i = 0; i < 8; i++) g.fillRect((i * 5 + 3) % 16, (i * 7 + 2) % 16, 1, 2);
    });
    this.makeTexture('tile_water', 16, 16, (g) => {
      g.fillStyle(0x2a5a8a, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x3a7aba, 1); g.fillRect(0, 4, 16, 1); g.fillRect(0, 10, 16, 1);
      g.fillStyle(0x4a9aca, 1); g.fillRect(2, 5, 4, 1); g.fillRect(8, 11, 4, 1);
    });
    this.makeTexture('tile_path', 16, 16, (g) => {
      g.fillStyle(0x8a7a5a, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x9a8a6a, 1);
      g.fillRect(2, 3, 3, 2); g.fillRect(9, 7, 4, 2); g.fillRect(4, 11, 3, 2);
    });
    this.makeTexture('tile_flower', 16, 16, (g) => {
      g.fillStyle(0x3d6b2f, 1); g.fillRect(0, 0, 16, 16);
      g.fillStyle(0xe85a7a, 1); g.fillRect(4, 4, 2, 2); g.fillRect(10, 8, 2, 2);
      g.fillStyle(0xf0d040, 1); g.fillRect(7, 6, 2, 2);
      g.fillStyle(0xffffff, 1); g.fillRect(12, 3, 2, 2);
    });
  }

  private generateTrees(): void {
    this.makeTexture('tree_oak', 24, 32, (g) => {
      g.fillStyle(0x5a3a2a, 1); g.fillRect(10, 20, 4, 12);
      g.fillStyle(0x2a5a1a, 1); g.fillRect(4, 4, 16, 16); g.fillRect(2, 8, 20, 10);
      g.fillStyle(0x3a7a2a, 1); g.fillRect(6, 6, 8, 6); g.fillRect(12, 12, 6, 4);
    });
  }

  private generateHouse(): void {
    // Farmhouse: 48x40, includes door at bottom-center
    this.makeTexture('house_farm', 48, 40, (g) => {
      // Walls
      g.fillStyle(0xc8b090, 1); g.fillRect(4, 14, 40, 26);
      // Roof
      g.fillStyle(0x8a4a3a, 1);
      g.fillRect(0, 8, 48, 8); g.fillRect(4, 4, 40, 6); g.fillRect(10, 0, 28, 6);
      // Door
      g.fillStyle(0x5a3a2a, 1); g.fillRect(20, 26, 8, 14);
      // Windows
      g.fillStyle(0x8ac8e8, 1); g.fillRect(8, 20, 6, 6); g.fillRect(34, 20, 6, 6);
      g.fillStyle(0xffffff, 1); g.fillRect(10, 22, 2, 2); g.fillRect(36, 22, 2, 2);
    });
  }

  private generateUI(): void {
    this.makeTexture('joystick_base', 96, 96, (g) => {
      g.fillStyle(0xffffff, 0.15); g.fillCircle(48, 48, 48);
      g.fillStyle(0xffffff, 0.1); g.fillCircle(48, 48, 40);
    });
    this.makeTexture('joystick_knob', 48, 48, (g) => {
      g.fillStyle(0xffffff, 0.4); g.fillCircle(24, 24, 24);
      g.fillStyle(0xffffff, 0.6); g.fillCircle(24, 24, 18);
    });
    this.makeTexture('btn_action', 64, 64, (g) => {
      g.fillStyle(0x4a90d9, 0.8); g.fillCircle(32, 32, 32);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(32, 32, 26);
      g.fillStyle(0x4a90d9, 1); g.fillCircle(32, 32, 22);
    });
    this.makeTexture('btn_attack', 64, 64, (g) => {
      g.fillStyle(0xd94a4a, 0.8); g.fillCircle(32, 32, 32);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(32, 32, 26);
      g.fillStyle(0xd94a4a, 1); g.fillCircle(32, 32, 22);
    });
    this.makeTexture('btn_dodge', 64, 64, (g) => {
      g.fillStyle(0x4ad94a, 0.8); g.fillCircle(32, 32, 32);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(32, 32, 26);
      g.fillStyle(0x4ad94a, 1); g.fillCircle(32, 32, 22);
    });
  }
}
