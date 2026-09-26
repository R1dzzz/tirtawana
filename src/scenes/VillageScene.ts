import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { VillageSystem } from '../systems/VillageSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { VILLAGE_PROJECTS } from '../data/village/projects';
import { ITEMS } from '../data/items';

export class VillageScene extends Phaser.Scene {
  private vs!: VillageSystem;
  private rows: any[] = [];
  private msgText!: any;

  constructor() { super({ key: 'VillageScene', active: false }); }

  create(): void {
    this.vs = ServiceLocator.get<VillageSystem>(SERVICE_KEYS.VILLAGE_SYSTEM);
    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setScrollFactor(0);
    const panelW = Math.min(W - 40, 620), panelH = Math.min(H - 40, 400);
    this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x0a1410, 0.97)
      .setStrokeStyle(2, 0x4ad94a).setScrollFactor(0);
    this.add.text(W / 2, H / 2 - panelH / 2 + 22, 'VILLAGE DEVELOPMENT', {
      fontFamily: 'monospace', fontSize: '16px', color: '#4ad94a', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    this.msgText = this.add.text(W / 2, H / 2 + panelH / 2 - 18, 'Contribute materials and gold to village projects', {
      fontFamily: 'monospace', fontSize: '11px', color: '#a0c0a0'
    }).setOrigin(0.5).setScrollFactor(0);

    const close = this.add.text(W / 2 + panelW / 2 - 16, H / 2 - panelH / 2 + 8, 'X', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    close.on('pointerdown', () => this.closePanel());
    this.input.keyboard?.on('keydown-ESC', () => this.closePanel());
    this.refresh();
  }

  private closePanel(): void {
    EventBus.emit(Events.VILLAGE_CLOSED);
    this.scene.stop('VillageScene');
  }

  refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;
    let y = H / 2 - 140;

    for (const project of this.vs.allProjects()) {
      const prog = this.vs.getProgress(project.id)!;
      const frac = this.vs.projectFraction(project.id);
      const done = prog.completed;

      this.rows.push(this.add.text(W / 2 - 280, y, `${done ? '✅' : '🔨'} ${project.name} (${Math.round(frac * 100)}%)`, {
        fontFamily: 'monospace', fontSize: '13px', color: done ? '#4ad94a' : '#ffffff', fontStyle: 'bold'
      }).setScrollFactor(0));
      y += 18;
      this.rows.push(this.add.text(W / 2 - 260, y, project.description, {
        fontFamily: 'monospace', fontSize: '9px', color: '#809080', wordWrap: { width: 540 }
      }).setScrollFactor(0));
      y += 20;

      // material rows with donate buttons
      for (const c of project.costs) {
        const given = prog.contributed[c.itemId] ?? 0;
        const full = given >= c.quantity;
        const inv = ServiceLocator.get<any>(SERVICE_KEYS.INVENTORY_SYSTEM);
        const have = inv.count(c.itemId);
        const label = `  ${ITEMS[c.itemId]?.name ?? c.itemId}: ${given}/${c.quantity} (have ${have})`;
        this.rows.push(this.add.text(W / 2 - 260, y, label, {
          fontFamily: 'monospace', fontSize: '11px', color: full ? '#4ad94a' : have > 0 ? '#ffffff' : '#706a60'
        }).setScrollFactor(0));
        if (!full && !done && have > 0) {
          const btn = this.add.text(W / 2 + 180, y, '[GIVE 1]', {
            fontFamily: 'monospace', fontSize: '10px', color: '#f0d040'
          }).setInteractive({ useHandCursor: true }).setScrollFactor(0);
          btn.on('pointerdown', () => {
            const r = this.vs.donateItem(project.id, c.itemId);
            this.msgText.setText(r.message);
            this.refresh();
          });
          this.rows.push(btn);
        }
        y += 15;
      }
      // gold row
      const goldFull = prog.goldGiven >= project.gold;
      this.rows.push(this.add.text(W / 2 - 260, y, `  Gold: ${prog.goldGiven}/${project.gold}g`, {
        fontFamily: 'monospace', fontSize: '11px', color: goldFull ? '#4ad94a' : '#ffffff'
      }).setScrollFactor(0));
      if (!goldFull && !done) {
        const btn = this.add.text(W / 2 + 180, y, '[GIVE 50g]', {
          fontFamily: 'monospace', fontSize: '10px', color: '#f0d040'
        }).setInteractive({ useHandCursor: true }).setScrollFactor(0);
        btn.on('pointerdown', () => {
          const eco = ServiceLocator.get<EconomySystem>(SERVICE_KEYS.ECONOMY_SYSTEM);
          if (eco.getGold() < 50) { this.msgText.setText('Not enough gold!'); return; }
          eco.setGold(eco.getGold() - 50);
          const r = this.vs.donateGold(project.id, 50);
          this.msgText.setText(r.message);
          this.refresh();
        });
        this.rows.push(btn);
      }
      y += 26;
    }
  }

  shutdown(): void { for (const r of this.rows) r.destroy(); this.rows = []; }
}
