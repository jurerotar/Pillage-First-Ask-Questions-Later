import { ResourceFieldType } from 'interfaces/models/game/village';
import { seededRandomArrayElement, seededRandomIntFromInterval } from 'utils/common';
import { Tile } from 'interfaces/models/game/tile';
import { Point } from 'interfaces/models/common';
import { Resource } from 'interfaces/models/game/resource';
import { oasisShapes } from 'constants/oasis-shapes';
import { Server } from 'interfaces/models/game/server';
import { createHash } from 'sha1-uint8array';

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

export class MapGeneratorService {
  private static generateGrid = (server: Server): Tile[] => {
    const {
      id,
      configuration: { mapSize: size }
    } = server;

    let xCoordinateCounter: number = -size / 2 - 1;
    let yCoordinateCounter: number = size / 2;
    let counter: number = 0;

    return [...Array(size ** 2 + 2 * size + 1)].flatMap(() => {
      counter += 1;
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
        seed: createHash()
          .update(`${server.seed}${counter}`)
          .digest('hex'),
        serverId: id,
        coordinates,
        isOccupied: x === 0 && y === 0,
        isOasis: false,
        backgroundColor: '#B9D580',
        type: x === 0 && y === 0 ? '4446' : null,
        oasisType: null
      };
    });
  };

  /**
   * Generates resource layout for an empty tile
   */
  private static generateFreeTileType = (tile: Tile): ResourceFieldType => {
    const randomInt: number = seededRandomIntFromInterval(tile.seed, 1, 91);

    // eslint-disable-next-line no-restricted-syntax
    for (const weight in weightedResourceFieldType) {
      if (randomInt <= Number(weight)) {
        return weightedResourceFieldType[weight];
      }
    }

    return '4446';
  };

  public static generateMap = (server: Server): Tile[] => {
    const emptyTiles = this.generateGrid(server);

    // Loop through all tiles
    for (let i = 0; i < emptyTiles.length; i += 1) {
      const currentTile: Tile = emptyTiles[i];
      if (currentTile.isOasis) {
        continue;
      }
      // Each tile has 1/15 to become an oasis
      const tileWillBeOasis: boolean = seededRandomIntFromInterval(currentTile.seed, 1, 12) === 1;

      // Determine oasis position and shape
      if (tileWillBeOasis) {
        // Surrounding tiles will have to become oasis as well, depending on shape of the oasis
        const tilesToUpdate: Tile[] = [];
        const resourceType: Resource = seededRandomArrayElement<Resource>(currentTile.seed, ['wheat', 'iron', 'clay', 'wood']);
        const { backgroundColor } = oasisShapes[resourceType];
        const { shapes } = oasisShapes[resourceType];
        const selectedOasis = shapes[seededRandomArrayElement(currentTile.seed, [...Array(shapes.length)
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

        // Find tiles to update based on oasis shape
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
            if (!tile || tile.isOasis || tile.isOccupied) {
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
          cellToUpdate.oasisType = resourceType;
          cellToUpdate.backgroundColor = backgroundColor;
          cellToUpdate.oasisGroup = oasisGroup;
        });
      }
    }

    // To make world feel more alive and give player more options, we sprinkle a bunch of 1x1 oasis on empty fields as well
    const tilesWithAddedOasis: Tile[] = emptyTiles.map((cell: Tile): Tile => {
      if (cell.isOasis || cell.type !== null) {
        return cell;
      }
      const willBeOccupied = seededRandomIntFromInterval(cell.seed, 1, 5) === 1;
      if (!willBeOccupied) {
        return {
          ...cell,
          type: this.generateFreeTileType(cell)
        };
      }
      const resourceType: Resource = seededRandomArrayElement<Resource>(cell.seed, ['wheat', 'iron', 'clay', 'wood']);
      return {
        ...cell,
        oasisGroup: 0,
        isOasis: true,
        backgroundColor: oasisShapes[resourceType].backgroundColor
      };
    });

    return tilesWithAddedOasis;
  };
}
