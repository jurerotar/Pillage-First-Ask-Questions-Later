import { Tile } from 'interfaces/models/game/tile';
import randomArrayElement from 'helpers/random-array-element';
import { Resource } from 'interfaces/models/game/resources';
import oasisShapes from 'helpers/constants/oasis-shapes';
import { Server } from 'interfaces/models/game/server';
import localforage from 'localforage';
import { Hero } from 'interfaces/models/game/hero';
import newVillage from 'helpers/constants/new-village';
import { Village } from 'interfaces/models/game/village';

class CreateServerService {
  private readonly serverId: Server['id'];

  private readonly server: Server;

  constructor(server: Server) {
    this.server = server;
    this.serverId = server.id;
  }

  public init = async (): Promise<boolean> => {
    try {
      await Promise.all([
        this.createEventQueue(),
        this.createHero(),
        this.createReports(),
        this.createQuests(),
        this.createAchievements(),
        this.createResearchLevels(),
        this.createMapData(),
        this.createPlayerVillageData()
      ]);
      return true;
    } catch (e) {
      return false;
    }
  };

  private createPlayerVillageData = async ():Promise<void> => {
    const defaultVillage = newVillage;
    await localforage.setItem<Village[]>(`${this.serverId}-playerVillagesData`, [defaultVillage]);
  };

  private createEventQueue = async (): Promise<void> => {
    console.log('eventQueue');
  };

  private createHero = async (): Promise<void> => {
    console.log('createHero');
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

    await localforage.setItem<Hero>(`${this.serverId}-heroData`, <Hero>hero);
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

  private createMapData = async (): Promise<void> => {
    console.log('createMapData');

    const size = this.server.configuration.mapSize;

    let xCoordinateCounter: number = -size / 2 - 1;
    let yCoordinateCounter: number = size / 2;

    // To create an isometric map, we create a cartesian map of double the size that we actually need, then remove the tiles that are never
    // displayed. Since our map has a border (wood and iron oasis surrounding the map, we have to include those fields as well.
    const emptyTiles: Tile[] = [...Array(size ** 2 + 2 * size + 1)].map(() => {
      xCoordinateCounter += 1;
      const x: Tile['x'] = xCoordinateCounter;
      const y: Tile['x'] = yCoordinateCounter;

      // When we reach the end of a row, decrease y and reset x coordinate counters
      if (xCoordinateCounter === size / 2) {
        xCoordinateCounter = -size / 2 - 1;
        yCoordinateCounter -= 1;
      }
      if ((Math.abs(x) + Math.abs(y)) > size / 2) {
        return null;
      }

      return {
        x,
        y,
        isOccupied: false,
        isOasis: false,
        backgroundColor: '#B9D580',
        type: 'normal'
      };
    })
      .filter((tile: Tile | null) => tile !== null) as Tile[];

    // Loop through all tiles
    for (let i = 0; i < emptyTiles.length; i += 1) {
      const currentTile: Tile = emptyTiles[i];
      if (currentTile.isOccupied) {
        continue;
      }
      // Each tile has 1/15 to become an oasis
      const tileWillBeOasis: boolean = randomArrayElement<number>([...Array(15)
        .keys()]) === 1;

      if (tileWillBeOasis) {
        // Surrounding tiles will have to become oasis as well, depending on shape of the oasis
        const tilesToUpdate: Tile[] = [];
        const resourceType: Resource = randomArrayElement<Resource>(['wheat', 'wood', 'iron', 'clay', 'wood', 'iron', 'clay']);
        const { backgroundColor } = oasisShapes[resourceType];
        const { shapes } = oasisShapes[resourceType];
        const selectedOasis = shapes[randomArrayElement([...Array(shapes.length)
          .keys()])];
        const oasisShape = selectedOasis.shape;
        const oasisGroup = selectedOasis.group;
        const [x, y]: [Tile['x'], Tile['y']] = [currentTile.x, currentTile.y];

        let breakCondition: boolean = false;

        // Y-axis movement
        for (let k = 0; k < oasisShape.length; k += 1) {
          if (breakCondition) {
            break;
          }
          // X-axis movement
          const [xMovementLeft, hasMiddleField, xMovementRight] = oasisShape[k];
          for (let j = x - xMovementLeft; j <= x + xMovementRight; j += 1) {
            if (!hasMiddleField && j === x) {
              continue;
            }
            const tile: Tile | undefined = emptyTiles.find((cell) => cell.y === y - k && cell.x === j);
            if (!tile || tile.isOccupied) {
              breakCondition = true;
              break;
            }
            tilesToUpdate.push(tile);
          }
        }
        if (breakCondition) {
          continue;
        }

        tilesToUpdate.forEach((occupiedCell: Tile) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const cellToUpdate: Tile = emptyTiles.find((cell: Tile) => cell.x === occupiedCell.x && cell.y === occupiedCell.y)!;
          cellToUpdate.isOccupied = true;
          cellToUpdate.backgroundColor = backgroundColor;
          cellToUpdate.oasisGroup = oasisGroup;
        });
      }
    }

    const tilesWithOasis = emptyTiles.map((cell: Tile): Tile => {
      if (cell.isOccupied) {
        return cell;
      }
      const willBeOccupied = randomArrayElement<number>([...Array(10)
        .keys()]) === 1;
      if (!willBeOccupied) {
        return cell;
      }
      const resourceType = randomArrayElement<Resource>(['wheat', 'wood', 'iron', 'clay', 'wood', 'iron', 'clay']);
      return {
        ...cell,
        oasisGroup: 0,
        isOccupied: true,
        backgroundColor: oasisShapes[resourceType].backgroundColor
      };
    });
    const tiles = tilesWithOasis;
    await localforage.setItem<Tile[]>(`${this.serverId}-mapData`, tiles);
  };
}

export default CreateServerService;
