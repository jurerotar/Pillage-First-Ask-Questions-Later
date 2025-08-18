import type { Database } from 'app/interfaces/models/common';
import type { Server } from 'app/interfaces/models/game/server';
import {
  calculateGridLayout,
  encodeGraphicsProperty,
  packTileId,
  parseCoordinatesFromTileId,
} from 'app/utils/map';
import type { DbTile } from 'app/interfaces/models/db/tile';
import { type PRNGFunction, prngMulberry32 } from 'ts-seedrandom';
import {
  seededRandomArrayElement,
  seededRandomIntFromInterval,
} from 'app/utils/common';
import type { Resource } from 'app/interfaces/models/game/resource';
import type { ResourceFieldComposition } from 'app/interfaces/models/game/village';
import { batchInsert } from 'app/db/utils/batch-insert';

type PartialDbTile = Omit<
  DbTile,
  'type' | 'oasis_graphics' | 'resource_field_composition'
> & {
  oasis_graphics: null;
  resource_field_composition: null;
};

type MaybeAssignedDbTile = DbTile | PartialDbTile;

const generateGrid = (server: Server): MaybeAssignedDbTile[] => {
  const { configuration } = server;

  const { halfSize, borderWidth, totalTiles } = calculateGridLayout(
    configuration.mapSize,
  );

  let xCoordinateCounter = -halfSize - 1;
  let yCoordinateCounter = halfSize;

  let tileId = 0;

  const tiles = new Array(totalTiles);

  for (let i = 0; i < totalTiles; i++) {
    tileId += 1;
    xCoordinateCounter += 1;
    const x = xCoordinateCounter;
    const y = yCoordinateCounter;

    if (xCoordinateCounter === halfSize) {
      xCoordinateCounter = -halfSize - 1;
      yCoordinateCounter -= 1;
    }

    const distanceSquared = x ** 2 + y ** 2;
    const thresholdSquared = (halfSize - borderWidth / 2) ** 2;

    // This needs to be in a separate if statement so that satisfies works correctly
    if (distanceSquared >= thresholdSquared) {
      tiles[i] = {
        id: tileId,
        x,
        y,
        type: 'oasis-tile',
        resource_field_composition: null,
        oasis_graphics: encodeGraphicsProperty('wood', 0, 0, 0),
      } satisfies DbTile;
      continue;
    }

    // Initial user village
    if (x === 0 && y === 0) {
      tiles[i] = {
        id: tileId,
        x,
        y,
        type: 'free-tile',
        resource_field_composition: '4446',
        oasis_graphics: null,
      } satisfies DbTile;
      continue;
    }

    tiles[i] = {
      id: tileId,
      x,
      y,
      resource_field_composition: null,
      oasis_graphics: null,
    } satisfies PartialDbTile;
  }

  return tiles;
};

type GenerateOasisTileArgs = {
  tile: MaybeAssignedDbTile;
  oasisGroup: number;
  oasisGroupPosition: number[];
  preGeneratedResourceType?: Resource;
  prng: PRNGFunction;
};

const generateOasisTile = ({
  tile,
  oasisGroup,
  oasisGroupPosition,
  prng,
  preGeneratedResourceType,
}: GenerateOasisTileArgs): DbTile => {
  const oasisResource = (() => {
    if (preGeneratedResourceType) {
      return preGeneratedResourceType;
    }

    // We need to have double non-wheat resources, because you have a change to have a wheat oasis on non-wheat oasis (clay-wheat,...)
    return seededRandomArrayElement<Resource>(prng, [
      'wheat',
      'iron',
      'clay',
      'wood',
      'wood',
      'clay',
      'iron',
    ]);
  })();

  const [row, column] = oasisGroupPosition;

  const encodedGraphics = encodeGraphicsProperty(
    oasisResource,
    oasisGroup,
    row,
    column,
  );

  return {
    ...tile,
    type: 'oasis-tile',
    oasis_graphics: encodedGraphics,
  } satisfies DbTile;
};

type Shape = { group: number; shape: number[] };

