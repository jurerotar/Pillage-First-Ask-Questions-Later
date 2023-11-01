import { Tile } from 'interfaces/models/game/tile';
import { Server } from 'interfaces/models/game/server';
import { Village } from 'interfaces/models/game/village';
import { Unit } from 'interfaces/models/game/unit';
import { ResearchLevel } from 'interfaces/models/game/research-level';
import { Hero } from 'interfaces/models/game/hero';
import { Bank } from 'interfaces/models/game/bank';
import { Quest } from 'interfaces/models/game/quest';
import { Achievement } from 'interfaces/models/game/achievement';
import { Effect } from 'interfaces/models/game/effect';
import _unitsData from 'assets/units.json' assert { type: 'json' };

const unitData = _unitsData as Unit[];

export class CreateServerService {
  public static createHero = (server: Server) => {
    const {
      id,
      configuration: { tribe }
    } = server;
    const speed = tribe === 'gauls' ? 14 : 9;
    const attackPower = tribe === 'romans' ? 100 : 80;

    return {
      serverId: id,
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
      inventory: []
    } satisfies Hero;
  };

  public static createQuests = (): Quest[] => {
    return [];
  };

  public static createAchievements = (): Achievement[] => {
    return [];
  };

  public static createBank = (server: Server): Bank => {

  };

  public static createResearchLevels = (server: Server): ResearchLevel[] => {
    return unitData.map((unit: Unit) => ({
      serverId: server.id,
      unitId: unit.id,
      unitTribe: unit.tribe,
      level: 0
    }));
  };

  public static createAccountEffects = (): Effect[] => {
    return [];
  };

  public static createVillages = async (server: Server, tiles: Tile[]): Promise<Village[]> => {
    return new Promise((resolve, reject) => {
      const createVillagesWorker = new Worker(new URL('../workers/generate-villages-worker', import.meta.url), {
        type: 'module'
      });
      createVillagesWorker.postMessage({
        server,
        tiles
      });
      createVillagesWorker.addEventListener('message', async (event: MessageEvent<{ villages: Village[] }>) => {
        const { villages } = event.data;
        resolve(villages);
      });
      createVillagesWorker.addEventListener('error', () => {
        reject(new Error('Error occurred when creating villages'));
      });
    });
  };

  public static createMapData = async (server: Server): Promise<Tile[]> => {
    return new Promise((resolve, reject) => {
      const createMapWorker = new Worker(new URL('../workers/generate-world-map-worker', import.meta.url), {
        type: 'module'
      });
      createMapWorker.postMessage({ server });
      createMapWorker.addEventListener('message', async (event: MessageEvent<{ tiles: Tile[] }>) => {
        const { tiles } = event.data;
        resolve(tiles);
      });
      createMapWorker.addEventListener('error', () => {
        reject(new Error('Error occurred when creating world data'));
      });
    });
  };
}
