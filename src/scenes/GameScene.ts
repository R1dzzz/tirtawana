import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { TilemapManager } from '../world/TilemapManager';
import { PlotRenderer } from '../world/PlotRenderer';
import { RegionManager } from '../world/RegionManager';
import { VirtualJoystick } from '../ui/components/VirtualJoystick';
import { ActionButton } from '../ui/components/ActionButton';
import { GAME_CONFIG } from '../app/Config';
import { EventBus, Events } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { SaveManager } from '../save/SaveManager';
import { InventorySystem } from '../systems/InventorySystem';
import { FarmingSystem, FarmAction } from '../systems/FarmingSystem';
import { TimeSystem } from '../systems/TimeSystem';
import { NeedsSystem } from '../systems/NeedsSystem';
import { RegionExit } from '../data/locations/regions';
import { EconomySystem } from '../systems/EconomySystem';
import { FishingSystem, FishRoll, JournalFishEntry } from '../systems/FishingSystem';
import { VILLAGE_SHOP } from '../data/shops/villageShop';
import { MiningSystem } from '../systems/MiningSystem';
import { ROCK_TYPES, REGION_ROCKS } from '../data/rocks/mineRocks';
import { LoggingSystem } from '../systems/LoggingSystem';
import { WildlifeSystem } from '../systems/WildlifeSystem';
import { WILDLIFE } from '../data/wildlife/creatures';
import { CombatSystem } from '../systems/CombatSystem';
import { MONSTERS } from '../data/monsters/monsters';
import { AnimalSystem } from '../systems/AnimalSystem';
import { ANIMAL_SPECIES } from '../data/animals/species';
import { NPCSystem } from '../systems/NPCSystem';
import { NPCS, VILLAGE_ANCHORS } from '../data/npcs/villagers';
import { RelationshipSystem } from '../systems/RelationshipSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { CraftingSystem } from '../systems/CraftingSystem';
import { WeatherSystem, WeatherType } from '../systems/WeatherSystem';
import { FestivalSystem } from '../systems/FestivalSystem';
import { VillageSystem } from '../systems/VillageSystem';
import { ResonanceSystem } from '../systems/ResonanceSystem';
import { POIS, poisForRegion } from '../data/village/pois';
import { ITEMS } from '../data/items';
import { Logger } from '../core/Logger';

type Tool = 'hand' | 'hoe' | 'can' | 'rod' | 'pickaxe';

interface ContextAction {
  label: string;
  action: FarmAction | 'sleep' | 'shop' | 'fish' | 'mine' | 'chop' | 'observe' | 'animal' | 'talk' | 'eat' | 'station' | 'festival' | 'village';
  tx: number;
  ty: number;
}

interface PortalZone {
  exit: RegionExit;
  zone: any;
  sign: any;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private tilemapManager!: TilemapManager;
  private plotRenderer!: PlotRenderer;
  private regionManager!: RegionManager;
  private portals: PortalZone[] = [];
  private isTransitioning = false;

  private joystick!: VirtualJoystick;
  private interactBtn!: ActionButton;
  private attackBtn!: ActionButton;
  private dodgeBtn!: ActionButton;
  private trees: any | null = null;
  private structures: any | null = null;
  private shopStall: any = null;

  private economy!: EconomySystem;
  private fishingSystem!: FishingSystem;

  private fishing = {
    active: false,
    pending: null as FishRoll | null,
    ringR: 0,
    targetR: 30,
    windowHalf: 10,
    speed: 60,
    graphics: null as any
  };

  private miningSystem!: MiningSystem;
  private rocks: Array<{ sprite: any; typeId: string; hp: number }> = [];
  private loggingSystem!: LoggingSystem;
  private wildlifeSystem!: WildlifeSystem;
  private wildlifeSprites: Array<{ sprite: any; spawn: any }> = [];
  private treeNodes: Array<{ sprite: any; treeId: string }> = [];
  private combatSystem!: CombatSystem;
  private monsters: Array<{ sprite: any; m: any }> = [];
  private attackCooldown = 0;
  private animalSystem!: AnimalSystem;
  private animalSprites: Array<{ sprite: any; animalId: string }> = [];
  private penPos = { x: 640, y: 400 };
  private npcSystem!: NPCSystem;
  private npcSprites: Array<{ sprite: any; npcId: string }> = [];
  private relationshipSystem!: RelationshipSystem;
  private questSystem!: QuestSystem;
  private craftingSystem!: CraftingSystem;
  private weatherSystem!: WeatherSystem;
  private weatherOverlay: any = null;
  private precipParticles: any[] = [];
  private festivalSystem!: FestivalSystem;
  private villageSystem!: VillageSystem;
  private resonanceSystem!: ResonanceSystem;
  private foundPOIs: string[] = [];
  private npcRefreshTimer: number = 0;

  private inventory!: InventorySystem;
  private farming!: FarmingSystem;
  private timeSystem!: TimeSystem;
  private needs!: NeedsSystem;

  private currentTool: Tool = 'hand';
  private contextAction: ContextAction | null = null;
  private contextTimer: number = 0;
  private needsSyncTimer: number = 0;

  private housePos = { x: 512, y: 300 };
  private bedPos = { x: 512, y: 342 };
  private spawnPoint = { x: 400, y: 300 };
  private savedRegionId: string | null = null;
  private nightOverlay!: any;
  private isSleeping = false;

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    Logger.info('GameScene: Starting...');
    const saveManager = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    const save = saveManager.getCurrentSave();

    this.savedRegionId = save?.world.currentRegionId ?? null;

    // --- Systems ---
    this.inventory = new InventorySystem();
    this.farming = new FarmingSystem(this.inventory);
    this.regionManager = new RegionManager(save?.world.currentRegionId ?? 'village');
    this.economy = new EconomySystem(this.inventory, save?.player.gold ?? 500);
    this.fishingSystem = new FishingSystem();
    this.miningSystem = new MiningSystem();
    this.loggingSystem = new LoggingSystem();
    this.wildlifeSystem = new WildlifeSystem();
    this.combatSystem = new CombatSystem();
    this.animalSystem = new AnimalSystem();
    this.npcSystem = new NPCSystem();
    this.relationshipSystem = new RelationshipSystem();
    this.questSystem = new QuestSystem();
    this.craftingSystem = new CraftingSystem(this.inventory);
    this.weatherSystem = new WeatherSystem(undefined, (save?.world.weather.current as WeatherType) ?? 'sunny');
    this.festivalSystem = new FestivalSystem();
    this.villageSystem = new VillageSystem(this.inventory);
    this.resonanceSystem = new ResonanceSystem(save?.world.resonance);
    // Consume resonance actions emitted by LoggingSystem etc.
    EventBus.on(Events.RESONANCE_CHANGED, (d: any) => {
      if (d && typeof d.delta === 'number' && d.region) {
        this.resonanceSystem.applyAction(d.region, d.action ?? 'unknown', d.delta);
      }
    });

    const msPerGameMinute = (GAME_CONFIG.DAY_LENGTH_MINUTES * 60 * 1000) / 1440;
    this.timeSystem = new TimeSystem(
      GAME_CONFIG.DAY_LENGTH_MINUTES,
      save?.world.day ?? 1,
      save?.world.timeMinutes ?? GAME_CONFIG.DAY_START_HOUR * 60
    );
    this.needs = new NeedsSystem(msPerGameMinute, save ? {
      health: save.player.health, maxHealth: save.player.maxHealth,
      stamina: save.player.stamina, maxStamina: save.player.maxStamina,
      hunger: save.player.hunger, maxHunger: save.player.maxHunger,
      thirst: save.player.thirst, maxThirst: save.player.maxThirst,
      fatigue: save.player.fatigue, maxFatigue: save.player.maxFatigue
    } : undefined);

    ServiceLocator.register(SERVICE_KEYS.INVENTORY_SYSTEM, this.inventory);
    ServiceLocator.register(SERVICE_KEYS.FARMING_SYSTEM, this.farming);
    ServiceLocator.register(SERVICE_KEYS.TIME_SYSTEM, this.timeSystem);
    ServiceLocator.register(SERVICE_KEYS.ECONOMY_SYSTEM, this.economy);
    ServiceLocator.register(SERVICE_KEYS.QUEST_SYSTEM, this.questSystem);
    ServiceLocator.register(SERVICE_KEYS.CRAFTING_SYSTEM, this.craftingSystem);
    ServiceLocator.register(SERVICE_KEYS.NEEDS_SYSTEM, this.needs);
    ServiceLocator.register(SERVICE_KEYS.FESTIVAL_SYSTEM, this.festivalSystem);
    ServiceLocator.register(SERVICE_KEYS.VILLAGE_SYSTEM, this.villageSystem);

