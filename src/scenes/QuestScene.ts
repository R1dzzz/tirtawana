import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { QuestSystem } from '../systems/QuestSystem';
import { QUESTS } from '../data/quests/quests';

export class QuestScene extends Phaser.Scene {
  private qs!: QuestSystem;
  private rows: any[] = [];

  constructor() { super({ key: 'QuestScene', active: false }); }

  create(): void {
    this.qs = ServiceLocator.get<QuestSystem>(SERVICE_KEYS.QUEST_SYSTEM);
    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setScrollFactor(0);
    const panelW = Math.min(W - 40, 640), panelH = Math.min(H - 40, 400);
    this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x101a10, 0.97)
      .setStrokeStyle(2, 0xf0d040).setScrollFactor(0);

    this.add.text(W / 2, H / 2 - panelH / 2 + 22, 'QUEST LOG', {
      fontFamily: 'monospace', fontSize: '18px', color: '#f0d040', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    const close = this.add.text(W / 2 + panelW / 2 - 16, H / 2 - panelH / 2 + 8, 'X', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    close.on('pointerdown', () => this.closeLog());

    this.input.keyboard?.on('keydown-ESC', () => this.closeLog());
    this.input.keyboard?.on('keydown-Q', () => this.closeLog());
    this.refresh();
  }

  private closeLog(): void {
    EventBus.emit(Events.QUEST_LOG_CLOSED);
    this.scene.stop('QuestScene');
  }

  refresh(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];
    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;
    let y = H / 2 - 140;

    const active = this.qs.getActive();
    if (active.length === 0) {
      this.rows.push(this.add.text(W / 2, y, 'No active quests.', {
        fontFamily: 'monospace', fontSize: '12px', color: '#a0c0a0'
      }).setOrigin(0.5, 0).setScrollFactor(0));
    }
    for (const aq of active) {
      const q = QUESTS[aq.questId];
      const frac = this.qs.progressFraction(aq);
      const status = aq.completed ? ' [READY — turn in!]' : ` ${Math.round(frac * 100)}%`;
      this.rows.push(this.add.text(W / 2 - 280, y, `${q.title}${status}`, {
        fontFamily: 'monospace', fontSize: '13px', color: aq.completed ? '#4ad94a' : '#ffffff', fontStyle: 'bold'
      }).setScrollFactor(0));
      y += 20;
      this.rows.push(this.add.text(W / 2 - 260, y, q.description, {
        fontFamily: 'monospace', fontSize: '10px', color: '#a0c0a0',
        wordWrap: { width: 560 }
      }).setScrollFactor(0));
      y += 18;
      for (const o of q.objectives) {
        const p = aq.progress[o.id] ?? 0;
        const doneMark = p >= o.target ? '✓' : '·';
        this.rows.push(this.add.text(W / 2 - 240, y, `${doneMark} ${o.description} (${Math.min(p, o.target)}/${o.target})`, {
          fontFamily: 'monospace', fontSize: '11px', color: p >= o.target ? '#4ad94a' : '#c0c0c0'
        }).setScrollFactor(0));
        y += 16;
      }
      if (aq.completed) {
        const btn = this.add.text(W / 2 + 200, y - 16, 'TURN IN', {
          fontFamily: 'monospace', fontSize: '11px', color: '#f0d040', fontStyle: 'bold',
          backgroundColor: '#2a3a2a', padding: { x: 8, y: 3 }
        }).setInteractive({ useHandCursor: true }).setScrollFactor(0);
        btn.on('pointerdown', () => this.turnIn(aq.questId));
        this.rows.push(btn);
      }
      y += 22;
    }
  }

  private turnIn(questId: string): void {
    const eco = ServiceLocator.get<any>(SERVICE_KEYS.ECONOMY_SYSTEM);
    const inv = ServiceLocator.get<any>(SERVICE_KEYS.INVENTORY_SYSTEM);
    const reward = this.qs.turnIn(questId);
    if (!reward) return;
    eco.setGold(eco.getGold() + reward.gold);
    for (const item of reward.items) inv.add(item.itemId, item.quantity);
    this.refresh();
  }

  shutdown(): void { for (const r of this.rows) r.destroy(); this.rows = []; }
}
