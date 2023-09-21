import { ResourceFieldType } from 'interfaces/models/game/village';
import { seededRandomArrayElement, seededRandomIntFromInterval } from 'utils/common';
import { Tile } from 'interfaces/models/game/tile';
import { Point } from 'interfaces/models/common';
import { Resource } from 'interfaces/models/game/resource';
import { oasisShapes } from 'constants/oasis-shapes';
import { Server } from 'interfaces/models/game/server';

export class MapGeneratorService {
  private static generateGrid = (server: Server) => {
    const { id, configuration: { mapSize: size } } = server;

    let xCoordinateCounter: number = -size / 2 - 1;
    let yCoordinateCounter: number = size / 2;

    return [...Array(size ** 2 + 2 * size + 1)].flatMap(() => {
      xCoordinateCounter += 1;
      const x: Point['x'] = xCoordinateCounter;
      const y: Point['y'] = yCoordinateCounter;

      // When we reach the end of a row, decrease y and reset x coordinate counters
      if (xCoordinateCounter === size / 2) {
        xCoordinateCounter = -size / 2 - 1;
        yCoordinateCounter -= 1;
      }

      const coordinates: Point = {
        x,
        y
      };

      return {
        serverId: id,
        coordinates,
        isOccupied: x === 0 && y === 0,
        isOasis: false,
        backgroundColor: '#B9D580',
        type: null
      };
    });
  };

  /**
   * Generates resource layout for an empty tile
   */
  private static generateFreeTileType = (seed: string, i: number): ResourceFieldType => {
    const randomInt: number = seededRandomIntFromInterval(`${seed}${i}`, i, 91);
    const weightedResourceFieldType: Record<number, ResourceFieldType> = {
      1: '00018',
      2: '11115',
      3: '3339',
      6: '4437',
      9: '4347',
      12: '3447',
      20: '3456',
      28: '4356',
      36: '3546',
      44: '4536',
      52: '5346',
      60: '5436'
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const weight in weightedResourceFieldType) {
      if (randomInt <= Number(weight)) {
        return weightedResourceFieldType[weight];
      }
    }

    return '4446';
  };

  public static generateMap = (server: Server) => {
    const { seed } = server;
    const emptyTiles = this.generateGrid(server);

    // Loop through all tiles
    for (let i = 0; i < emptyTiles.length; i += 1) {
      const currentTile: Tile = emptyTiles[i];
      if (currentTile.isOasis) {
        continue;
      }
      // Each tile has 1/12 to become an oasis
      const tileWillBeOasis: boolean = seededRandomIntFromInterval(`${seed}${i}`, i, i + 12) === i;

      // Determine oasis position and shape
      if (tileWillBeOasis) {
        // Surrounding tiles will have to become oasis as well, depending on shape of the oasis
        const tilesToUpdate: Tile[] = [];
        const resourceType: Resource = seededRandomArrayElement<Resource>(`${seed}${i}`, ['wheat', 'wood', 'iron', 'clay']);
        const { backgroundColor } = oasisShapes[resourceType];
        const { shapes } = oasisShapes[resourceType];
        const selectedOasis = shapes[seededRandomArrayElement(`${seed}${i}`, [...Array(shapes.length)
          .keys()])];
        const {
          shape: oasisShape,
          group: oasisGroup
        } = selectedOasis;

        const {
          x,
          y
        }: Point = currentTile.coordinates;

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
            const tile: Tile | undefined = emptyTiles.find((cell: Tile) => cell.coordinates.y === y - k && cell.coordinates.x === j);
            if (!tile || tile.isOasis) {
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
          const cellToUpdate: Tile = emptyTiles.find((cell: Tile) => {
            return cell.coordinates.x === occupiedCell.coordinates.x && cell.coordinates.y === occupiedCell.coordinates.y;
          })!;
          cellToUpdate.isOasis = true;
          cellToUpdate.backgroundColor = backgroundColor;
          cellToUpdate.oasisGroup = oasisGroup;
        });
      }
    }

    // To make world feel more alive and give player more options, we sprinkle a bunch of 1x1 oasis on empty fields as well
    const tilesWithAddedOasis: Tile[] = emptyTiles.map((cell: Tile, i: number): Tile => {
      if (cell.isOasis) {
        return cell;
      }
      const willBeOccupied = seededRandomIntFromInterval(`${seed}${i}`, i, i + 5) === i;
      if (!willBeOccupied) {
        return cell;
      }
      const resourceType = seededRandomArrayElement<Resource>(`${seed}${i}`, ['wheat', 'wood', 'iron', 'clay']);
      return {
        ...cell,
        oasisGroup: 0,
        isOasis: true,
        backgroundColor: oasisShapes[resourceType].backgroundColor
      };
    });

    const tilesWithTypes = tilesWithAddedOasis.map((tile: Tile, i: number) => {
      if (tile.isOasis) {
        return tile;
      }
      return {
        ...tile,
        type: this.generateFreeTileType(`${seed}${i}`, i)
      };
    });

    return tilesWithTypes;
  };
}
