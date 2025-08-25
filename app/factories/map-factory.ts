import {
  isOccupiableOasisTile,
  isOccupiedOccupiableTile,
  isUnoccupiedOccupiableTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { getVillageSize } from 'app/factories/utils/village';
import type { Player } from 'app/interfaces/models/game/player';
import type {
  Resource,
  ResourceCombination,
} from 'app/interfaces/models/game/resource';
import type { Server } from 'app/interfaces/models/game/server';
import type {
  BaseTile,
  MaybeOccupiedBaseTile,
  MaybeOccupiedOrOasisBaseTile,
  OasisResourceBonus,
  OasisTile,
  OccupiableTile,
  OccupiedOasisTile,
  OccupiedOccupiableTile,
  Tile,
} from 'app/interfaces/models/game/tile';
import type {
  ResourceFieldComposition,
  VillageSize,
} from 'app/interfaces/models/game/village';
import {
  seededRandomArrayElement,
  seededRandomIntFromInterval,
} from 'app/utils/common';
import { prngMulberry32, type PRNGFunction } from 'ts-seedrandom';
import { calculateGridLayout, encodeGraphicsProperty } from 'app/utils/map';
import { PLAYER_ID } from 'app/constants/player';

type Shape = { group: number; shape: number[] };

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
  {
    group: 4,
    shape: [3],
  },
];

const shapesByResource: Record<Resource, Shape[]> = {
  wood: shapes,
  clay: shapes,
  iron: shapes,
  wheat: shapes,
};

const oasisBorderVariants = [1, 2, 3, 4];

type Variant = Record<Shape['group'], number[]>;

// TODO: Enable this whenever a need for oasis variants arises
const _variantsByResourceAndShape: Record<Resource, Variant> = {
  wood: {
    0: [0],
    1: [0],
    2: [0],
    3: [0],
    4: [0],
  },
  clay: {
    0: [0],
    1: [0],
    2: [0],
    3: [0],
  },
  iron: {
    0: [0],
    1: [0],
    2: [0],
    4: [0],
  },
  wheat: {
    0: [0],
    1: [0],
    2: [0],
    3: [0],
  },
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

type GenerateOasisTileArgs = {
  tile: MaybeOccupiedOrOasisBaseTile;
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
}: GenerateOasisTileArgs): OasisTile => {
  const resourceType = (() => {
    if (!preGeneratedResourceType) {
      return seededRandomArrayElement<Resource | ResourceCombination>(prng, [
        'wheat',
        'iron',
        'clay',
        'wood',
        'wood-wheat',
        'clay-wheat',
        'iron-wheat',
      ]);
    }

    if (preGeneratedResourceType === 'wheat') {
      return 'wheat';
    }

    const willBeDoubleOasis = seededRandomIntFromInterval(prng, 1, 2) === 1;

    if (!willBeDoubleOasis) {
      return preGeneratedResourceType;
    }

    return `${preGeneratedResourceType}-wheat`;
  })();

  const isResourceCombination = resourceType.includes('-');

  const willOasisHaveABonus = seededRandomIntFromInterval(prng, 1, 3) >= 2;

  const oasisResourceBonus = ((): OasisResourceBonus[] => {
    if (!willOasisHaveABonus) {
      return [];
    }

    if (isResourceCombination) {
      const resourceTypes = resourceType.split('-') as Resource[];
      return resourceTypes.map((resource: Resource) => ({
        resource,
        bonus: '25%',
      }));
    }

    const willBe50PercentBonus = seededRandomIntFromInterval(prng, 1, 10) === 1;

    return [
      {
        resource: resourceType as Resource,
        bonus: willBe50PercentBonus ? '50%' : '25%',
      },
    ];
  })();

  const oasisResource = (() => {
    if (isResourceCombination) {
      return (resourceType.split('-') as Resource[])[0];
    }

    return resourceType;
  })() as Resource;

  const [row, column] = oasisGroupPosition;

  // const oasisVariants = variantsByResourceAndShape[oasisResource][oasisGroup];
  // const variant = seededRandomArrayElement(prng, oasisVariants);
  const variant = 0;

  const encodedGraphics = encodeGraphicsProperty(
    oasisResource,
    oasisGroup,
    row,
    column,
    variant,
  );

  return {
    ...tile,
    type: 1,
    ORB: oasisResourceBonus,
    villageId: null,
    graphics: encodedGraphics,
  };
};

