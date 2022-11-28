import { ResourceFieldType } from 'interfaces/models/game/village';
import { randomArrayElement, randomIntFromInterval } from 'utils/common';
import { Tile } from 'interfaces/models/game/tile';
import { Point } from 'interfaces/models/common';
import { Resource } from 'interfaces/models/game/resource';
import { oasisShapes } from 'utils/constants/oasis-shapes';

export class MapGeneratorService {
  public static readonly BORDER_SIZE: number = 20;

  public static generateMap = (size: number = 100, seed?: string) => {
    const emptyTiles = this.generateIsometricMapTiles(size);
    const borderedTiles = this.generateBorderTiles(size, emptyTiles);

    // Loop through all tiles
    for (let i = 0; i < borderedTiles.length; i += 1) {
      const currentTile: Tile = borderedTiles[i];
      if (currentTile.isOasis || currentTile.isBorderField) {
        continue;
      }
      // Each tile has 1/15 to become an oasis
      const tileWillBeOasis: boolean = randomIntFromInterval(1, 15) === 1;

      // Determine oasis position and shape
      if (tileWillBeOasis) {
        // Surrounding tiles will have to become oasis as well, depending on shape of the oasis
        const tilesToUpdate: Tile[] = [];
        const resourceType: Resource = randomArrayElement<Resource>(['wheat', 'wood', 'iron', 'clay', 'wood', 'iron', 'clay']);
        const { backgroundColor } = oasisShapes[resourceType];
        const { shapes } = oasisShapes[resourceType];
        const selectedOasis = shapes[randomArrayElement([...Array(shapes.length)
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
            const tile: Tile | undefined = borderedTiles.find((cell: Tile) => cell.coordinates.y === y - k && cell.coordinates.x === j);
            if (!tile || tile.isOasis || tile.isBorderField) {
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
          const cellToUpdate: Tile = borderedTiles.find((cell: Tile) => {
            return cell.coordinates.x === occupiedCell.coordinates.x && cell.coordinates.y === occupiedCell.coordinates.y;
          })!;
          cellToUpdate.isOasis = true;
          cellToUpdate.backgroundColor = backgroundColor;
          cellToUpdate.oasisGroup = oasisGroup;
        });
      }
    }

    // To make world feel more alive and give player more options, we sprinkle a bunch of 1x1 oasis on empty fields as well
    const tilesWithAddedOasis: Tile[] = borderedTiles.map((cell: Tile): Tile => {
      if (cell.isOasis || cell.isBorderField) {
        return cell;
      }
      const willBeOccupied = randomIntFromInterval(1, 10) === 1;
      if (!willBeOccupied) {
        return cell;
      }
      const resourceType = randomArrayElement<Resource>(['wheat', 'wood', 'iron', 'clay', 'wood', 'iron', 'clay']);
      return {
        ...cell,
        oasisGroup: 0,
        isOasis: true,
        backgroundColor: oasisShapes[resourceType].backgroundColor
      };
    });

    const tilesWithTypes = tilesWithAddedOasis.map((tile: Tile) => {
      if (tile.isOasis) {
        return tile;
      }
      return {
        ...tile,
        type: this.generateFreeTileType()
      };
    });

    return tilesWithTypes;
  };

  private static generateIsometricMapTiles = (size: number) => {
    const sizeWithBorder: number = size + this.BORDER_SIZE;
    let xCoordinateCounter: number = -sizeWithBorder / 2 - 1;
    let yCoordinateCounter: number = sizeWithBorder / 2;

    // To create an isometric map, we create a cartesian map of double the size that we actually need, then remove the tiles that are never
    // displayed.
    return [...Array(sizeWithBorder ** 2 + 2 * sizeWithBorder + 1)].flatMap(() => {
      xCoordinateCounter += 1;
      const x: Point['x'] = xCoordinateCounter;
      const y: Point['y'] = yCoordinateCounter;

      // When we reach the end of a row, decrease y and reset x coordinate counters
      if (xCoordinateCounter === sizeWithBorder / 2) {
        xCoordinateCounter = -sizeWithBorder / 2 - 1;
        yCoordinateCounter -= 1;
      }

      // Remove the tiles that will not be used
      if ((Math.abs(x) + Math.abs(y)) > sizeWithBorder / 2) {
        return [];
      }

      const coordinates: Point = {
        x,
        y
      };

      return {
        coordinates,
        isOccupied: false,
        isOasis: false,
        backgroundColor: '#B9D580',
        type: null
      };
    });
  };

  private static generateBorderTiles = (size: number, tiles: Tile[]): Tile[] => {
    return tiles.map((tile: Tile) => {
      if (Math.round(Math.sqrt(tile.coordinates.x ** 2 + tile.coordinates.y ** 2)) >= (size / 4 + this.BORDER_SIZE)) {
        return {
          ...tile,
          isBorderField: true,
          backgroundColor: '#A9A9A9'
        };
      }
      return tile;
    });
  };

  private static generateFreeTileType = (): ResourceFieldType => {
    const randomInt: number = randomIntFromInterval(1, 91);
    const weightedResourceFieldType: { [key in number]: ResourceFieldType } = {
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
}
