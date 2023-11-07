import { ResourceFieldType } from 'interfaces/models/game/village';
import { seededRandomArrayElement, seededRandomIntFromInterval } from 'utils/common';
import {
  BaseTile,
  FreeTile,
  MaybeOccupiedBaseTile,
  MaybeOccupiedOrOasisBaseTile,
  MaybeOccupiedOrOasisFreeTile,
  OasisTile,
  OccupiedFreeTile,
  Tile
} from 'interfaces/models/game/tile';
import { Point } from 'interfaces/models/common';
import { Resource, ResourceCombination } from 'interfaces/models/game/resource';
import { OasisShapes, oasisShapes } from 'constants/oasis-shapes';
import { Server } from 'interfaces/models/game/server';
import { createHash } from 'sha1-uint8array';

type Distances = {
  offset: number;
  distanceFromCenter: number;
};

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

const generateFreeTileType = (tile: MaybeOccupiedOrOasisBaseTile): ResourceFieldType => {
  const randomInt: number = seededRandomIntFromInterval(tile.seed, 1, 80);

  // eslint-disable-next-line no-restricted-syntax
  for (const weight in weightedResourceFieldType) {
    if (randomInt <= Number(weight)) {
      return weightedResourceFieldType[weight];
    }
  }

  return '4446';
};

const generateOasisTile = (tile: MaybeOccupiedOrOasisBaseTile, shapes: OasisShapes): OasisTile => {
  const resourceType = seededRandomArrayElement<Resource | ResourceCombination>(tile.seed, ['wheat', 'iron', 'clay', 'wood', 'wood-wheat', 'clay-wheat', 'iron-wheat']);
  const typeForGraphic = (resourceType.includes('-') ? resourceType.split('-')[0] : resourceType) as Resource;

  return {
    ...tile,
    type: 'oasis-tile',
    oasisType: resourceType,
    oasisBonus: null,
    graphics: {
      oasisGroup: 0,
      backgroundColor: shapes[typeForGraphic].backgroundColor
    }
  };
};

const getPredefinedVillagesDistances = (server: Server): Distances => {
  const { configuration: { mapSize } } = server;
  // Artifact villages are positioned 80% distance from center at the points of a rotated octagon. You can picture a stop sign.
  const distanceFromCenter = Math.round(0.8 * (mapSize / 2));
  const octagonSideLengthFormula = (incircleRadius: number) => (2 * incircleRadius) / (1 + Math.sqrt(2));
  // Offset is exactly 1/2 of octagon side length
  const offset = Math.round(octagonSideLengthFormula(distanceFromCenter) / 2);

  return {
    offset,
    distanceFromCenter
  };
};

const getPredefinedVillagesCoordinates = (server: Server): Record<string, Point[]> => {
  const {
    offset,
    distanceFromCenter
  } = getPredefinedVillagesDistances(server);

  const artifactVillagesCoordinates = [
    {
      x: -offset,
      y: distanceFromCenter
    },
    {
      x: offset,
      y: distanceFromCenter
    },
    {
      x: -offset,
      y: -distanceFromCenter
    },
    {
      x: offset,
      y: -distanceFromCenter
    },
    {
      x: distanceFromCenter,
      y: offset
    },
    {
      x: distanceFromCenter,
      y: -offset
    },
    {
      x: -distanceFromCenter,
      y: offset
    },
    {
      x: -distanceFromCenter,
      y: -offset
    }
  ];

  const quadrantBaseCoordinates = [
    {
      x: -distanceFromCenter,
      y: distanceFromCenter
    },
    {
      x: distanceFromCenter,
      y: distanceFromCenter
    },
    {
      x: -distanceFromCenter,
      y: -distanceFromCenter
    },
    {
      x: distanceFromCenter,
      y: -distanceFromCenter
    }
  ];

  return {
    artifactVillagesCoordinates,
    quadrantBaseCoordinates
  };
};

const generateGrid = (server: Server): BaseTile[] => {
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
      graphics: {
        backgroundColor: '#B9D580'
      }
    };
  });
};

const generateInitialUserVillage = (tiles: BaseTile[]): MaybeOccupiedBaseTile[] => {
  const tilesToUpdate: MaybeOccupiedBaseTile[] = [...tiles];

  const initialUserTileFindFunction = ({ coordinates }: BaseTile) => coordinates.x === 0 && coordinates.y === 0;

  const indexToUpdate = tiles.findIndex(initialUserTileFindFunction);
  const initialUserTile = tiles[indexToUpdate];

  tilesToUpdate[indexToUpdate] = {
    ...initialUserTile,
    type: 'free-tile',
    resourceFieldComposition: '4446',
    ownedBy: 'player'
  } satisfies OccupiedFreeTile;

  return tilesToUpdate;
};

const generatePredefinedVillages = (server: Server, tiles: MaybeOccupiedBaseTile[]): MaybeOccupiedBaseTile[] => {
  const tilesToUpdate = [...tiles];
  const {
    artifactVillagesCoordinates,
    quadrantBaseCoordinates
  } = getPredefinedVillagesCoordinates(server);

  [
    ...artifactVillagesCoordinates,
    ...quadrantBaseCoordinates
  ].forEach((coordinate: Point) => {
    const {
      x,
      y
    } = coordinate;

    const tileFindFunction = ({ coordinates }: BaseTile) => coordinates.x === x && coordinates.y === y;

    const tileToUpdateIndex = tiles.findIndex(tileFindFunction);
    const tileToUpdate = tiles[tileToUpdateIndex];

    tilesToUpdate[tileToUpdateIndex] = {
      ...tileToUpdate,
      type: 'free-tile',
      resourceFieldComposition: '4446',
      ownedBy: 'npc'
    } satisfies OccupiedFreeTile;
  });

  return tilesToUpdate;
};

