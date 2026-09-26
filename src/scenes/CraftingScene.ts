import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { CraftingSystem } from '../systems/CraftingSystem';
import { NeedsSystem } from '../systems/NeedsSystem';
import { ITEMS } from '../data/items';
import { RecipeData } from '../data/types/RecipeTypes';

/** One scene serves both stations; `station` decided at launch. */
export class CraftingScene extends Phaser.Scene {
  private station!: 'kitchen' | 'workbench';
  private crafting!: CraftingSystem;
  private rows: any[] = [];
  private msgText!: any;

  constructor() { super({ key: 'CraftingScene', active: false }); }

  init(data: { station: 'kitchen' | 'workbench' }): void { this.station = data.station; }

  create(): void {
    this.crafting = ServiceLocator.get<CraftingSystem>(SERVICE_KEYS.CRAFTING_SYSTEM);
    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setScrollFactor(0);
    const title = this.station === 'kitchen' ? 'KITCHEN' : 'WORKBENCH';
    const panelW = Math.min(W - 40, 560), panelH = Math.min(H - 40, 380);
    this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x14100a, 0.97)
      .setStrokeStyle(2, this.station === 'kitchen' ? 0xd9a04a : 0x8a5a2a).setScrollFactor(0);
    this.add.text(W / 2, H / 2 - panelH / 2 + 22, title, {
      fontFamily: 'monospace', fontSize: '18px', color: '#f0d040', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    this.msgText = this.add.text(W / 2, H / 2 + panelH / 2 - 20, 'Select a recipe', {
      fontFamily: 'monospace', fontSize: '11px', color: '#a0c0a0'
    }).setOrigin(0.5).setScrollFactor(0);

    const close = this.add.text(W / 2 + panelW / 2 - 16, H / 2 - panelH / 2 + 8, 'X', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    close.on('pointerdown', () => this.closeStation());
    this.input.keyboard?.on('keydown-ESC', () => this.closeStation());

    this.refresh();
  }

  private closeStation(): void {
    EventBus.emit(Events.CRAFTING_CLOSED);
    this.scene.stop('CraftingScene');
  }

  refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;
    let y = H / 2 - 110;

    for (const recipe of this.crafting.recipesFor(this.station)) {
      const out = ITEMS[recipe.outputItemId];
      const can = this.crafting.canCraft(recipe);
      const ingStr = recipe.ingredients.map(i =>
        `${ITEMS[i.itemId]?.name ?? i.itemId} x${i.quantity}(${this.crafting ? '' : ''}${countOf(i.itemId)})`
      ).join(' + ');

      function countOf(itemId: string): number {
        const inv = ServiceLocator.get<any>(SERVICE_KEYS.INVENTORY_SYSTEM);
        return inv.count(itemId);
      }

      const row = this.add.container(W / 2 - 240, y);
      const name = this.add.text(0, 0, `${recipe.name}`, {
        fontFamily: 'monospace', fontSize: '12px', color: can ? '#ffffff' : '#706a60', fontStyle: 'bold'
      });
      const ings = this.add.text(0, 16, ingStr, {
        fontFamily: 'monospace', fontSize: '10px', color: can ? '#a0c0a0' : '#706a60'
      });
      const desc = this.add.text(0, 30, recipe.description, {
        fontFamily: 'monospace', fontSize: '9px', color: '#808a80',
        wordWrap: { width: 420 }
      });
      const craftBtn = this.add.text(440, 4, can ? '[MAKE]' : '[---]', {
        fontFamily: 'monospace', fontSize: '12px', color: can ? '#f0d040' : '#505050'
      }).setInteractive({ useHandCursor: can });
      if (can) {
        craftBtn.on('pointerdown', () => {
          const r = this.crafting.craft(recipe.id);
          this.msgText.setText(r.message);
          if (r.ok && this.station === 'kitchen') {
            // cooking instantly restores a taste of the effect
            const needs = ServiceLocator.get<NeedsSystem>(SERVICE_KEYS.NEEDS_SYSTEM);
            const fx = recipe.effects;
            if (fx?.hunger) needs.feed(Math.floor(fx.hunger / 4));
          }
          this.refresh();
        });
      }
      row.add([name, ings, desc, craftBtn]);
      this.rows.push(row);
      y += 52;
    }
  }

  shutdown(): void { for (const r of this.rows) r.destroy(); this.rows = []; }
}
