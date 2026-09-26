import Phaser from 'phaser';
import { Plot } from '../systems/FarmingSystem';
import { CROPS } from '../data/items/crops';

/**
 * Renders farm plots (tilled soil, crops per stage) as pixel-art images.
 * Textures are generated at runtime — no external assets.
 */
export class PlotRenderer {
  private scene: any;
  private containers = new Map<string, any>();

  constructor(scene: any) {
    this.scene = scene;
    this.ensureSoilTextures();
  }

  private makeTex(key: string, width: number, height: number, draw: (g: any) => void): void {
    if (this.scene.textures.exists(key)) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private ensureSoilTextures(): void {
    this.makeTex('plot_soil', 16, 16, (g) => {
      g.fillStyle(0x6b4a2a, 1);
      g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x5a3d22, 1);
      g.fillRect(0, 3, 16, 2);
      g.fillRect(0, 8, 16, 2);
      g.fillRect(0, 13, 16, 2);
      g.fillStyle(0x7d5a36, 1);
      g.fillRect(2, 0, 1, 16);
      g.fillRect(13, 0, 1, 16);
    });

    this.makeTex('plot_soil_wet', 16, 16, (g) => {
      g.fillStyle(0x4a3220, 1);
      g.fillRect(0, 0, 16, 16);
      g.fillStyle(0x3d2a1a, 1);
      g.fillRect(0, 3, 16, 2);
      g.fillRect(0, 8, 16, 2);
      g.fillRect(0, 13, 16, 2);
      g.fillStyle(0x5a4030, 1);
      g.fillRect(2, 0, 1, 16);
      g.fillRect(13, 0, 1, 16);
    });
  }

  private ensureCropTexture(cropId: string, stage: number): void {
    const key = `crop_${cropId}_${stage}`;
    if (this.scene.textures.exists(key)) return;

    const crop = CROPS[cropId];
    if (!crop) return;
    const color = crop.color;

    this.makeTex(key, 16, 16, (g) => {
      // Stem
      g.fillStyle(0x3a7a2a, 1);
      if (stage === 0) {
        // Sprout
        g.fillRect(7, 12, 2, 3);
        g.fillRect(5, 11, 2, 2);
        g.fillRect(9, 11, 2, 2);
      } else if (stage === 1) {
        g.fillRect(7, 8, 2, 7);
        g.fillRect(4, 7, 3, 2);
        g.fillRect(9, 6, 3, 2);
        g.fillStyle(color, 0.5);
        g.fillCircle(8, 7, 2);
      } else if (stage === 2) {
        g.fillRect(7, 5, 2, 10);
        g.fillRect(3, 5, 4, 2);
        g.fillRect(9, 4, 4, 2);
        g.fillStyle(color, 0.7);
        g.fillCircle(8, 5, 3);
      } else {
        // Mature: full plant with fruit
        g.fillRect(7, 3, 2, 12);
        g.fillRect(2, 4, 5, 2);
        g.fillRect(9, 3, 5, 2);
        g.fillStyle(color, 1);
        g.fillCircle(8, 4, 4);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(7, 3, 1);
      }
    });
  }

  renderPlot(plot: Plot): void {
    const key = `${plot.x},${plot.y}`;
    // Remove old container
    const old = this.containers.get(key);
    if (old) {
      old.destroy(true);
      this.containers.delete(key);
    }

    const wx = plot.x * 16;
    const wy = plot.y * 16;

    const container = this.scene.add.container(wx, wy);
    container.setDepth(1);

    const soilKey = plot.watered ? 'plot_soil_wet' : 'plot_soil';
    container.add(this.scene.add.image(8, 8, soilKey));

    if (plot.cropId) {
      this.ensureCropTexture(plot.cropId, plot.stage);
      container.add(this.scene.add.image(8, 8, `crop_${plot.cropId}_${plot.stage}`));
    }

    this.containers.set(key, container);
  }

  removePlot(x: number, y: number): void {
    const key = `${x},${y}`;
    const c = this.containers.get(key);
    if (c) {
      c.destroy(true);
      this.containers.delete(key);
    }
  }

  refreshAll(plots: Plot[]): void {
    // Remove containers for plots that no longer exist
    const activeKeys = new Set(plots.map(p => `${p.x},${p.y}`));
    for (const key of Array.from(this.containers.keys())) {
      if (!activeKeys.has(key)) {
        this.containers.get(key)?.destroy(true);
        this.containers.delete(key);
      }
    }
    for (const plot of plots) {
      this.renderPlot(plot);
    }
  }

  clear(): void {
    for (const c of this.containers.values()) {
      c.destroy(true);
    }
    this.containers.clear();
  }
}