const generateShapedOasisFields = (tiles: MaybeOccupiedBaseTile[]): MaybeOccupiedOrOasisBaseTile[] => {
  const tilesWithOasisShapes: MaybeOccupiedOrOasisBaseTile[] = [...tiles];

  for (let i = 0; i < tilesWithOasisShapes.length; i += 1) {
    const currentTile: MaybeOccupiedOrOasisBaseTile = tilesWithOasisShapes[i];
    if (Object.hasOwn(currentTile, 'type')) {
      continue;
    }

    const tileWillBeOasis: boolean = seededRandomIntFromInterval(currentTile.seed, 1, 15) === 1;

    // Determine oasis position and shape
    if (tileWillBeOasis) {
      // Surrounding tiles will have to become oasis as well, depending on shape of the oasis
      const tilesToUpdate: BaseTile[] = [];
      const resourceType: Resource = seededRandomArrayElement<Resource>(currentTile.seed, ['wheat', 'iron', 'clay', 'wood']);
      const { shapes } = oasisShapes[resourceType];
      const selectedOasis = shapes[seededRandomArrayElement(currentTile.seed, [...Array(shapes.length)
        .keys()])];
      const {
        shape: oasisShape
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
          const tile: MaybeOccupiedOrOasisBaseTile | undefined = tilesWithOasisShapes.find(
            (cell: MaybeOccupiedOrOasisBaseTile) => cell.coordinates.y === y - k && cell.coordinates.x === j
          );
          if (!tile) {
            breakCondition = true;
            break;
          }
          if (Object.hasOwn(tile, 'type')) {
            breakCondition = true;
            break;
          }

          tilesToUpdate.push(tile);
        }
      }
      if (breakCondition) {
        continue;
      }

      tilesToUpdate.forEach((occupiedCell: BaseTile) => {
        const cellToUpdateFindFunction = (cell: BaseTile) => {
          return cell.coordinates.x === occupiedCell.coordinates.x && cell.coordinates.y === occupiedCell.coordinates.y;
        };

        const cellToUpdateIndex = tilesWithOasisShapes.findIndex(cellToUpdateFindFunction);
        const cellToUpdate = tilesWithOasisShapes[cellToUpdateIndex];

        tilesWithOasisShapes[cellToUpdateIndex] = generateOasisTile(cellToUpdate, oasisShapes);
      });
    }
  }

  return tilesWithOasisShapes;
};

const generateSingleOasisFields = (tiles: MaybeOccupiedOrOasisBaseTile[]): MaybeOccupiedOrOasisBaseTile[] => {
  // To make world feel more alive and give player more options, we sprinkle a bunch of 1x1 oasis on empty fields as well
  return tiles.map((tile: MaybeOccupiedOrOasisBaseTile) => {
    // If field is already an oasis, or a free field, continue
    if (Object.hasOwn(tile, 'type') || Object.hasOwn(tile, 'oasisType')) {
      return tile;
    }
    const willBeOccupied = seededRandomIntFromInterval(tile.seed, 1, 5) === 1;
    if (!willBeOccupied) {
      return tile;
    }

    return generateOasisTile(tile, oasisShapes);
  });
};

const generateFreeTileTypes = (tiles: MaybeOccupiedOrOasisBaseTile[]): MaybeOccupiedOrOasisFreeTile[] => {
  return tiles.map((tile: MaybeOccupiedOrOasisBaseTile) => {
    if (Object.hasOwn(tile, 'type') || Object.hasOwn(tile, 'oasisType')) {
      return tile as MaybeOccupiedOrOasisFreeTile;
    }
    return {
      ...tile,
      type: 'free-tile',
      resourceFieldComposition: generateFreeTileType(tile)
    } satisfies FreeTile;
  });
};

// This method will mark which oasis will be actual resource oasis, but it does not add animals to them
const populateOasis = (tiles: Tile[]): Tile[] => {
  return tiles.map((tile: Tile) => {
    const willOasisHaveABonus = seededRandomIntFromInterval(tile.seed, 1, 3) >= 2;

    if (tile.type !== 'oasis-tile' || !willOasisHaveABonus) {
      return tile;
    }

    const oasisBonus = seededRandomArrayElement<OasisTile['oasisBonus']>(tile.seed, ['25%', '50%', null]);
    return {
      ...tile,
      oasisBonus
    };
  });
};

// This method will mark which fields will have villages, but it does not add them to fields
const populateFreeTiles = (tiles: Tile[]): Tile[] => {
  return tiles;
};

type MapFactoryProps = {
  server: Server;
};

export const mapFactory = ({ server }: MapFactoryProps): Tile[] => {
  const emptyTiles = generateGrid(server);
  const tilesWithInitialUserVillage = generateInitialUserVillage(emptyTiles);
  const tilesWithPredefinedVillages = generatePredefinedVillages(server, tilesWithInitialUserVillage);
  const tilesWithShapedOasisFields = generateShapedOasisFields(tilesWithPredefinedVillages);
  const tilesWithSingleOasisFields = generateSingleOasisFields(tilesWithShapedOasisFields);
  const tilesWithFreeTileTypes = generateFreeTileTypes(tilesWithSingleOasisFields);
  const tilesWithPopulatedOasis = populateOasis(tilesWithFreeTileTypes);
  const tilesWithPopulatedFreeTiles = populateFreeTiles(tilesWithPopulatedOasis);

  return tilesWithPopulatedFreeTiles;
};
