import { Tile } from 'interfaces/models/game/tile';
import { Server } from 'interfaces/models/game/server';
import { Hero } from 'interfaces/models/game/hero';
import { newVillage } from 'utils/constants/new-village';
import { Village } from 'interfaces/models/game/village';
import { StorageService } from 'services/storage-service';
import { accountEffects } from 'utils/constants/effects';
import { RandomizerService } from 'services/randomizer-service';

export class CreateServerService {
  private readonly serverId: Server['id'];

  private readonly server: Server;

  constructor(server: Server) {
    this.server = server;
    this.serverId = server.id;
  }

  public init = async (seed: string): Promise<boolean> => {
    try {
      await Promise.all([
        this.createEventQueue(),
        this.createHero(),
        this.createReports(),
        this.createQuests(),
        this.createAchievements(),
        this.createResearchLevels(),
        this.createMapData(seed),
        this.createPlayerVillageData()
      ]);
      return true;
    } catch (e) {
      throw new Error('Error occurred when creating new world.');
    }
  };

  private createPlayerVillageData = async (): Promise<void> => {
    const defaultVillage = newVillage;
    await StorageService.set<Village[]>(`${this.serverId}-playerVillages`, [defaultVillage]);
  };

  private createEventQueue = async (): Promise<void> => {
    await StorageService.set(`${this.serverId}-events`, []);
  };

  private createHero = async (): Promise<void> => {
    const { tribe } = this.server.configuration;
    const speed = tribe === 'gauls' ? 14 : 9;
    const attackPower = tribe === 'romans' ? 100 : 80;

    const hero = {
      name: 'Unnamed hero',
      level: 0,
      experience: 0,
      health: 100,
      healthRegenerationRate: 10,
      speed,
      attackPower,
      resourceProduction: 4,
      resourceToProduce: 'shared',
      attackBonus: 0,
      defenceBonus: 0,
      unitType: 'infantry',
      wornItems: [],
      inventory: []
    };

    await StorageService.set(`${this.serverId}-hero`, <Hero>hero);
  };

  private createReports = async (): Promise<void> => {
    console.log('createReports');
  };

  private createQuests = async (): Promise<void> => {
    console.log('createQuests');
  };

  private createAchievements = async (): Promise<void> => {
    console.log('createAchievements');
  };

  private createResearchLevels = async (): Promise<void> => {
    console.log('createResearchLevels');
  };

  private createAccountEffects = async (): Promise<void> => {
    await StorageService.set(`${this.serverId}-accountEffects`, accountEffects);
  };

  private createMapData = async (seed: string = RandomizerService.generateSeed()): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const createNewServerWorker = new Worker(new URL('../workers/generate-world-map-worker', import.meta.url));
      createNewServerWorker.postMessage([this.server.configuration.mapSize, seed]);
      createNewServerWorker.addEventListener('message', async (event: MessageEvent<{ tiles: Tile[] }>) => {
        const { tiles } = event.data;
        await StorageService.set<Tile[]>(`${this.serverId}-map`, tiles);
        resolve(true);
      });
      createNewServerWorker.addEventListener('error', () => {
        reject(new Error('Error occurred when creating world data'));
      });
    });
  };
}