    if (save) {
      this.inventory.load(save.inventory);
      this.farming.load(save.farm.plots);
      this.animalSystem.load(save.farm.animals);
      this.npcSystem.load(save.npcs);
      this.questSystem.load(save.quests.active && { active: save.quests.active, turnedIn: save.quests.completed } as any);
      this.villageSystem.load(save.world.villageDevelopment as any);
      this.foundPOIs = (save.journal as any).notes?.filter((n: string) => n.startsWith('poi:'))?.map((n: string) => n.slice(4)) ?? [];
      // seed relationship hearts from saved npc friendship
      for (const id of Object.keys(save.npcs)) {
        const f = (save.npcs[id] as any).friendship ?? 0;
        if (f > 0) this.relationshipSystem.addFriendship(id, f);
      }
    }

    if (this.inventory.count('seed_turnipa') === 0 && (save?.farm.plots.length ?? 0) === 0) {
      this.inventory.add('seed_turnipa', 6);
      Logger.info('Granted starter kit: 6 Turnipa seeds');
      this.animalSystem.buy('chicken');
      this.inventory.add('animal_feed', 5);
    }

    this.timeSystem.onDayRollover = () => {
      const forestScore = this.resonanceSystem.get('forest');
      this.loggingSystem.advanceDay(forestScore);
      const weather = this.weatherSystem.advanceDay(this.timeSystem.getSeason());
      if (WeatherSystem.watersCrops(weather)) {
        for (const plot of this.farming.getAllPlots()) {
          if (plot.cropId && !this.farming.isMature(plot)) plot.watered = true;
        }
      }
      this.farming.advanceDay();
      const ready = this.animalSystem.advanceDay();
      for (const id of ready) {
        const a = this.animalSystem.get(id);
        if (a) {
          const sp = ANIMAL_SPECIES[a.speciesId];
          this.inventory.add(sp.productItemId, 1, AnimalSystem.quality(a));
        }
      }
      this.syncWorldToSave();
      this.npcSystem.advanceDay();
      this.syncAnimalsToSave();
    };
    this.villageSystem.onProjectCompleted = (project) => {
      const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
      sm.updateSave(s => {
        if (project.effect.type === 'bridge') {
          if (!s.world.bridgesBuilt.includes(project.effect.bridgeId)) {
            s.world.bridgesBuilt.push(project.effect.bridgeId);
          }
        } else if (project.effect.type === 'flag') {
          s.world.villageDevelopment[project.effect.flag] = 1;
        }
        s.world.villageDevelopment[project.id] = 1;
      });
      this.showFloatText(this.player.sprite.x, this.player.sprite.y - 44, `🏗️ ${project.name} complete!`);
      this.questSystem.notify('discover', 1);
    };

    this.timeSystem.onExhaustionThreshold = () => this.doCollapse();

