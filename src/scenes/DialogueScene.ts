import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { RelationshipSystem } from '../systems/RelationshipSystem';
import { NPCS } from '../data/npcs/villagers';
import { DialogueNode } from '../data/types/DialogueTypes';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { TimeSystem } from '../systems/TimeSystem';
import { SaveManager } from '../save/SaveManager';

export class DialogueScene extends Phaser.Scene {
  private npcId!: string;
  private rs!: RelationshipSystem;
  private node: DialogueNode | null = null;
  private friendshipGained = 0;
  private nameText!: any;
  private bodyText!: any;
  private optionTexts: any[] = [];

  constructor() { super({ key: 'DialogueScene', active: false }); }

  init(data: { npcId: string; relationship: RelationshipSystem }): void {
    this.npcId = data.npcId;
    this.rs = data.relationship;
    this.friendshipGained = 0;
  }

  create(): void {
    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;

    // Bottom dialogue box
    const boxH = Math.min(150, H * 0.4);
    this.add.rectangle(W / 2, H - boxH / 2, W - 20, boxH - 10, 0x0a140a, 0.95)
      .setStrokeStyle(2, 0xf0d040).setScrollFactor(0).setDepth(5000);

    const npc = NPCS[this.npcId];
    this.nameText = this.add.text(20, H - boxH + 8, npc?.name ?? '???', {
      fontFamily: 'monospace', fontSize: '13px', color: '#f0d040', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(5001);
    this.bodyText = this.add.text(20, H - boxH + 30, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
      wordWrap: { width: W - 60 }
    }).setScrollFactor(0).setDepth(5001);

    this.showNode(this.rs.getStartNode(this.npcId));
  }

  private showNode(node: DialogueNode | null): void {
    if (!node) { this.close(); return; }
    this.node = node;
    this.bodyText.setText(node.text);
    for (const t of this.optionTexts) t.destroy();
    this.optionTexts = [];

    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;
    const npc = NPCS[this.npcId];

    // Filter options by condition
    const season = ServiceLocator.has(SERVICE_KEYS.TIME_SYSTEM)
      ? ServiceLocator.get<TimeSystem>(SERVICE_KEYS.TIME_SYSTEM).getSeason() : 'spring';
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    const save = sm.getCurrentSave();
    const hearts = this.rs.getState(this.npcId)?.hearts ?? 0;
    const opts = (node.options ?? []).filter(o =>
      RelationshipSystem.checkCondition(o.condition, {
        hearts, season,
        hasItem: (id) => save?.inventory.some(s => s.itemId === id && s.quantity > 0) ?? false,
        flag: (k) => (save?.world.villageDevelopment[k] ?? 0) > 0
      }));

    let y = H - 60;
    if (opts.length === 0) {
      // Single continue/close
      const label = node.next ? 'Continue ▸' : 'Goodbye';
      const t = this.add.text(W - 120, y, label, {
        fontFamily: 'monospace', fontSize: '12px', color: '#a0c0a0'
      }).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(5001);
      t.on('pointerdown', () => {
        if (node.next) this.showNode(this.rs.getNode(this.npcId, node.next));
        else this.close();
      });
      this.optionTexts.push(t);
    } else {
      for (const opt of opts) {
        const t = this.add.text(W - 260, y, `▸ ${opt.label}`, {
          fontFamily: 'monospace', fontSize: '12px', color: '#c0e0c0'
        }).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(5001);
        t.on('pointerover', () => t.setColor('#f0d040'));
        t.on('pointerout', () => t.setColor('#c0e0c0'));
        t.on('pointerdown', () => {
          if (opt.friendship) this.friendshipGained += opt.friendship;
          if (opt.next) this.showNode(this.rs.getNode(this.npcId, opt.next));
          else this.close();
        });
        this.optionTexts.push(t);
        y -= 20;
      }
    }
  }

  private close(): void {
    EventBus.emit(Events.DIALOGUE_CLOSED, {
      npcId: this.npcId,
      friendshipGained: this.friendshipGained
    });
    this.scene.stop('DialogueScene');
  }

  shutdown(): void {
    for (const t of this.optionTexts) t.destroy();
    this.optionTexts = [];
  }
}
