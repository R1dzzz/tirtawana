import Phaser from 'phaser';
import { HUDBar } from '../ui/components/HUDBar';
import { EventBus, Events } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { SaveManager } from '../save/SaveManager';
import { InventorySystem } from '../systems/InventorySystem';
import { TimeSystem, DAYS_PER_SEASON } from '../systems/TimeSystem';
import { ResonanceSystem } from '../systems/ResonanceSystem';

const TOOL_NAMES: Record<string, string> = {
  hand: 'Hand', hoe: 'Hoe', can: 'Watering Can', rod: 'Fishing Rod', pickaxe: 'Pickaxe'
};

export class HUDScene extends Phaser.Scene {
  private bars: HUDBar[] = [];
  private timeText!: any;
  private goldText!: any;
  private regionText!: any;
  private toolText!: any;
  private seedText!: any;
  private updateTimer: number = 0;

  constructor() { super({ key: 'HUDScene', active: false }); }

  create(): void {
    const cam = this.cameras.main;

    this.timeText = this.add.text(10, 10, 'Day 1 | 06:00', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(2000);

    this.regionText = this.add.text(10, 26, 'Starting Village', {
      fontFamily: 'monospace', fontSize: '10px', color: '#a0c0a0',
      stroke: '#000000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(2000);

    this.goldText = this.add.text(cam.width - 10, 10, '500g', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f0d040',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(2000);

    this.toolText = this.add.text(10, 44, 'Tool: Hand  (Q / 1-3)', {
      fontFamily: 'monospace', fontSize: '10px', color: '#f0d040',
      stroke: '#000000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(2000);

    this.seedText = this.add.text(10, 58, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#c0e0c0',
      stroke: '#000000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(2000);

    const barX = 10;
    const barStartY = cam.height - 90;
    const barWidth = 100;

    this.bars = [
      new HUDBar(this, barX, barStartY, barWidth, 'HP', 'red'),
      new HUDBar(this, barX, barStartY + 16, barWidth, 'ST', 'green'),
      new HUDBar(this, barX, barStartY + 32, barWidth, 'HU', 'orange'),
      new HUDBar(this, barX, barStartY + 48, barWidth, 'TH', 'blue'),
      new HUDBar(this, barX, barStartY + 64, barWidth, 'FA', 'purple')
    ];

    EventBus.on(Events.TOOL_CHANGED, this.onToolChanged, this);
    EventBus.on(Events.INVENTORY_CHANGED, this.refreshFromSave, this);
    EventBus.on(Events.DAY_ADVANCED, this.refreshFromSave, this);
    EventBus.on(Events.TIME_CHANGED, this.onTimeChanged, this);
    this.scale.on('resize', this.onResize, this);

    this.refreshFromSave();
  }

  private onToolChanged(tool: string): void {
    this.toolText.setText(`Tool: ${TOOL_NAMES[tool] ?? tool}  (Q / 1-3)`);
  }

  private onTimeChanged(state: { day: number; timeMinutes: number; season: string }): void {
    const hours = Math.floor(state.timeMinutes / 60) % 24;
    const mins = Math.floor(state.timeMinutes % 60);
    const seasonDay = ((state.day - 1) % DAYS_PER_SEASON) + 1;
    this.timeText.setText(
      `Day ${state.day} (${state.season} ${seasonDay}) | ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    );
  }

  private onResize(): void {
    const cam = this.cameras.main;
    this.goldText.setPosition(cam.width - 10, 10);
    const barStartY = cam.height - 90;
    this.bars.forEach((bar, i) => bar.setPosition(10, barStartY + i * 16));
  }

  private refreshFromSave(): void {
    const saveManager = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    const save = saveManager.getCurrentSave();
    if (!save) return;

    const p = save.player;
    this.bars[0]?.setValue(p.health, p.maxHealth);
    this.bars[1]?.setValue(p.stamina, p.maxStamina);
    this.bars[2]?.setValue(p.hunger, p.maxHunger);
    this.bars[3]?.setValue(p.thirst, p.maxThirst);
    this.bars[4]?.setValue(p.fatigue, p.maxFatigue);

    this.goldText.setText(`${p.gold}g`);
    this.regionText.setText(save.world.currentRegionId.replace(/_/g, ' '));

    if (ServiceLocator.has(SERVICE_KEYS.TIME_SYSTEM)) {
      const ts = ServiceLocator.get<TimeSystem>(SERVICE_KEYS.TIME_SYSTEM);
      this.onTimeChanged(ts.getState());
    }

    if (ServiceLocator.has(SERVICE_KEYS.INVENTORY_SYSTEM)) {
      const inv = ServiceLocator.get<InventorySystem>(SERVICE_KEYS.INVENTORY_SYSTEM);
      const seeds = inv.getStacks().filter(s => s.itemId.startsWith('seed_'));
      this.seedText.setText(seeds.length > 0
        ? seeds.map(s => `${s.itemId.replace('seed_', '')}: ${s.quantity}`).join('  ')
        : 'No seeds');
    }
  }

  update(time: number, delta: number): void {
    this.updateTimer += delta;
    if (this.updateTimer >= 1000) {
      this.updateTimer = 0;
      this.refreshFromSave();
    }
  }

  shutdown(): void {
    EventBus.off(Events.TOOL_CHANGED, this.onToolChanged, this);
    EventBus.off(Events.INVENTORY_CHANGED, this.refreshFromSave, this);
    EventBus.off(Events.DAY_ADVANCED, this.refreshFromSave, this);
    EventBus.off(Events.TIME_CHANGED, this.onTimeChanged, this);
    this.scale.off('resize', this.onResize, this);
    this.bars.forEach(b => b.destroy());
  }
}