    // --- World ---
    this.tilemapManager = new TilemapManager(this);
    this.plotRenderer = new PlotRenderer(this);
    this.loadCurrentRegion(save?.world.playerPosition);

    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y);
    this.player.sprite.setDepth(10);
    this.setupColliders();

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);

    this.nightOverlay = this.add.rectangle(0, 0, 4000, 4000, 0x0a1030, 0)
      .setScrollFactor(0).setDepth(500).setOrigin(0.5);
    this.nightOverlay.setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2);

    this.setupMobileControls();
    this.setupKeyboard();

    this.input.on('pointerdown', (pointer: any) => {
      if (pointer.x > this.cameras.main.width * 0.5 && pointer.y < this.cameras.main.height - 150) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.setTouchTarget(new Phaser.Math.Vector2(worldPoint.x, worldPoint.y));
      }
    });

    EventBus.on(Events.FARM_PLOT_CHANGED, this.onPlotsChanged, this);
    this.onPlotsChanged(this.farming.getAllPlots());
    EventBus.on(Events.INVENTORY_CHANGED, this.syncInventoryToSave, this);
    EventBus.on(Events.REGION_DISCOVERED, this.onRegionDiscovered, this);
    EventBus.on(Events.SHOP_CLOSED, this.onShopClosed, this);
    EventBus.on(Events.DIALOGUE_CLOSED, this.onDialogueClosed, this);
    EventBus.on(Events.QUEST_LOG_CLOSED, this.onQuestLogClosed, this);
    EventBus.on(Events.CRAFTING_CLOSED, this.onCraftingClosed, this);
    EventBus.on(Events.FESTIVAL_CLOSED, this.onFestivalClosed, this);
    EventBus.on(Events.VILLAGE_CLOSED, this.onVillageClosed, this);
    EventBus.on(Events.QUEST_COMPLETED, this.onQuestCompleted, this);
    EventBus.on(Events.GOLD_CHANGED, this.syncGoldToSave, this);

    saveManager.startAutosave();
    Logger.info('GameScene: Ready');
  }

  // ---------- World ----------

  private loadCurrentRegion(savedPos?: { x: number; y: number }): void {
    const region = this.regionManager.getCurrentRegion();
    this.tilemapManager.loadRegion(region.id);

    const collisionLayer = this.tilemapManager.getCollisionLayer();
    if (collisionLayer) collisionLayer.setCollisionByExclusion([0]);

    // Biome tint: subtly tint ground toward the region's palette
    const ground = this.tilemapManager.getGroundLayer();
    if (ground) {
      ground.setTint(Phaser.Display.Color.HexStringToColor(region.backgroundColor).color);
    }

    this.spawnTrees();
    if (region.hasFarmhouse) this.spawnHouse();
    else this.structures = null;

    if (region.hasShop) this.spawnShopStall();
    else if (this.shopStall) { this.shopStall.destroy(true); this.shopStall = null; }

    this.spawnPortals();
    this.spawnRocks();
    this.spawnWildlife();
    this.spawnMonsters();
    this.spawnAnimalPen();
    this.spawnNPCs();

    this.cameras.main.setBounds(0, 0, region.mapWidth * GAME_CONFIG.TILE_SIZE, region.mapHeight * GAME_CONFIG.TILE_SIZE);

    if (savedPos && this.savedRegionId === region.id) {
      this.spawnPoint = savedPos;
    } else {
      this.spawnPoint = region.spawnDefault;
    }
  }

  private setupColliders(): void {
    const collisionLayer = this.tilemapManager.getCollisionLayer();
    if (collisionLayer) this.physics.add.collider(this.player.sprite, collisionLayer);
    if (this.trees) this.physics.add.collider(this.player.sprite, this.trees);
    if (this.structures) this.physics.add.collider(this.player.sprite, this.structures);
  }

  private spawnTrees(): void {
    if (this.trees) { this.trees.clear(true, true); }
    this.treeNodes = [];
    this.trees = this.physics.add.staticGroup();
    const region = this.regionManager.getCurrentRegion();
    const mapW = region.mapWidth * GAME_CONFIG.TILE_SIZE;
    const mapH = region.mapHeight * GAME_CONFIG.TILE_SIZE;
    const count = Math.floor(region.treeDensity * 80);

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(50, mapW - 50);
      const y = Phaser.Math.Between(50, mapH - 50);
      if (Math.abs(x - mapW / 2) < 40 || Math.abs(y - mapH / 2) < 40) continue;
      if (region.hasFarmhouse && Math.abs(x - this.housePos.x) < 60 && Math.abs(y - this.housePos.y) < 60) continue;
      const tree = this.trees.create(x, y, 'tree_oak');
      tree.setSize(16, 8);
      tree.setOffset(4, 24);
      const node = this.loggingSystem.plant(region.id);
      node.growth = 1; // existing full-size trees start mature
      this.treeNodes.push({ sprite: tree, treeId: node.id });
    }
  }

  private spawnHouse(): void {
    this.structures = this.physics.add.staticGroup();
    const house = this.structures.create(this.housePos.x, this.housePos.y, 'house_farm');
    house.setSize(44, 12);
    house.setOffset(2, 28);
    // kitchen/workbench station marker beside the house
    if (!this.textures.exists('station_mark')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x8a5a2a, 1); g.fillRect(2, 8, 20, 12);
      g.fillStyle(0xd9a04a, 1); g.fillRect(0, 0, 24, 8);
      g.fillStyle(0x4a2a1a, 1); g.fillRect(4, 10, 16, 3);
      g.generateTexture('station_mark', 24, 20);
      g.destroy();
    }
    this.add.image(this.stationPos.x, this.stationPos.y, 'station_mark').setDepth(5);
  }

  private spawnPortals(): void {
    for (const p of this.portals) { p.zone.destroy(); p.sign.destroy(); }
    this.portals = [];

    for (const r of this.rocks) r.sprite.destroy();
    this.rocks = [];
    const region = this.regionManager.getCurrentRegion();
    const MAP = region.mapWidth * GAME_CONFIG.TILE_SIZE;
    const T = GAME_CONFIG.TILE_SIZE;
    const posFor = (dir: RegionExit['direction']) => {
      switch (dir) {
        case 'north': return { x: MAP / 2, y: 2 * T };
        case 'south': return { x: MAP / 2, y: MAP - 2 * T };
        case 'east': return { x: MAP - 2 * T, y: MAP / 2 };
        case 'west': return { x: 2 * T, y: MAP / 2 };
      }
    };

    for (const exit of region.exits) {
      const pos = posFor(exit.direction);
      const zone = this.add.zone(pos.x, pos.y, 40, 40);
      this.physics.add.existing(zone);
      (zone.body as any).setSize(40, 40);
      const sign = this.add.image(pos.x, pos.y, 'tree_oak')
        .setTint(0xd9a04a).setScale(0.5).setDepth(5);
      this.portals.push({ exit, zone, sign });
    }
  }

  // ---------- Shop ----------

  private shopPos = { x: 420, y: 560 };

  private spawnShopStall(): void {
    if (!this.textures.exists('shop_stall')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x8a5a2a, 1); g.fillRect(0, 12, 40, 20);
      g.fillStyle(0xd94a4a, 1); g.fillRect(0, 0, 40, 8);
      g.fillStyle(0xffffff, 1); g.fillRect(10, 0, 10, 8); g.fillRect(30, 0, 10, 8);
      g.fillStyle(0xf0d040, 1); g.fillRect(6, 16, 8, 6);
      g.fillStyle(0x4a90d9, 1); g.fillRect(20, 16, 8, 6);
      g.fillStyle(0x4ad94a, 1); g.fillRect(32, 16, 6, 6);
      g.generateTexture('shop_stall', 40, 32);
      g.destroy();
    }
    this.shopStall = this.add.container(this.shopPos.x, this.shopPos.y, [
      this.add.image(0, 0, 'shop_stall')
    ]).setDepth(5);
  }

  private isNearShop(): boolean {
    if (!this.regionManager.getCurrentRegion().hasShop || !this.shopStall) return false;
    const p = this.player.getPosition();
    const dx = p.x - this.shopPos.x;
    const dy = p.y - this.shopPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 30;
  }

  private openShop(): void {
    this.scene.launch('ShopScene', { shop: VILLAGE_SHOP });
    this.scene.pause('GameScene');
  }

  private onShopClosed(): void {
    this.scene.resume('GameScene');
    this.syncGoldToSave();
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    sm.save('auto');
    this.contextTimer = 999;
  }

  private syncGoldToSave(): void {
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    sm.updateSave(s => { s.player.gold = this.economy.getGold(); });
  }

  // ---------- Logging & Wildlife ----------

  private getFacingTree(): { sprite: any; treeId: string } | null {
    const pos = this.player.getPosition();
    const dir = this.player.getDirection();
    let fx = pos.x, fy = pos.y;
    const step = GAME_CONFIG.TILE_SIZE * 1.5;
    if (dir === 'left') fx -= step;
    if (dir === 'right') fx += step;
    if (dir === 'up') fy -= step;
    if (dir === 'down') fy += step;
    for (const t of this.treeNodes) {
      if (Math.abs(t.sprite.x - fx) < 20 && Math.abs(t.sprite.y - fy) < 26) return t;
    }
    return null;
  }

  private chopFacingTree(): void {
    const node = this.getFacingTree();
    if (!node) return;
    const result = this.loggingSystem.chop(node.treeId);
    this.flashPlayer(0xd9a04a);
    if (result.depleted) {
      node.sprite.setVisible(false);
      const parts: string[] = [];
      for (const d of result.drops) {
        this.inventory.add(d.itemId, d.quantity);
        parts.push(`+${d.quantity} ${ITEMS[d.itemId]?.name ?? d.itemId}`);
      }
      this.showFloatText(node.sprite.x, node.sprite.y - 20, parts.join('  '));
      this.questSystem.notify('chop', result.drops.reduce((s, d) => s + (d.itemId.startsWith('wood_') ? d.quantity : 0), 0));
      this.syncInventoryToSave();
    }
  }

  private spawnWildlife(): void {
    for (const w of this.wildlifeSprites) w.sprite.destroy();
    this.wildlifeSprites = [];
    const spawns = this.wildlifeSystem.populate(this.regionManager.getCurrentRegionId(), this.timeSystem.isNight(), 3);
    if (!this.textures.exists('wild_dot')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1); g.fillCircle(6, 6, 6);
      g.generateTexture('wild_dot', 12, 12);
      g.destroy();
    }
    const colors: Record<string, number> = { meadowhare: 0xc0a880, duskbird: 0x9a6ad9, bristleboar: 0x6a4a3a, emberfox: 0xe87a3a };
    for (const s of spawns) {
      const sprite = this.add.image(s.x, s.y, 'wild_dot')
        .setTint(colors[s.speciesId] ?? 0xffffff).setDepth(6);
      this.wildlifeSprites.push({ sprite, spawn: s });
    }
  }

  private observeWildlife(): void {
    const pos = this.player.getPosition();
    for (const w of this.wildlifeSprites) {
      const dx = w.sprite.x - pos.x, dy = w.sprite.y - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 48 && !w.spawn.fled) {
        const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
        let first = false;
        sm.updateSave(s => {
          first = WildlifeSystem.observe(s.journal.wildlifeSeen, w.spawn.speciesId);
        });
        const name = WILDLIFE[w.spawn.speciesId]?.name ?? 'creature';
        this.showFloatText(w.sprite.x, w.sprite.y - 14, first ? `${name} — journal updated!` : `${name} (already logged)`);
        return;
      }
    }
    this.showFloatText(pos.x, pos.y - 24, 'Nothing nearby to observe.');
  }

  // ---------- NPCs ----------

  private spawnNPCs(): void {
    for (const n of this.npcSprites) n.sprite.destroy();
    this.npcSprites = [];
    if (this.regionManager.getCurrentRegionId() !== 'village') return;
    if (!this.textures.exists('npc_dot')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1); g.fillRect(3, 0, 10, 5);
      g.fillStyle(0xffffff, 1); g.fillRect(2, 5, 12, 9);
      g.generateTexture('npc_dot', 16, 14);
      g.destroy();
    }
    for (const npc of this.npcSystem.allNPCs()) {
      const loc = this.npcSystem.currentLocation(
        npc.id, this.timeSystem.getTimeMinutes(), this.timeSystem.getSeason());
      if (!loc) continue;
      const anchor = VILLAGE_ANCHORS[loc];
      if (!anchor) continue;
      const sprite = this.add.image(anchor.x, anchor.y, 'npc_dot')
        .setTint(npc.color).setDepth(8);
      this.npcSprites.push({ sprite, npcId: npc.id });
    }
  }

  private nearestNPC(): { sprite: any; npcId: string } | null {
    const pos = this.player.getPosition();
    let best: any = null, bestD = 36;
    for (const n of this.npcSprites) {
      const d = Math.sqrt((n.sprite.x - pos.x) ** 2 + (n.sprite.y - pos.y) ** 2);
      if (d < bestD) { best = n; bestD = d; }
    }
    return best;
  }

  private talkToNPC(): void {
    const node = this.nearestNPC();
    if (!node) return;
    const npc = NPCS[node.npcId];
    if (!npc) return;
    this.npcSystem.talk(node.npcId);           // daily friendship + first-meet
    const mood = ResonanceSystem.effects(this.resonanceSystem.get('village')).npcMoodBonus;
    if (mood > 1) this.relationshipSystem.addFriendship(node.npcId, mood);
    this.questSystem.notify('talk', 1, { npcId: node.npcId });
    this.scene.launch('DialogueScene', {
      npcId: node.npcId,
      relationship: this.relationshipSystem
    });
    this.scene.pause('GameScene');
  }

  private onDialogueClosed(data: { npcId: string; friendshipGained: number }): void {
    this.scene.resume('GameScene');
    if (data.friendshipGained > 0) {
      this.relationshipSystem.addFriendship(data.npcId, data.friendshipGained);
      this.npcSystem.giveGift(data.npcId, ''); // no-op keeps API warm
      const total = this.relationshipSystem.getState(data.npcId)?.friendship ?? 0;
      this.npcSystem.giveGift(data.npcId, 'neutral_refresh');
      const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
      sm.updateSave(s => {
        if (s.npcs[data.npcId]) s.npcs[data.npcId].friendship = total;
      });
    }
    this.syncNPCsToSave();
    this.contextTimer = 999;
  }

  // ---------- Eating & Stations ----------

  private firstFood(): string | null {
    for (const s of this.inventory.getStacks()) {
      if (s.itemId.startsWith('food_')) return s.itemId;
    }
    return null;
  }

  private eatFood(): void {
    const foodId = this.firstFood();
    if (!foodId) return;
    const { CraftingSystem } = require('../systems/CraftingSystem');
    const { RECIPES } = require('../data/recipes/recipes');
    const recipe = Object.values(RECIPES).find((r: any) => r.outputItemId === foodId);
    const fx = CraftingSystem.eat((recipe as any)?.effects, {
      feed: (n: number) => this.needs.feed(n),
      drink: (n: number) => this.needs.drink(n),
      heal: (n: number) => this.needs.heal(n),
      energize: (n: number) => this.needs.energize(n)
    });
    this.inventory.remove(foodId, 1);
    const parts: string[] = [];
    if (fx.hunger) parts.push(`+${fx.hunger} food`);
    if (fx.thirst) parts.push(`+${fx.thirst} drink`);
    if (fx.health) parts.push(`+${fx.health} hp`);
    if (fx.stamina) parts.push(`+${fx.stamina} st`);
    this.showFloatText(this.player.sprite.x, this.player.sprite.y - 26, parts.join(' ') || 'Yum!');
    this.flashPlayer(0xd9a04a);
    this.syncInventoryToSave();
    this.syncNeedsToSave();
    this.contextTimer = 999;
  }

  private stationPos = { x: 470, y: 300 }; // beside the farmhouse

  private stationType(): 'kitchen' | 'workbench' {
    return 'kitchen';
  }

  private isNearStation(): boolean {
    if (!this.regionManager.getCurrentRegion().hasFarmhouse) return false;
    const p = this.player.getPosition();
    return Math.sqrt((p.x - this.stationPos.x) ** 2 + (p.y - this.stationPos.y) ** 2) < 26;
  }

  private openStation(): void {
    this.scene.launch('CraftingScene', { station: 'kitchen' });
    this.scene.pause('GameScene');
  }

  private onCraftingClosed(): void {
    this.scene.resume('GameScene');
    this.syncInventoryToSave();
    this.syncNeedsToSave();
    this.contextTimer = 999;
  }

  /** Cheap weather particles: rain streaks or snow flakes above the player. */
  private updatePrecipitation(): void {
    const wx = this.weatherSystem.getCurrent();
    const rainy = wx === 'rain' || wx === 'heavy_rain' || wx === 'storm';
    const snowy = wx === 'snow';
    if (!rainy && !snowy) {
      for (const p of this.precipParticles) p.destroy();
      this.precipParticles = [];
      return;
    }
    if (this.precipParticles.length > 0) return; // already running
    const count = rainy ? (wx === 'storm' ? 40 : 25) : 20;
    for (let i = 0; i < count; i++) {
      const dot = this.add.rectangle(
        this.player.sprite.x + (Math.random() - 0.5) * 320,
        this.player.sprite.y + (Math.random() - 0.5) * 240,
        rainy ? 1 : 2, rainy ? 6 : 2,
        rainy ? 0x8ab8e8 : 0xffffff, rainy ? 0.6 : 0.9
      ).setDepth(450);
      (dot as any).isSnow = snowy;
      this.precipParticles.push(dot);
    }
  }

  private checkPOIs(): void {
    const regionId = this.regionManager.getCurrentRegionId();
    const pos = this.player.getPosition();
    for (const poi of poisForRegion(regionId)) {
      if (this.foundPOIs.includes(poi.id)) continue;
      const d = Math.sqrt((poi.x - pos.x) ** 2 + (poi.y - pos.y) ** 2);
      if (d < 24) {
        if (poi.minResonance && this.resonanceSystem.get(regionId) < poi.minResonance) {
          this.showFloatText(poi.x, poi.y - 18, `🔒 ${poi.hint}`);
          continue;
        }
        this.foundPOIs.push(poi.id);
        this.inventory.add(poi.rewardItem, poi.rewardQty);
        this.showFloatText(poi.x, poi.y - 18, `✨ Found: ${poi.rewardQty}x ${ITEMS[poi.rewardItem]?.name ?? poi.rewardItem}!`);
        this.questSystem.notify('discover', 1);
        this.syncInventoryToSave();
      }
    }
  }

  private isAtPlaza(): boolean {
    if (this.regionManager.getCurrentRegionId() !== 'village') return false;
    const p = this.player.getPosition();
    return Math.sqrt((p.x - 512) ** 2 + (p.y - 512) ** 2) < 80;
  }

  private openFestival(): void {
    const fest = this.festivalSystem.isFestivalDay(this.timeSystem.getDay(), this.timeSystem.getSeason());
    if (!fest) return;
    this.scene.launch('FestivalScene', { festival: fest });
    this.scene.pause('GameScene');
  }

  private noticeBoardPos = { x: 512, y: 440 }; // plaza north edge

  private isAtNoticeBoard(): boolean {
    if (this.regionManager.getCurrentRegionId() !== 'village') return false;
    const p = this.player.getPosition();
    return Math.sqrt((p.x - this.noticeBoardPos.x) ** 2 + (p.y - this.noticeBoardPos.y) ** 2) < 26;
  }

  private openVillage(): void {
    this.scene.launch('VillageScene');
    this.scene.pause('GameScene');
  }

  private onVillageClosed(): void {
    this.scene.resume('GameScene');
    this.syncInventoryToSave();
    this.syncGoldToSave();
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    sm.updateSave(s => { s.world.villageDevelopment = this.villageSystem.serialize() as any; });
  }

  private onFestivalClosed(): void {
    this.scene.resume('GameScene');
    this.syncInventoryToSave();
    this.syncGoldToSave();
  }

  private onQuestLogClosed(): void {
    this.scene.resume('GameScene');
    this.syncQuestsToSave();
  }

  private onQuestCompleted(data: { title: string }): void {
    this.showFloatText(this.player.sprite.x, this.player.sprite.y - 40, `Quest complete: ${data.title}!`);
  }

  private syncQuestsToSave(): void {
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    const data = this.questSystem.serialize();
    sm.updateSave(s => {
      s.quests.active = data.active;
      s.quests.completed = data.turnedIn;
    });
  }

  private syncNPCsToSave(): void {
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    sm.updateSave(s => { s.npcs = this.npcSystem.serialize(); });
  }

  // ---------- Farm Animals ----------

  private spawnAnimalPen(): void {
    for (const a of this.animalSprites) a.sprite.destroy();
    this.animalSprites = [];
    if (!this.regionManager.getCurrentRegion().hasFarmhouse) return;
    if (!this.textures.exists('animal_dot')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1); g.fillRect(1, 3, 14, 10);
      g.fillStyle(0x000000, 1); g.fillRect(3, 6, 2, 2); g.fillRect(9, 6, 2, 2);
      g.generateTexture('animal_dot', 16, 14);
      g.destroy();
    }
    // pen fence visual
    this.add.rectangle(this.penPos.x, this.penPos.y, 120, 4, 0x8a5a2a).setDepth(4);
    this.add.rectangle(this.penPos.x, this.penPos.y + 60, 120, 4, 0x8a5a2a).setDepth(4);
    this.add.rectangle(this.penPos.x - 60, this.penPos.y + 30, 4, 64, 0x8a5a2a).setDepth(4);
    this.add.rectangle(this.penPos.x + 60, this.penPos.y + 30, 4, 64, 0x8a5a2a).setDepth(4);

    this.animalSystem.getAll().forEach((a, i) => {
      const sp = ANIMAL_SPECIES[a.speciesId];
      const sprite = this.add.image(this.penPos.x - 30 + (i % 3) * 30, this.penPos.y + 15 + Math.floor(i / 3) * 24, 'animal_dot')
        .setTint(sp.color).setDepth(6);
      this.animalSprites.push({ sprite, animalId: a.id });
    });
  }

  private nearestAnimal(): { sprite: any; animalId: string } | null {
    const pos = this.player.getPosition();
    let best: any = null, bestD = 40;
    for (const a of this.animalSprites) {
      const d = Math.sqrt((a.sprite.x - pos.x) ** 2 + (a.sprite.y - pos.y) ** 2);
      if (d < bestD) { best = a; bestD = d; }
    }
    return best;
  }

  private careAnimal(): void {
    const node = this.nearestAnimal();
    if (!node) return;
    const a = this.animalSystem.get(node.animalId);
    if (!a) return;
    let r;
    if (a.hunger < 40) {
      if (this.inventory.count('animal_feed') < 1) {
        this.showFloatText(node.sprite.x, node.sprite.y - 14, 'No feed! Buy at the shop.');
        return;
      }
      this.inventory.remove('animal_feed', 1);
      r = this.animalSystem.feed(a.id);
    } else if (a.cleanliness < 40) {
      r = this.animalSystem.clean(a.id);
    } else {
      r = this.animalSystem.pet(a.id);
    }
    this.showFloatText(node.sprite.x, node.sprite.y - 14, r.message);
    this.flashPlayer(0xf0d040);
    this.syncAnimalsToSave();
  }

  private syncAnimalsToSave(): void {
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    sm.updateSave(s => { s.farm.animals = this.animalSystem.serialize(); });
  }

  // ---------- Combat ----------

  private spawnMonsters(): void {
    for (const mo of this.monsters) mo.sprite.destroy();
    this.monsters = [];
    const list = CombatSystem.spawn(this.regionManager.getCurrentRegionId(), this.timeSystem.isNight());
    if (!this.textures.exists('monster_dot')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1); g.fillRect(0, 2, 14, 12);
      g.fillStyle(0x000000, 1); g.fillRect(3, 5, 3, 3); g.fillRect(9, 5, 3, 3);
      g.generateTexture('monster_dot', 14, 14);
      g.destroy();
    }
    for (const m of list) {
      const data = CombatSystem.data(m);
      const sprite = this.add.image(m.x, m.y, 'monster_dot')
        .setTint(data.color).setDepth(7);
      this.monsters.push({ sprite, m });
    }
  }

  private attackFacing(): void {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = 0.5; // seconds between swings
    this.flashPlayer(0xff6a6a);
    const pos = this.player.getPosition();
    const dir = this.player.getDirection();
    const range = 22;
    let tx = pos.x, ty = pos.y;
    if (dir === 'left') tx -= range; if (dir === 'right') tx += range;
    if (dir === 'up') ty -= range; if (dir === 'down') ty += range;

    for (const mo of this.monsters) {
      if (!mo.m.alive) continue;
      const dx = mo.m.x - tx, dy = mo.m.y - ty;
      if (Math.sqrt(dx * dx + dy * dy) < 18) {
        const result = CombatSystem.attack(mo.m, 10);
        mo.sprite.setTintFill(0xffffff);
        this.time.delayedCall(80, () => mo.m.alive ? mo.sprite.setTint(MONSTERS[mo.m.speciesId].color) : null);
        if (result.killed) {
          mo.sprite.destroy();
          const drops = this.combatSystem.rollDrops(mo.m);
          const parts: string[] = [];
          for (const d of drops) {
            this.inventory.add(d.itemId, d.quantity);
            parts.push(`+${d.quantity} ${ITEMS[d.itemId]?.name ?? d.itemId}`);
          }
          this.showFloatText(mo.m.x, mo.m.y - 14, parts.length ? parts.join('  ') : 'Defeated!');
          this.syncInventoryToSave();
        }
        return;
      }
    }
  }

  private updateMonsters(delta: number): void {
    const pos = this.player.getPosition();
    for (const mo of this.monsters) {
      if (!mo.m.alive) continue;
      const dmg = this.combatSystem.tick(mo.m, pos.x, pos.y, delta);
      mo.sprite.setPosition(mo.m.x, mo.m.y);
      if (dmg > 0) {
        this.needs.state.health = Math.max(0, this.needs.state.health - dmg);
        this.flashPlayer(0xd94a4a);
        this.showFloatText(pos.x, pos.y - 26, `-${dmg} HP`);
        this.syncNeedsToSave();
      }
    }
  }

  // ---------- Mining ----------

  private spawnRocks(): void {
    const table = REGION_ROCKS[this.regionManager.getCurrentRegionId()];
    if (!table) return;
    const region = this.regionManager.getCurrentRegion();
    const mapW = region.mapWidth * GAME_CONFIG.TILE_SIZE;
    const mapH = region.mapHeight * GAME_CONFIG.TILE_SIZE;

    if (!this.textures.exists('rock_node')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x6a6a72, 1); g.fillRect(2, 6, 20, 14);
      g.fillStyle(0x8a8a92, 1); g.fillRect(5, 2, 12, 10);
      g.fillStyle(0xffffff, 0.25); g.fillRect(6, 3, 5, 3);
      g.generateTexture('rock_node', 24, 22);
      g.destroy();
    }

    for (let i = 0; i < 14; i++) {
      const typeId = MiningSystem.rollRockType(table)!;
      const x = Phaser.Math.Between(60, mapW - 60);
      const y = Phaser.Math.Between(60, mapH - 60);
      if (Math.abs(x - mapW / 2) < 48 && Math.abs(y - mapH / 2) < 48) continue;
      const sprite = this.add.image(x, y, 'rock_node')
        .setTint(ROCK_TYPES[typeId].color).setDepth(4);
      this.rocks.push({ sprite, typeId, hp: MiningSystem.maxHp(typeId) });
    }
  }

  private getFacingRock(): { sprite: any; typeId: string; hp: number } | null {
    const pos = this.player.getPosition();
    const dir = this.player.getDirection();
    let fx = pos.x, fy = pos.y;
    const step = GAME_CONFIG.TILE_SIZE;
    if (dir === 'left') fx -= step;
    if (dir === 'right') fx += step;
    if (dir === 'up') fy -= step;
    if (dir === 'down') fy += step;
    for (const r of this.rocks) {
      if (Math.abs(r.sprite.x - fx) < 16 && Math.abs(r.sprite.y - fy) < 16) return r;
    }
    return null;
  }

  private mineFacingRock(): void {
    const rock = this.getFacingRock();
    if (!rock) return;
    const result = this.miningSystem.hit(rock, 'tool_pickaxe');
    this.flashPlayer(0xd9a04a);
    rock.sprite.setAlpha(0.4 + 0.6 * (rock.hp / MiningSystem.maxHp(rock.typeId)));
    if (result.depleted) {
      const rx = rock.sprite.x, ry = rock.sprite.y;
      rock.sprite.destroy();
      this.rocks = this.rocks.filter(r => r !== rock);
      const parts: string[] = [];
      for (const d of result.drops) {
        this.inventory.add(d.itemId, d.quantity);
        parts.push(`+${d.quantity} ${ITEMS[d.itemId]?.name ?? d.itemId}`);
      }
      this.showFloatText(rx, ry - 16, parts.join('  '));
      this.questSystem.notify('mine', result.drops.reduce((s, d) => s + (d.itemId.startsWith('ore_') ? d.quantity : 0), 0));
      this.syncInventoryToSave();
    }
  }

  // ---------- Region travel ----------

  private tryPortalTravel(): void {
    if (this.isTransitioning) return;
    const p = this.player.getPosition();
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    const save = sm.getCurrentSave();
    if (!save) return;

    for (const portal of this.portals) {
      const dx = p.x - portal.zone.x;
      const dy = p.y - portal.zone.y;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
        const check = this.regionManager.travel(portal.exit, save);
        if (!check.allowed) {
          this.showFloatText(p.x, p.y - 24, check.reason ?? 'Blocked.');
          const dir = portal.exit.direction;
          const push = 48;
          if (dir === 'north') this.player.setPosition(p.x, p.y + push);
          if (dir === 'south') this.player.setPosition(p.x, p.y - push);
          if (dir === 'east') this.player.setPosition(p.x - push, p.y);
          if (dir === 'west') this.player.setPosition(p.x + push, p.y);
          return;
        }
        this.doRegionTransition();
        return;
      }
    }
  }

  private doRegionTransition(): void {
    this.isTransitioning = true;
    const ev = this.regionManager.getCurrentRegion();
    this.fadeTransition(() => {
      if (this.trees) { this.trees.clear(true, true); this.trees = null; }
      if (this.structures) { this.structures.clear(true, true); this.structures = null; }
      this.plotRenderer.clear();
      for (const p of this.portals) { p.zone.destroy(); p.sign.destroy(); }
      this.portals = [];

      this.savedRegionId = this.regionManager.getCurrentRegionId();
      this.loadCurrentRegion();
      this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
      this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
      this.setupColliders();
      this.onPlotsChanged(this.farming.getAllPlots());

      const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
      sm.save('auto');
      this.showFloatText(this.player.sprite.x, this.player.sprite.y - 24, ev.name);
      this.isTransitioning = false;
    });
  }

  private onRegionDiscovered(data: { name: string }): void {
    this.showFloatText(this.player.sprite.x, this.player.sprite.y - 40, `Discovered: ${data.name}`);
  }

  // ---------- Controls ----------

  private setupMobileControls(): void {
    const cam = this.cameras.main;
    const isMobile = !this.sys.game.device.os.desktop;
    const btnY = cam.height - 80;
    const rightX = cam.width - 60;
    const alpha = isMobile ? 0.85 : 0.4;

    if (isMobile) {
      this.joystick = new VirtualJoystick(this);
      this.joystick.onChange = (v) => this.player.setJoystickVector(v);
    }

    this.interactBtn = new ActionButton(this, rightX - 140, btnY, 'btn_action', 'ACT');
    this.interactBtn.onPress = () => this.executeContext();
    this.interactBtn.button.setAlpha(alpha);

    this.attackBtn = new ActionButton(this, rightX - 70, btnY - 40, 'btn_attack', 'ATK');
    this.attackBtn.onPress = () => this.tryAttack();
    this.attackBtn.button.setAlpha(alpha);

    this.dodgeBtn = new ActionButton(this, rightX, btnY, 'btn_dodge', 'ROLL');
    this.dodgeBtn.onPress = () => this.tryDodge();
    this.dodgeBtn.button.setAlpha(alpha);

    EventBus.emit(Events.TOOL_CHANGED, this.currentTool);
  }

  private setupKeyboard(): void {
    if (!this.input.keyboard) return;
    this.input.keyboard.on('keydown-E', () => this.executeContext());
    this.input.keyboard.on('keydown-SPACE', () => this.executeContext());
    this.input.keyboard.on('keydown-F', () => this.tryAttack());
    this.input.keyboard.on('keydown-SHIFT', () => this.tryDodge());
    this.input.keyboard.on('keydown-Q', () => this.cycleTool(1));
    this.input.keyboard.on('keydown-ONE', () => this.setTool('hand'));
    this.input.keyboard.on('keydown-TWO', () => this.setTool('hoe'));
    this.input.keyboard.on('keydown-THREE', () => this.setTool('can'));
    this.input.keyboard.on('keydown-FOUR', () => this.setTool('rod'));
    this.input.keyboard.on('keydown-FIVE', () => this.setTool('pickaxe'));
    this.input.keyboard.on('keydown-T', () => this.timeSystem.debugAddMinutes(60));
    this.input.keyboard.on('keydown-Y', () => {
      this.needs.feed(50); this.needs.drink(50);
      this.showFloatText(this.player.sprite.x, this.player.sprite.y - 24, 'Ate & drank (debug)');
    });
    this.input.keyboard.on('keydown-J', () => {
      if (!this.scene.isActive('QuestScene')) {
        this.scene.launch('QuestScene');
        this.scene.pause('GameScene');
      }
    });
    this.input.keyboard.on('keydown-B', () => {
      const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
      sm.updateSave(s => { if (!s.world.bridgesBuilt.includes('river_bridge')) s.world.bridgesBuilt.push('river_bridge'); });
      this.showFloatText(this.player.sprite.x, this.player.sprite.y - 24, 'Bridge repaired (debug)');
    });
  }

  private cycleTool(dir: 1 | -1): void {
    const tools: Tool[] = ['hand', 'hoe', 'can', 'rod', 'pickaxe'];
    const idx = tools.indexOf(this.currentTool);
    this.setTool(tools[(idx + dir + tools.length) % tools.length]);
  }

  private setTool(tool: Tool): void {
    this.currentTool = tool;
    EventBus.emit(Events.TOOL_CHANGED, tool);
    this.contextTimer = 999;
  }

  // ---------- Interaction ----------

  private isNearBed(): boolean {
    if (!this.regionManager.getCurrentRegion().hasFarmhouse) return false;
    const p = this.player.getPosition();
    const dx = p.x - this.bedPos.x;
    const dy = p.y - this.bedPos.y;
    return Math.sqrt(dx * dx + dy * dy) < 22;
  }

  private getFacingTile(): { tx: number; ty: number } {
    const pos = this.player.getPosition();
    const dir = this.player.getDirection();
    let fx = pos.x, fy = pos.y;
    const step = GAME_CONFIG.TILE_SIZE;
    if (dir === 'left') fx -= step;
    if (dir === 'right') fx += step;
    if (dir === 'up') fy -= step;
    if (dir === 'down') fy += step;
    return { tx: Math.floor(fx / step), ty: Math.floor(fy / step) };
  }

  private canTill(tx: number, ty: number): boolean {
    if (!this.regionManager.getCurrentRegion().farmable) return false;
    const ground = this.tilemapManager.getGroundLayer();
    if (!ground) return false;
    const tile = ground.getTileAt(tx, ty);
    if (!tile || (tile.index !== 0 && tile.index !== 3)) return false;
    const wx = tx * GAME_CONFIG.TILE_SIZE + 8;
    const wy = ty * GAME_CONFIG.TILE_SIZE + 8;
    if (this.trees) {
      for (const child of this.trees.getChildren()) {
        const obj = child as unknown as { x: number; y: number };
        if (Math.abs(obj.x - wx) < 14 && Math.abs(obj.y - wy) < 22) return false;
      }
    }
    return true;
  }

  private isFacingWater(): boolean {
    const { tx, ty } = this.getFacingTile();
    const ground = this.tilemapManager.getGroundLayer();
    if (!ground) return false;
    const tile = ground.getTileAt(tx, ty);
    return !!tile && tile.index === 1;
  }

  private resolveAction(): ContextAction | null {
    if (this.fishing.active) return { label: 'NOW!', action: 'fish', tx: -1, ty: -1 };
    if (this.isNearBed()) return { label: 'SLEEP', action: 'sleep', tx: -1, ty: -1 };
    if (this.isNearShop()) return { label: 'SHOP', action: 'shop', tx: -1, ty: -1 };
    const { tx, ty } = this.getFacingTile();

    if ((this.currentTool === 'rod' || this.currentTool === 'hand') && this.isFacingWater()) {
      return { label: 'FISH', action: 'fish', tx, ty };
    }
    if (this.currentTool === 'pickaxe') {
      const rock = this.getFacingRock();
      if (rock) return { label: 'MINE', action: 'mine', tx, ty };
    }
    if (this.nearestNPC()) return { label: 'TALK', action: 'talk', tx, ty };
    if (this.getFacingTree()) return { label: 'CHOP', action: 'chop', tx, ty };
    if (this.nearestAnimal()) {
      const a = this.animalSystem.get(this.nearestAnimal()!.animalId)!;
      if (a.hunger < 40) return { label: 'FEED', action: 'animal', tx, ty };
      if (a.cleanliness < 40) return { label: 'CLEAN', action: 'animal', tx, ty };
      return { label: 'PET', action: 'animal', tx, ty };
    }
    const fest = this.festivalSystem.isFestivalDay(this.timeSystem.getDay(), this.timeSystem.getSeason());
    if (fest && this.isAtPlaza()) return { label: '🎉 FESTIVAL', action: 'festival', tx, ty };
    if (this.isAtNoticeBoard()) return { label: '📋 PROJECTS', action: 'village', tx, ty };
    if (this.isNearStation()) return { label: this.stationType() === 'kitchen' ? 'COOK' : 'CRAFT', action: 'station', tx, ty };
    if (this.currentTool === 'hand' && this.firstFood()) return { label: 'EAT', action: 'eat', tx, ty };
    if (this.currentTool === 'hand') {
      const p = this.player.getPosition();
      for (const w of this.wildlifeSprites) {
        if (w.spawn.fled) continue;
        const dx = w.sprite.x - p.x, dy = w.sprite.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 48) {
          return { label: 'OBSERVE', action: 'observe', tx, ty };
        }
      }
    }

    if (this.currentTool === 'hoe' && this.canTill(tx, ty) && !this.farming.getPlot(tx, ty)) {
      return { label: 'TILL', action: 'till', tx, ty };
    }
    if (this.currentTool === 'can') {
      const plot = this.farming.getPlot(tx, ty);
      if (plot?.cropId && !plot.watered && !this.farming.isMature(plot)) {
        return { label: 'WATER', action: 'water', tx, ty };
      }
    }
    const ctx = this.farming.getContext(tx, ty);
    if (ctx === 'till') {
      if (!this.canTill(tx, ty)) return null;
      return { label: 'TILL', action: 'till', tx, ty };
    }
    if (ctx === 'plant') return { label: 'PLANT', action: 'plant', tx, ty };
    if (ctx === 'water') return { label: 'WATER', action: 'water', tx, ty };
    if (ctx === 'harvest') return { label: 'HARVEST', action: 'harvest', tx, ty };
    return null;
  }

  private executeContext(): void {
    const ctx = this.contextAction ?? this.resolveAction();
    if (!ctx) { this.flashPlayer(0x888888); return; }
    if (ctx.action === 'sleep') { this.doSleep(); return; }
    if (ctx.action === 'shop') { this.openShop(); return; }
    if (ctx.action === 'fish') {
      if (this.fishing.active) this.resolveFishingAttempt();
      else this.startFishing();
      return;
    }
    if (ctx.action === 'mine') { this.mineFacingRock(); return; }
    if (ctx.action === 'chop') { this.chopFacingTree(); return; }
    if (ctx.action === 'observe') { this.observeWildlife(); return; }
    if (ctx.action === 'animal') { this.careAnimal(); return; }
    if (ctx.action === 'talk') { this.talkToNPC(); return; }
    if (ctx.action === 'eat') { this.eatFood(); return; }
    if (ctx.action === 'station') { this.openStation(); return; }
    if (ctx.action === 'festival') { this.openFestival(); return; }
    if (ctx.action === 'village') { this.openVillage(); return; }

    switch (ctx.action) {
      case 'till':
        if (this.farming.till(ctx.tx, ctx.ty)) this.flashPlayer(0xd9a04a);
        break;
      case 'plant': {
        const seed = this.inventory.firstSeed();
        if (seed && this.farming.plant(ctx.tx, ctx.ty, seed, this.timeSystem.getSeason())) {
          this.flashPlayer(0x4ad94a);
        } else if (seed) {
          this.showFloatText(this.player.sprite.x, this.player.sprite.y - 24, 'Wrong season for that seed!');
        }
        break;
      }
      case 'water':
        if (this.farming.water(ctx.tx, ctx.ty)) this.flashPlayer(0x4a90d9);
        break;
      case 'harvest': {
        const result = this.farming.harvest(ctx.tx, ctx.ty);
        if (result) {
          this.flashPlayer(0xf0d040);
          this.showFloatText(
            ctx.tx * GAME_CONFIG.TILE_SIZE + 8,
            ctx.ty * GAME_CONFIG.TILE_SIZE,
            `+${result.quantity} ${ITEMS[result.itemId]?.name ?? result.itemId}${result.quality > 0 ? ' ★'.repeat(result.quality) : ''}`
          );
          this.questSystem.notify('harvest', result.quantity);
        }
        break;
      }
    }
    this.syncFarmToSave();
    this.contextTimer = 999;
  }

  // ---------- Fishing minigame ----------

  private startFishing(): void {
    const regionId = this.regionManager.getCurrentRegionId();
    const season = this.timeSystem.getSeason();
    const pending = this.fishingSystem.rollCatch(regionId, season, this.timeSystem.isNight());
    if (!pending) {
      this.showFloatText(this.player.sprite.x, this.player.sprite.y - 24, 'Nothing is biting right now...');
      return;
    }
    const d = pending.fish.difficulty;
    this.fishing.active = true;
    this.fishing.pending = pending;
    this.fishing.ringR = 140;
    this.fishing.targetR = 30;
    this.fishing.windowHalf = Math.max(5, 14 - d * 9);   // harder fish = tighter window
    this.fishing.speed = 50 + d * 90;                     // harder fish = faster shrink
    this.fishing.graphics = this.add.graphics().setDepth(2500);
    this.showFloatText(this.player.sprite.x, this.player.sprite.y - 30, '...');
  }

  private updateFishing(deltaMs: number): void {
    if (!this.fishing.active || !this.fishing.graphics) return;
    this.fishing.ringR -= this.fishing.speed * (deltaMs / 1000);
    if (this.fishing.ringR <= 0) {
      this.endFishing(false, 'It got away...');
      return;
    }
    const g = this.fishing.graphics;
    const p = this.player.getPosition();
    g.clear();
    // sweet spot
    g.lineStyle(3, 0x4ad94a, 0.9);
    g.strokeCircle(p.x, p.y, this.fishing.targetR);
    g.fillStyle(0x4ad94a, 0.15);
    g.fillCircle(p.x, p.y, this.fishing.windowHalf);
    // shrinking ring
    const inWindow = Math.abs(this.fishing.ringR - this.fishing.targetR) <= this.fishing.windowHalf;
    g.lineStyle(2, inWindow ? 0xf0d040 : 0xffffff, 0.9);
    g.strokeCircle(p.x, p.y, Math.max(0, this.fishing.ringR));
  }

  private resolveFishingAttempt(): void {
    const { ringR, targetR, windowHalf } = this.fishing;
    const success = Math.abs(ringR - targetR) <= windowHalf;
    if (success && this.fishing.pending) {
      const roll = this.fishing.pending;
      const stars = roll.quality > 0 ? ' ' + '★'.repeat(roll.quality) : '';
      this.inventory.add(roll.fish.itemId, 1, roll.quality);
      const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
      sm.updateSave(s => {
        FishingSystem.recordCatch(
          s.journal.fishCaught as Record<string, JournalFishEntry>, roll
        );
      });
      this.endFishing(true, `${roll.fish.name}${stars} — ${roll.sizeCm}cm!`);
      this.questSystem.notify('fish', 1);
    } else {
      this.endFishing(false, 'It slipped the hook...');
    }
  }

  private endFishing(success: boolean, msg: string): void {
    this.fishing.active = false;
    this.fishing.pending = null;
    this.fishing.graphics?.destroy();
    this.fishing.graphics = null;
    const color = success ? 0xf0d040 : 0xd94a4a;
    this.flashPlayer(color);
    this.showFloatText(this.player.sprite.x, this.player.sprite.y - 30, msg);
    this.contextTimer = 999;
  }

  private cancelFishing(): void {
    if (this.fishing.active) this.endFishing(false, 'Reeled in.');
  }

  // ---------- Sleep & Collapse ----------

  private doSleep(): void {
    if (this.isSleeping) return;
    this.isSleeping = true;
    this.fadeTransition(() => {
      this.timeSystem.sleepUntilMorning();
      this.needs.applySleep();
      this.syncNeedsToSave();
      this.syncFarmToSave();
      const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
      sm.save('auto');
      this.showFloatText(this.player.sprite.x, this.player.sprite.y - 24, `Day ${this.timeSystem.getDay()} — morning`);
      this.isSleeping = false;
    });
  }

  private doCollapse(): void {
    if (this.isSleeping) return;
    this.isSleeping = true;
    EventBus.emit(Events.COLLAPSED);
    this.fadeTransition(() => {
      this.needs.applyCollapse();
      this.timeSystem.sleepUntilMorning();
      this.syncNeedsToSave();
      this.syncFarmToSave();
      const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
      sm.save('auto');
      this.showFloatText(this.player.sprite.x, this.player.sprite.y - 24, 'You collapsed from exhaustion...');
      this.isSleeping = false;
    });
  }

  private fadeTransition(midpoint: () => void): void {
    const cam = this.cameras.main;
    const fade = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0)
      .setScrollFactor(0).setDepth(4000);
    this.tweens.add({
      targets: fade, fillAlpha: 1, duration: 600,
      onComplete: () => {
        midpoint();
        this.time.delayedCall(400, () => {
          this.tweens.add({ targets: fade, fillAlpha: 0, duration: 600, onComplete: () => fade.destroy() });
        });
      }
    });
  }

  // ---------- Sync ----------

  private onPlotsChanged(plots: any[]): void {
    if (this.regionManager?.getCurrentRegion()?.farmable) this.plotRenderer.refreshAll(plots);
    else this.plotRenderer.clear();
  }

  private syncWorldToSave(): void {
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    sm.updateSave(s => {
      s.world.day = this.timeSystem.getDay();
      s.world.timeMinutes = this.timeSystem.getTimeMinutes();
      s.world.season = this.timeSystem.getSeason();
      s.world.currentRegionId = this.regionManager.getCurrentRegionId();
      s.world.weather.current = this.weatherSystem.getCurrent();
      s.world.weather.daysRemaining = this.weatherSystem.getDaysRemaining();
      s.farm.plots = this.farming.serialize();
      this.resonanceSystem.dailyDrift();
      s.world.resonance = this.resonanceSystem.serialize();
      for (const id of this.foundPOIs) {
        const tag = `poi:${id}`;
        if (!s.journal.notes.includes(tag)) s.journal.notes.push(tag);
      }
    });
  }

  private syncFarmToSave(): void { this.syncWorldToSave(); }

  private syncInventoryToSave(): void {
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    sm.updateSave(s => { s.inventory = this.inventory.serialize(); });
  }

  private syncNeedsToSave(): void {
    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    sm.updateSave(s => { Object.assign(s.player, this.needs.snapshot()); });
  }

  // ---------- Combat stubs (M9) ----------

  private tryAttack(): void { this.attackFacing(); }

  private tryDodge(): void {
    this.cancelFishing();
    const dir = this.player.getDirection();
    const d = 40;
    let dx = 0, dy = 0;
    if (dir === 'left') dx = -d;
    if (dir === 'right') dx = d;
    if (dir === 'up') dy = -d;
    if (dir === 'down') dy = d;
    this.tweens.add({
      targets: this.player.sprite,
      x: this.player.sprite.x + dx,
      y: this.player.sprite.y + dy,
      duration: 150, ease: 'Power2'
    });
  }

  // ---------- Feedback ----------

  private flashPlayer(color: number): void {
    this.player.sprite.setTint(color);
    this.time.delayedCall(100, () => this.player.sprite.clearTint());
  }

  private showFloatText(x: number, y: number, text: string): void {
    const t = this.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(3000);
    this.tweens.add({
      targets: t, y: y - 20, alpha: 0, duration: 1200,
      ease: 'Sine.easeOut', onComplete: () => t.destroy()
    });
  }

  // ---------- Update ----------

  update(time: number, delta: number): void {
    if (!this.player) return;

    this.timeSystem.update(delta);
    this.needs.update(delta);

    if (this.fishing.active) {
      // Player stands still while reeling; joystick/dodge can cancel
      this.player.setJoystickVector(new Phaser.Math.Vector2(0, 0));
      this.player.setTouchTarget(null);
      this.player.update(delta);
      this.updateFishing(delta);
    } else {
      this.needs.setMoving(this.player.isPlayerMoving());
      this.player.moveEfficiency = this.needs.getMoveEfficiency();
      this.player.update(delta);
      this.tryPortalTravel();
      this.attackCooldown = Math.max(0, this.attackCooldown - delta / 1000);
      this.updateMonsters(delta);
      // Precipitation falls
      for (const p of this.precipParticles) {
        const spd = (p as any).isSnow ? 20 : 220;
        p.y += spd * (delta / 1000);
        if ((p as any).isSnow) p.x += Math.sin(p.y / 20) * 0.4;
        if (p.y > this.player.sprite.y + 140) {
          p.y = this.player.sprite.y - 140;
          p.x = this.player.sprite.x + (Math.random() - 0.5) * 320;
        }
      }

      this.npcRefreshTimer = (this.npcRefreshTimer ?? 0) + delta;
      if (this.npcRefreshTimer > 10000) {
        this.npcRefreshTimer = 0;
        this.spawnNPCs(); // follow schedule as time passes
        this.checkPOIs();
      }
      for (const w of this.wildlifeSprites) {
        if (w.spawn.fled) { w.sprite.setVisible(false); continue; }
        const dx = w.sprite.x - this.player.sprite.x, dy = w.sprite.y - this.player.sprite.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
          this.wildlifeSystem.onPlayerNear(w.spawn, this.player.isPlayerMoving());
        }
      }
    }

    // Weather overlay
    const wxColor = WeatherSystem.overlayColor(this.weatherSystem.getCurrent());
    if (wxColor && !this.weatherOverlay) {
      this.weatherOverlay = this.add.rectangle(0, 0, 4000, 4000, wxColor, 0.25)
        .setScrollFactor(0).setDepth(480).setOrigin(0.5);
      this.weatherOverlay.setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2);
    } else if (!wxColor && this.weatherOverlay) {
      this.weatherOverlay.destroy();
      this.weatherOverlay = null;
    }
    this.updatePrecipitation();

    const h = this.timeSystem.getHour() + this.timeSystem.getMinute() / 60;
    let darkness = 0;
    if (h >= 22 || h < 5) darkness = 0.45;
    else if (h >= 20) darkness = 0.45 * ((h - 20) / 2);
    else if (h >= 5 && h < 6) darkness = 0.45 * (1 - (h - 5));
    if (Math.abs(this.nightOverlay.fillAlpha - darkness) > 0.02) {
      this.nightOverlay.setFillStyle(0x0a1030, darkness);
    }

    this.contextTimer += delta;
    if (this.contextTimer >= 150) {
      this.contextTimer = 0;
      this.contextAction = this.resolveAction();
      this.interactBtn?.setLabel(this.contextAction?.label ?? '·');
    }

    this.needsSyncTimer += delta;
    if (this.needsSyncTimer >= 2000) {
      this.needsSyncTimer = 0;
      this.syncNeedsToSave();
    }

    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    sm.updateSave(s => { s.world.playerPosition = this.player.getPosition(); });
  }

  shutdown(): void {
    EventBus.off(Events.FARM_PLOT_CHANGED, this.onPlotsChanged, this);
    EventBus.off(Events.INVENTORY_CHANGED, this.syncInventoryToSave, this);
    EventBus.off(Events.REGION_DISCOVERED, this.onRegionDiscovered, this);
    EventBus.off(Events.SHOP_CLOSED, this.onShopClosed, this);
    EventBus.off(Events.DIALOGUE_CLOSED, this.onDialogueClosed, this);
    EventBus.off(Events.QUEST_LOG_CLOSED, this.onQuestLogClosed, this);
    EventBus.off(Events.CRAFTING_CLOSED, this.onCraftingClosed, this);
    EventBus.off(Events.FESTIVAL_CLOSED, this.onFestivalClosed, this);
    EventBus.off(Events.VILLAGE_CLOSED, this.onVillageClosed, this);
    EventBus.off(Events.QUEST_COMPLETED, this.onQuestCompleted, this);
    EventBus.off(Events.GOLD_CHANGED, this.syncGoldToSave, this);

    this.syncFarmToSave();
    this.syncInventoryToSave();
    this.syncNeedsToSave();
    this.syncGoldToSave();

    this.joystick?.destroy();
    this.interactBtn?.destroy();
    this.attackBtn?.destroy();
    this.dodgeBtn?.destroy();
    this.plotRenderer?.clear();
    this.player?.destroy();
    this.tilemapManager?.unloadCurrent();
    this.timeSystem?.destroy();

    const sm = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
    sm.stopAutosave();
    sm.save('auto');
  }
}