const generateShapedOasisFields = (
  server: Server,
  tiles: MaybeAssignedDbTile[],
): MaybeAssignedDbTile[] => {
  const prng = prngMulberry32(server.seed);

  const shapes: Shape[] = [
    {
      group: 1,
      shape: [2],
    },
    {
      group: 2,
      shape: [2, 2],
    },
    {
      group: 3,
      shape: [1, 1, 1],
    },
  ];

  const shapesByResource: Record<Resource, Shape[]> = {
    wood: [...shapes, { group: 4, shape: [3] }],
    clay: shapes,
    // Iron doesn't have shape 3
    iron: [
      ...shapes.filter(({ group }) => group !== 3),
      { group: 4, shape: [3] },
    ],
    wheat: shapes,
  };

  const tilesByCoordinates = new Map<
    MaybeAssignedDbTile['id'],
    MaybeAssignedDbTile
  >(tiles.map((tile) => [tile.id, tile]));

  tileLoop: for (let i = 0; i < tiles.length; i += 1) {
    const currentTile = tiles[i];

    if (Object.hasOwn(currentTile, 'type')) {
      continue; // Skip already occupied tiles
    }

    const willTileBeOasis: boolean =
      seededRandomIntFromInterval(prng, 1, 20) === 1;

    if (!willTileBeOasis) {
      continue;
    }

    const { x, y } = parseCoordinatesFromTileId(currentTile.id);
    const resourceType: Resource = seededRandomArrayElement<Resource>(prng, [
      'wheat',
      'iron',
      'clay',
      'wood',
    ]);
    const { group: oasisGroup, shape: oasisShape } = seededRandomArrayElement(
      prng,
      shapesByResource[resourceType],
    );

    const tilesToUpdate: MaybeAssignedDbTile[] = [];
    const oasisGroupPositions: number[][] = [];

    for (let k = 0; k < oasisShape.length; k += 1) {
      const amountOfTiles = oasisShape[k];
      for (let j = 0; j < amountOfTiles; j += 1) {
        const targetId = packTileId(x + j, y - k);
        const tile = tilesByCoordinates.get(targetId);

        if (!tile || Object.hasOwn(tile, 'type')) {
          continue tileLoop;
        }

        oasisGroupPositions.push([k, j]);
        tilesToUpdate.push(tile);
      }
    }

    for (const [index, tile] of tilesToUpdate.entries()) {
      const oasisTile = generateOasisTile({
        tile,
        oasisGroup,
        oasisGroupPosition: oasisGroupPositions[index],
        preGeneratedResourceType: resourceType,
        prng,
      });
      Object.assign(tile, oasisTile);
    }
  }

  return tiles;
};

const weightedResourceFieldComposition: [number, ResourceFieldComposition][] = [
  [1, '00018'],
  [2, '11115'],
  [4, '3339'],
  [7, '4437'],
  [10, '4347'],
  [13, '3447'],
  [21, '3456'],
  [29, '4356'],
  [37, '3546'],
  [45, '4536'],
  [53, '5346'],
  [61, '5436'],
];

const generateOccupiableTileType = (
  prng: PRNGFunction,
): ResourceFieldComposition => {
  const randomInt = seededRandomIntFromInterval(prng, 1, 90);

  for (const [weight, composition] of weightedResourceFieldComposition) {
    if (randomInt <= weight) {
      return composition;
    }
  }

  // Fallback for randomInt > all defined weights
  return '4446';
};

const assignOasisAndFreeTileComposition = (
  server: Server,
  tiles: MaybeAssignedDbTile[],
): DbTile[] => {
  const prng = prngMulberry32(server.seed);

  return tiles.map((tile): DbTile => {
    // 1. If it already has a type from previous steps, just return
    if (Object.hasOwn(tile, 'type')) {
      return tile as DbTile;
    }

    const willBeOasis = seededRandomIntFromInterval(prng, 1, 20) === 1;
    if (willBeOasis) {
      return generateOasisTile({
        tile,
        oasisGroup: 0,
        oasisGroupPosition: [0, 0],
        prng,
      });
    }

    // If it's not an oasis, generate a resource composition
    const resourceFieldComposition = generateOccupiableTileType(prng);

    const tileData = {
      ...tile,
      type: 'free-tile',
      resource_field_composition: resourceFieldComposition,
    } satisfies DbTile;

    return tileData;
  });
};

export const tilesSeeder = (database: Database, server: Server): void => {
  const emptyTiles = generateGrid(server);
  const tilesWithShapedOasisFields = generateShapedOasisFields(
    server,
    emptyTiles,
  );
  const tilesWithSingleOasisAndFreeTileTypes =
    assignOasisAndFreeTileComposition(server, tilesWithShapedOasisFields);

  batchInsert(
    database,
    'tiles',
    ['x', 'y', 'type', 'resource_field_composition', 'oasis_graphics'],
    tilesWithSingleOasisAndFreeTileTypes,
    (tile) => [
      tile.x,
      tile.y,
      tile.type,
      tile.resource_field_composition,
      tile.oasis_graphics,
    ],
  );
};