const generateGrid = (server: Server): (BaseTile | OasisTile)[] => {
  const { configuration } = server;

  const prng = prngMulberry32(server.seed);

  const { halfSize, borderWidth, totalTiles } = calculateGridLayout(
    configuration.mapSize,
  );

  let xCoordinateCounter = -halfSize - 1;
  let yCoordinateCounter = halfSize;

  const tiles = new Array(totalTiles);

  let id = -1;

  for (let i = 0; i < totalTiles; i++) {
    id += 1;
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
      const variant = seededRandomArrayElement(prng, oasisBorderVariants);

      tiles[i] = {
        id,
        coordinates: {
          x,
          y,
        },
        type: 1,
        ORB: [],
        graphics: encodeGraphicsProperty('wood', 0, 0, 0, variant),
        villageId: null,
      } satisfies OasisTile;
      continue;
    }

    // Initial user village
    if (x === 0 && y === 0) {
      tiles[i] = {
        id,
        coordinates: {
          x,
          y,
        },
        type: 0,
        RFC: '4446',
        ownedBy: PLAYER_ID,
      } satisfies OccupiedOccupiableTile;
      continue;
    }

    tiles[i] = {
      id,
      coordinates: {
        x,
        y,
      },
    } satisfies BaseTile;
  }

  return tiles;
};

