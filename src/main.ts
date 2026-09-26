import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { RotateScene } from './scenes/RotateScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { ShopScene } from './scenes/ShopScene';
import { DialogueScene } from './scenes/DialogueScene';
import { QuestScene } from './scenes/QuestScene';
import { CraftingScene } from './scenes/CraftingScene';
import { FestivalScene } from './scenes/FestivalScene';
import { VillageScene } from './scenes/VillageScene';

const config: any = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a2f1a',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
    min: { width: 480, height: 270 }
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },
  scene: [BootScene, TitleScene, RotateScene, GameScene, HUDScene, ShopScene, DialogueScene, QuestScene, CraftingScene, FestivalScene, VillageScene]
};

const game = new Phaser.Game(config);

function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  const rotateActive = game.scene.isActive('RotateScene');
  const gameActive = game.scene.isActive('GameScene');

  if (isPortrait && !rotateActive) {
    if (gameActive) {
      game.scene.pause('GameScene');
      game.scene.pause('HUDScene');
    }
    game.scene.start('RotateScene');
  } else if (!isPortrait && rotateActive) {
    game.scene.stop('RotateScene');
    if (game.scene.isPaused('GameScene')) {
      game.scene.resume('GameScene');
      game.scene.resume('HUDScene');
    }
  }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 100));
game.events.once('ready', () => setTimeout(checkOrientation, 50));

// PWA: register service worker in production builds
if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline precache unavailable */ });
  });
}
