import Phaser from 'phaser';
import { GAME_CONFIG } from '../app/Config';
import { REGIONS, RegionData } from '../data/locations/regions';

export class TilemapManager {
  private scene: any;
  private currentRegion: RegionData | null = null;
  private tilemap: any | null = null;
  private groundLayer: any | null = null;
  private collisionLayer: any | null = null;

  constructor(scene: any) { this.scene = scene; }

  loadRegion(regionId: string): void {
    const region = REGIONS[regionId];
    if (!region) throw new Error(`Unknown region: ${regionId}`);

    this.unloadCurrent();
    this.currentRegion = region;

    this.tilemap = this.scene.make.tilemap({
      tileWidth: GAME_CONFIG.TILE_SIZE,
      tileHeight: GAME_CONFIG.TILE_SIZE,
      width: region.mapWidth,
      height: region.mapHeight
    });

    const grass = this.tilemap.addTilesetImage('tile_grass');
    const water = this.tilemap.addTilesetImage('tile_water');
    const path = this.tilemap.addTilesetImage('tile_path');
    const flower = this.tilemap.addTilesetImage('tile_flower');
    if (!grass || !water || !path || !flower) throw new Error('Tilesets not found');

    this.groundLayer = this.tilemap.createBlankLayer(
      'ground', [grass, water, path, flower],
      0, 0, region.mapWidth, region.mapHeight,
      GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE
    );
    this.collisionLayer = this.tilemap.createBlankLayer(
      'collision', [grass, water],
      0, 0, region.mapWidth, region.mapHeight,
      GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE
    );
    this.collisionLayer?.setVisible(false);

    this.populateRegion(region);
  }

  private populateRegion(region: RegionData): void {
    if (!this.groundLayer || !this.collisionLayer || !this.tilemap) return;
    const W = region.mapWidth, H = region.mapHeight;
    const midY = Math.floor(H / 2), midX = Math.floor(W / 2);

    // Base: whole map grass — one block fill instead of W*H putTileAt calls
    this.tilemap.fill(0, 0, 0, W, H, this.groundLayer);
    // Path cross (two block fills)
    this.tilemap.fill(2, 0, midY, W, 1, this.groundLayer);
    this.tilemap.fill(2, midX, 0, 1, H, this.groundLayer);
    // Water border (4 block fills on ground + collision)
    this.tilemap.fill(1, 0, 0, W, 1, this.groundLayer);
    this.tilemap.fill(1, 0, H - 1, W, 1, this.groundLayer);
    this.tilemap.fill(1, 0, 0, 1, H, this.groundLayer);
    this.tilemap.fill(1, W - 1, 0, 1, H, this.groundLayer);
    this.tilemap.fill(1, 0, 0, W, 1, this.collisionLayer);
    this.tilemap.fill(1, 0, H - 1, W, 1, this.collisionLayer);
    this.tilemap.fill(1, 0, 0, 1, H, this.collisionLayer);
    this.tilemap.fill(1, W - 1, 0, 1, H, this.collisionLayer);

    // Sparse flowers (~5%, only a few hundred putTileAt)
    const flowers = Math.floor(W * H * 0.05);
    for (let i = 0; i < flowers; i++) {
      const x = 1 + Math.floor(Math.random() * (W - 2));
      const y = 1 + Math.floor(Math.random() * (H - 2));
      if (y === midY || x === midX) continue;
      this.groundLayer.putTileAt(3, x, y);
    }
  }

  getGroundLayer(): any | null { return this.groundLayer; }
  getCollisionLayer(): any | null { return this.collisionLayer; }
  getTilemap(): any | null { return this.tilemap; }
  getCurrentRegion(): RegionData | null { return this.currentRegion; }

  unloadCurrent(): void {
    this.groundLayer?.destroy();
    this.collisionLayer?.destroy();
    this.tilemap?.destroy();
    this.groundLayer = null;
    this.collisionLayer = null;
    this.tilemap = null;
    this.currentRegion = null;
  }

  isWalkable(tileX: number, tileY: number): boolean {
    if (!this.collisionLayer) return true;
    const tile = this.collisionLayer.getTileAt(tileX, tileY);
    return !tile || tile.index === 0;
  }
}
