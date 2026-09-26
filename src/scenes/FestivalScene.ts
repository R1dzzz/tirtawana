import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { FestivalSystem } from '../systems/FestivalSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { InventorySystem, InventoryStack } from '../systems/InventorySystem';
import { FestivalData } from '../data/types/FestivalTypes';
import { ITEMS } from '../data/items';

export class FestivalScene extends Phaser.Scene {
  private festival!: FestivalData;
  private fs!: FestivalSystem;
  private rows: any[] = [];
  private msgText!: any;

  constructor() { super({ key: 'FestivalScene', active: false }); }

  init(data: { festival: FestivalData }): void { this.festival = data.festival; }

  create(): void {
    this.fs = ServiceLocator.get<FestivalSystem>(SERVICE_KEYS.FESTIVAL_SYSTEM);
    const inv = ServiceLocator.get<InventorySystem>(SERVICE_KEYS.INVENTORY_SYSTEM);
    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x1a0a2a, 0.7).setScrollFactor(0);
    const panelW = Math.min(W - 40, 560), panelH = Math.min(H - 40, 360);
    this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x241436, 0.97)
      .setStrokeStyle(2, 0xf0d040).setScrollFactor(0);
    this.add.text(W / 2, H / 2 - panelH / 2 + 22, `🎉 ${this.festival.name}`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#f0d040', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);
    this.add.text(W / 2, H / 2 - panelH / 2 + 48, this.festival.description, {
      fontFamily: 'monospace', fontSize: '10px', color: '#c0b0d0',
      wordWrap: { width: panelW - 60 }, align: 'center'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.msgText = this.add.text(W / 2, H / 2 + panelH / 2 - 20, this.festival.contestPrompt, {
      fontFamily: 'monospace', fontSize: '11px', color: '#e0d0f0'
    }).setOrigin(0.5).setScrollFactor(0);

    const close = this.add.text(W / 2 + panelW / 2 - 16, H / 2 - panelH / 2 + 8, 'X', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    close.on('pointerdown', () => this.closeFest());
    this.input.keyboard?.on('keydown-ESC', () => this.closeFest());

    if (this.fs.hasEntered(this.festival.id)) {
      this.msgText.setText(`Already entered! Best score: ${this.fs.bestScore(this.festival.id)}`);
      return;
    }

    const eligible = FestivalSystem.eligibleItems(this.festival, [...inv.getStacks()] as InventoryStack[]);
    let y = H / 2 - 60;
    if (eligible.length === 0) {
      this.add.text(W / 2, y, `(No eligible ${this.festival.contestItemType} items in your bag!)`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#907a90'
      }).setOrigin(0.5, 0).setScrollFactor(0);
    }
    for (const s of eligible) {
      const item = ITEMS[s.itemId];
      const stars = s.quality > 0 ? '*'.repeat(s.quality) : '';
      const t = this.add.text(W / 2 - 200, y, `${item.name} ${stars} x${s.quantity}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff'
      }).setInteractive({ useHandCursor: true }).setScrollFactor(0);
      t.on('pointerover', () => t.setColor('#f0d040'));
      t.on('pointerout', () => t.setColor('#ffffff'));
      t.on('pointerdown', () => this.submit(s.itemId, s.quality));
      this.rows.push(t);
      y += 22;
    }
  }

  private submit(itemId: string, quality: number): void {
    const eco = ServiceLocator.get<EconomySystem>(SERVICE_KEYS.ECONOMY_SYSTEM);
    const inv = ServiceLocator.get<InventorySystem>(SERVICE_KEYS.INVENTORY_SYSTEM);
    const { score, rewardGold } = this.fs.judge(this.festival, itemId, quality);
    inv.remove(itemId, 1, quality);
    eco.setGold(eco.getGold() + rewardGold);
    for (const t of this.rows) t.destroy();
    this.rows = [];
    this.msgText.setText(`Score ${score}! You win ${rewardGold}g! 🏆`);
  }

  private closeFest(): void {
    EventBus.emit(Events.FESTIVAL_CLOSED);
    this.scene.stop('FestivalScene');
  }

  shutdown(): void { for (const t of this.rows) t.destroy(); this.rows = []; }
}