const generateShapedOasisFields = (
  server: Server,
  tiles: MaybeOccupiedBaseTile[],
): MaybeOccupiedBaseTile[] => {
  const tilesWithOasisShapes: MaybeOccupiedBaseTile[] = [...tiles];

  const prng = prngMulberry32(server.seed);

  const tilesByCoordinates = new Map<
    `${Tile['coordinates']['x']}-${Tile['coordinates']['y']}`,
    MaybeOccupiedBaseTile
  >(tiles.map((tile) => [`${tile.coordinates.x}-${tile.coordinates.y}`, tile]));

  tileLoop: for (let i = 0; i < tilesWithOasisShapes.length; i += 1) {
    const currentTile = tilesWithOasisShapes[i];

    if (Object.hasOwn(currentTile, 'type')) {
      continue; // Skip already occupied tiles
    }

    const willTileBeOasis: boolean =
      seededRandomIntFromInterval(prng, 1, 20) === 1;

    if (!willTileBeOasis) {
      continue;
    }

    const { x, y } = currentTile.coordinates;
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

    const tilesToUpdate: BaseTile[] = [];
    const oasisGroupPositions: number[][] = [];

    for (let k = 0; k < oasisShape.length; k += 1) {
      const amountOfTiles = oasisShape[k];
      for (let j = 0; j < amountOfTiles; j += 1) {
        const key: `${Tile['coordinates']['x']}-${Tile['coordinates']['y']}` = `${x + j}-${y - k}`;
        const tile = tilesByCoordinates.get(key);

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

  return tilesWithOasisShapes;
};

// Some NPC villages have occupied oasis tiles
const assignOasisToNpcVillages = (server: Server, tiles: Tile[]): Tile[] => {
  const prng = prngMulberry32(server.seed);

  const villageSizeToMaxOasisAmountMap = new Map<VillageSize, number>([
    ['xxs', 0],
    ['xs', 0],
    ['sm', 0],
    ['md', 1],
    ['lg', 1],
    ['xl', 2],
    ['2xl', 2],
    ['3xl', 3],
    ['4xl', 3],
  ]);

  const oasisTiles = tiles.filter(isOccupiableOasisTile);

  const npcVillagesEligibleForOasis = tiles.filter((tile: Tile) => {
    if (!isOccupiedOccupiableTile(tile) || tile.ownedBy === PLAYER_ID) {
      return false;
    }

    const villageSize = getVillageSize(
      server.configuration.mapSize,
      tile.coordinates,
    );
    const maxAmountOfOccupiableOasis =
      villageSizeToMaxOasisAmountMap.get(villageSize)!;
    return maxAmountOfOccupiableOasis > 0;
  }) as OccupiedOccupiableTile[];

  const oasisTilesByCoordinates = new Map<
    `${Tile['coordinates']['x']}-${Tile['coordinates']['y']}`,
    OasisTile
  >(
    oasisTiles.map((tile) => [
      `${tile.coordinates.x}-${tile.coordinates.y}`,
      tile,
    ]),
  );

  for (const tile of npcVillagesEligibleForOasis) {
    const { x, y } = tile.coordinates;
    const villageSize = getVillageSize(
      server.configuration.mapSize,
      tile.coordinates,
    );

    const maxOasisAmount = villageSizeToMaxOasisAmountMap.get(villageSize)!;
    let assignedOasisCounter = 0;

    outer: for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const key: `${Tile['coordinates']['x']}-${Tile['coordinates']['y']}` = `${x + dx}-${y + dy}`;
        const tileToUpdate = oasisTilesByCoordinates.get(key);
        if (!tileToUpdate) {
          continue;
        }

        const willOasisBeAssigned =
          seededRandomIntFromInterval(prng, 1, 3) === 1;

        if (!willOasisBeAssigned) {
          continue;
        }

        (tileToUpdate as never as OccupiedOasisTile).villageId = tile.id;
        assignedOasisCounter += 1;

        // Delete key to make sure other villages can't overwrite it
        oasisTilesByCoordinates.delete(key);

        if (assignedOasisCounter === maxOasisAmount) {
          break outer;
        }
      }
    }
  }

  return tiles;
};

const assignOasisAndFreeTileComposition = (
  server: Server,
  tiles: MaybeOccupiedBaseTile[],
): Tile[] => {
  const prng = prngMulberry32(server.seed);

  return tiles.map((tile): Tile => {
    // 1. If it already has a type from previous steps, just return
    if (Object.hasOwn(tile, 'type')) {
      return tile as Tile;
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

    return {
      ...tile,
      type: 0,
      RFC: resourceFieldComposition,
    } satisfies OccupiableTile;
  });
};

// This function is kinda heavy and slow, see if you can find any performance improvements
const assignNpcPlayers = (
  server: Server,
  tiles: Tile[],
  npcPlayers: Player[],
): Tile[] => {
  const prng = prngMulberry32(server.seed);

  const villageSizeToVillageGroupRadiusMap = new Map<VillageSize, number>([
    ['xxs', 0],
    ['xs', 0],
    ['sm', 0],
    ['md', 3],
    ['lg', 4],
    ['xl', 5],
    ['2xl', 6],
    ['3xl', 7],
    ['4xl', 8],
  ]);

  const villageSizeToAmountOfSupportingVillagesMap = new Map<
    VillageSize,
    number
  >([
    ['xxs', 0],
    ['xs', 0],
    ['sm', 0],
    ['md', 1],
    ['lg', 2],
    ['xl', 4],
    ['2xl', 7],
    ['3xl', 10],
    ['4xl', 15],
  ]);

  const npcOccupiableTiles = tiles.filter((tile) => {
    return isUnoccupiedOccupiableTile(tile) && tile.RFC === '4446';
  });

  const npcOccupiableTilesMap = new Map<
    `${Tile['coordinates']['x']}-${Tile['coordinates']['y']}`,
    Tile
  >(
    npcOccupiableTiles.map((tile) => [
      `${tile.coordinates.x}-${tile.coordinates.y}`,
      tile,
    ]),
  );

  const getNthMapValue = (
    map: Map<`${Tile['coordinates']['x']}-${Tile['coordinates']['y']}`, Tile>,
    n: number,
  ): Tile => {
    let i = 0;
    for (const value of map.values()) {
      if (i === n) {
        return value;
      }
      i++;
    }
    throw new Error('Index out of range');
  };

  for (const player of npcPlayers) {
    // Select a random tile for the main village
    const startIndex = seededRandomIntFromInterval(
      prng,
      0,
      npcOccupiableTilesMap.size - 1,
    );
    const startingTile = getNthMapValue(npcOccupiableTilesMap, startIndex);

    // Assign player to this tile
    (startingTile as OccupiedOccupiableTile).ownedBy = player.id;
    npcOccupiableTilesMap.delete(
      `${startingTile.coordinates.x}-${startingTile.coordinates.y}`,
    );

    const villageSize = getVillageSize(
      server.configuration.mapSize,
      startingTile.coordinates,
    );
    const radius = villageSizeToVillageGroupRadiusMap.get(villageSize) ?? 0;
    const extraVillageCount =
      villageSizeToAmountOfSupportingVillagesMap.get(villageSize) ?? 0;

    const { x, y } = startingTile.coordinates;

    let assigned = 0;
    outer: for (let dx = -radius; dx <= radius; dx++) {
      if (assigned === extraVillageCount) {
        break;
      }

      for (let dy = -radius; dy <= radius; dy++) {
        if (assigned === extraVillageCount) {
          break outer;
        }

        if (dx === 0 && dy === 0) {
          continue;
        }

        const key: `${Tile['coordinates']['x']}-${Tile['coordinates']['y']}` = `${x + dx}-${y + dy}`;
        if (!npcOccupiableTilesMap.has(key)) {
          continue;
        }

        const candidateTile = npcOccupiableTilesMap.get(key)!;
        (candidateTile as OccupiedOccupiableTile).ownedBy = player.id;

        npcOccupiableTilesMap.delete(key);
        assigned++;

        if (assigned === extraVillageCount) {
          break outer;
        }
      }
    }
  }

  return tiles;
};

type MapFactoryProps = {
  server: Server;
  npcPlayers: Player[];
};

export const mapFactory = ({ server, npcPlayers }: MapFactoryProps): Tile[] => {
  const emptyTiles = generateGrid(server);
  const tilesWithShapedOasisFields = generateShapedOasisFields(
    server,
    emptyTiles,
  );
  const tilesWithSingleOasisAndFreeTileTypes =
    assignOasisAndFreeTileComposition(server, tilesWithShapedOasisFields);
  const tilesWithNpcPlayers = assignNpcPlayers(
    server,
    tilesWithSingleOasisAndFreeTileTypes,
    npcPlayers,
  );
  const tilesWithAssignedOasis = assignOasisToNpcVillages(
    server,
    tilesWithNpcPlayers,
  );
  return tilesWithAssignedOasis;
};
