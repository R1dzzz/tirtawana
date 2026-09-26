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
    if (!this.groundLayer || !this.collisionLayer) return;
    const { mapWidth, mapHeight } = region;
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        let tile = 0; // grass
        if (x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1) {
          tile = 1; // water border
          this.collisionLayer.putTileAt(1, x, y);
        } else if (y === Math.floor(mapHeight / 2) || x === Math.floor(mapWidth / 2)) {
          tile = 2; // path cross
        } else if (Math.random() < 0.05) {
          tile = 3; // flowers
        }
        this.groundLayer.putTileAt(tile, x, y);
      }
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
