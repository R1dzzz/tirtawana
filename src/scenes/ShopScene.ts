import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { EconomySystem } from '../systems/EconomySystem';
import { InventorySystem, InventoryStack } from '../systems/InventorySystem';
import { TimeSystem, Season } from '../systems/TimeSystem';
import { ITEMS } from '../data/items';
import { ShopData } from '../data/shops/villageShop';

interface Row { container: any; }

export class ShopScene extends Phaser.Scene {
  private shop!: ShopData;
  private economy!: EconomySystem;
  private inventory!: InventorySystem;
  private goldText!: any;
  private buyRows: Row[] = [];
  private sellRows: Row[] = [];
  private msgText!: any;

  constructor() { super({ key: 'ShopScene', active: false }); }

  init(data: { shop: ShopData }): void { this.shop = data.shop; }

  create(): void {
    this.economy = ServiceLocator.get<EconomySystem>(SERVICE_KEYS.ECONOMY_SYSTEM);
    this.inventory = ServiceLocator.get<InventorySystem>(SERVICE_KEYS.INVENTORY_SYSTEM);

    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setScrollFactor(0);
    const panelW = Math.min(W - 40, 720), panelH = Math.min(H - 40, 420);
    this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x1a2f1a, 0.97)
      .setStrokeStyle(2, 0xf0d040).setScrollFactor(0);

    this.add.text(W / 2, H / 2 - panelH / 2 + 24, this.shop.name, {
      fontFamily: 'monospace', fontSize: '20px', color: '#f0d040', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    this.goldText = this.add.text(W / 2 + panelW / 2 - 20, H / 2 - panelH / 2 + 24, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f0d040'
    }).setOrigin(1, 0.5).setScrollFactor(0);

    this.msgText = this.add.text(W / 2, H / 2 + panelH / 2 - 20, 'Tap item to buy / sell', {
      fontFamily: 'monospace', fontSize: '11px', color: '#a0c0a0'
    }).setOrigin(0.5).setScrollFactor(0);

    const leftX = W / 2 - panelW / 2 + 40;
    const rightX = W / 2 + 40;
    const topY = H / 2 - panelH / 2 + 56;
    this.add.text(leftX, topY, 'BUY', { fontFamily: 'monospace', fontSize: '13px', color: '#4a90d9', fontStyle: 'bold' }).setScrollFactor(0);
    this.add.text(rightX, topY, 'SELL (your bag)', { fontFamily: 'monospace', fontSize: '13px', color: '#d94a4a', fontStyle: 'bold' }).setScrollFactor(0);

    const close = this.add.text(W / 2 + panelW / 2 - 16, H / 2 - panelH / 2 + 8, 'X', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    close.on('pointerdown', () => this.closeShop());

    this.input.keyboard?.on('keydown-ESC', () => this.closeShop());

    EventBus.on(Events.GOLD_CHANGED, this.refresh, this);
    EventBus.on(Events.INVENTORY_CHANGED, this.refresh, this);
    this.refresh();
  }

  private closeShop(): void {
    EventBus.emit(Events.SHOP_CLOSED);
    this.scene.stop('ShopScene');
  }

  private clearRows(): void {
    for (const r of [...this.buyRows, ...this.sellRows]) r.container.destroy(true);
    this.buyRows = [];
    this.sellRows = [];
  }

  refresh(): void {
    if (!this.economy) return;
    this.clearRows();
    this.goldText.setText(`${this.economy.getGold()}g`);

    const cam = this.cameras.main;
    const panelW = Math.min(cam.width - 40, 720), panelH = Math.min(cam.height - 40, 420);
    const leftX = cam.width / 2 - panelW / 2 + 40;
    const rightX = cam.width / 2 + 40;
    let y = cam.height / 2 - panelH / 2 + 80;

    const season: Season = ServiceLocator.has(SERVICE_KEYS.TIME_SYSTEM)
      ? ServiceLocator.get<TimeSystem>(SERVICE_KEYS.TIME_SYSTEM).getSeason()
      : 'spring';

    for (const entry of this.shop.stock) {
      if (entry.seasons && !entry.seasons.includes(season)) continue;
      const item = ITEMS[entry.itemId];
      if (!item) continue;
      const price = this.economy.buyPrice(entry.itemId);
      const row = this.add.container(leftX, y);
      const name = this.add.text(0, 0, item.name, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' });
      const cost = this.add.text(200, 0, `${price}g`, { fontFamily: 'monospace', fontSize: '12px', color: this.economy.canAfford(entry.itemId) ? '#f0d040' : '#d94a4a' });
      const hit = this.add.zone(0, 6, 260, 20).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        if (this.economy.buy(entry.itemId)) this.msgText.setText(`Bought 1 ${item.name}`);
        else this.msgText.setText('Not enough gold!');
      });
      row.add([name, cost, hit]);
      this.buyRows.push({ container: row });
      y += 24;
    }

    y = cam.height / 2 - panelH / 2 + 80;
    const stacks: InventoryStack[] = [...this.inventory.getStacks()].filter(s => (ITEMS[s.itemId]?.sellValue ?? 0) > 0);
    for (const s of stacks) {
      const item = ITEMS[s.itemId];
      const price = this.economy.sellPrice(s.itemId, s.quality);
      const stars = s.quality > 0 ? ' ' + '*'.repeat(s.quality) : '';
      const row = this.add.container(rightX, y);
      const name = this.add.text(0, 0, `${item.name}${stars} x${s.quantity}`, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' });
      const cost = this.add.text(200, 0, `${price}g`, { fontFamily: 'monospace', fontSize: '12px', color: '#4ad94a' });
      const hit = this.add.zone(0, 6, 280, 20).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        if (this.economy.sell(s.itemId, s.quality)) this.msgText.setText(`Sold 1 ${item.name}`);
      });
      row.add([name, cost, hit]);
      this.sellRows.push({ container: row });
      y += 24;
    }
    if (stacks.length === 0) {
      this.add.text(rightX, y, '(nothing to sell)', { fontFamily: 'monospace', fontSize: '11px', color: '#506050' });
    }
  }

  shutdown(): void {
    EventBus.off(Events.GOLD_CHANGED, this.refresh, this);
    EventBus.off(Events.INVENTORY_CHANGED, this.refresh, this);
  }
}
