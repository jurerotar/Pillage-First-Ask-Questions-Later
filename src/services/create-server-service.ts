import { Tile } from 'interfaces/models/game/tile';
import randomArrayElement from 'helpers/random-array-element';
import { Resource } from 'interfaces/models/game/resources';
import oasisShapes from 'helpers/constants/oasis-shapes';
import { Server } from 'interfaces/models/game/server';
import localforage from 'localforage';
import { Hero } from 'interfaces/models/game/hero';

class CreateServerService {
  private readonly serverId: Server['id'];

  private readonly server: Server;

  constructor(server: Server) {
    this.server = server;
    this.serverId = server.id;
  }

  private createHero = async () => {
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

  private createMapData = (): Tile[] => {
    const size = this.server.configuration.mapSize;

    let xCounter: number = -size / 2 - 1;
    let yCounter: number = size / 2;

    // Create base map
    const tiles: Tile[] = [...Array(size ** 2 + 2 * size + 1)].map(() => {
      xCounter += 1;
      const x: Tile['x'] = xCounter;
      const y: Tile['x'] = yCounter;

      if (xCounter === size / 2) {
        xCounter = -size / 2 - 1;
        yCounter -= 1;
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
    for (let i = 0; i < tiles.length; i += 1) {
      const currentTile: Tile = tiles[i];
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
            const tile: Tile | undefined = tiles.find((cell) => cell.y === y - k && cell.x === j);
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
          const cellToUpdate: Tile = tiles.find((cell: Tile) => cell.x === occupiedCell.x && cell.y === occupiedCell.y)!;
          cellToUpdate.isOccupied = true;
          cellToUpdate.backgroundColor = backgroundColor;
          cellToUpdate.oasisGroup = oasisGroup;
        });
      }
    }

    return tiles.map((cell: Tile): Tile => {
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
  };
}

export default CreateServerService;
