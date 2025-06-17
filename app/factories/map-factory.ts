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
import { prngAlea, type PRNGFunction } from 'ts-seedrandom';
import {
  calculateGridLayout,
  encodeGraphicsProperty,
  packTileId,
  parseCoordinatesFromTileId,
} from 'app/utils/map';

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

const weightedResourceFieldComposition: Record<
  number,
  ResourceFieldComposition
> = {
  1: '00018',
  2: '11115',
  4: '3339',
  7: '4437',
  10: '4347',
  13: '3447',
  21: '3456',
  29: '4356',
  37: '3546',
  45: '4536',
  53: '5346',
  61: '5436',
};

const generateOccupiableTileType = (
  prng: PRNGFunction,
): ResourceFieldComposition => {
  const randomInt: number = seededRandomIntFromInterval(prng, 1, 90);

  for (const weight in weightedResourceFieldComposition) {
    if (randomInt <= Number(weight)) {
      return weightedResourceFieldComposition[weight];
    }
  }

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

  const encodedGraphics = encodeGraphicsProperty(
    oasisResource,
    oasisGroup,
    row,
    column,
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

  const { halfSize, borderWidth, totalTiles } = calculateGridLayout(
    configuration.mapSize,
  );

  let xCoordinateCounter = -halfSize - 1;
  let yCoordinateCounter = halfSize;

  const tiles = new Array(totalTiles);

  for (let i = 0; i < totalTiles; i++) {
    xCoordinateCounter += 1;
    const x = xCoordinateCounter;
    const y = yCoordinateCounter;

    if (xCoordinateCounter === halfSize) {
      xCoordinateCounter = -halfSize - 1;
      yCoordinateCounter -= 1;
    }

    const distance = Math.sqrt(x ** 2 + y ** 2);

    // This needs to be in a separate if statement so that satisfies works correctly
    if (distance >= halfSize - borderWidth / 2) {
      tiles[i] = {
        id: packTileId(x, y),
        type: 1,
        ORB: [],
        graphics: encodeGraphicsProperty('wood', 0, 0, 0),
        villageId: null,
      } satisfies OasisTile;
      continue;
    }

    // Initial user village
    if (x === 0 && y === 0) {
      tiles[i] = {
        id: packTileId(x, y),
        type: 0,
        RFC: '4446',
        ownedBy: 'player',
      } satisfies OccupiedOccupiableTile;
      continue;
    }

    tiles[i] = {
      id: packTileId(x, y),
    } satisfies BaseTile;
  }

  return tiles;
};

const generateShapedOasisFields = (
  server: Server,
  tiles: MaybeOccupiedBaseTile[],
): MaybeOccupiedBaseTile[] => {
  const tilesWithOasisShapes: MaybeOccupiedBaseTile[] = [...tiles];

  const prng = prngAlea(server.seed);

  const tilesByCoordinates = new Map<Tile['id'], MaybeOccupiedBaseTile>(
    tiles.map((tile) => [tile.id, tile]),
  );

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

    const tilesToUpdate: BaseTile[] = [];
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

    tilesToUpdate.forEach((tile, index) => {
      const oasisTile = generateOasisTile({
        tile,
        oasisGroup,
        oasisGroupPosition: oasisGroupPositions[index],
        preGeneratedResourceType: resourceType,
        prng,
      });
      Object.assign(tile, oasisTile);
    });
  }

  return tilesWithOasisShapes;
};

// Some NPC villages have occupied oasis tiles
const assignOasisToNpcVillages = (server: Server, tiles: Tile[]): Tile[] => {
  const prng = prngAlea(server.seed);

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
    if (!isOccupiedOccupiableTile(tile) || tile.ownedBy === 'player') {
      return false;
    }

    const villageSize = getVillageSize(server.configuration.mapSize, tile.id);
    const maxAmountOfOccupiableOasis =
      villageSizeToMaxOasisAmountMap.get(villageSize)!;
    return maxAmountOfOccupiableOasis > 0;
  }) as OccupiedOccupiableTile[];

  const oasisTilesByCoordinates = new Map<Tile['id'], OasisTile>(
    oasisTiles.map((tile) => [tile.id, tile]),
  );

  for (const tile of npcVillagesEligibleForOasis) {
    const { x, y } = parseCoordinatesFromTileId(tile.id);
    const villageSize = getVillageSize(server.configuration.mapSize, tile.id);

    const maxOasisAmount = villageSizeToMaxOasisAmountMap.get(villageSize)!;
    let assignedOasisCounter = 0;

    outer: for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const key = packTileId(x + dx, y + dy);
        if (!oasisTilesByCoordinates.has(key)) {
          continue;
        }

        const willOasisBeAssigned =
          seededRandomIntFromInterval(prng, 1, 3) === 1;

        if (!willOasisBeAssigned) {
          continue;
        }

        const tileToUpdate = oasisTilesByCoordinates.get(key)!;

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
  const prng = prngAlea(server.seed);

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

    const tileData = {
      ...tile,
      type: 0,
      RFC: resourceFieldComposition,
    } satisfies OccupiableTile;

    return tileData;
  });
};

// This function is kinda heavy and slow, see if you can find any performance improvements
const assignNpcPlayers = (
  server: Server,
  tiles: Tile[],
  npcPlayers: Player[],
): Tile[] => {
  const prng = prngAlea(server.seed);

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

  const npcOccupiableTilesMap = new Map(
    npcOccupiableTiles.map((tile) => [tile.id, tile]),
  );

  const getNthMapValue = (map: Map<number, Tile>, n: number): Tile => {
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
    npcOccupiableTilesMap.delete(startingTile.id);

    const villageSize = getVillageSize(
      server.configuration.mapSize,
      startingTile.id,
    );
    const radius = villageSizeToVillageGroupRadiusMap.get(villageSize) ?? 0;
    const extraVillageCount =
      villageSizeToAmountOfSupportingVillagesMap.get(villageSize) ?? 0;

    const { x, y } = parseCoordinatesFromTileId(startingTile.id);

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

        const id = packTileId(x + dx, y + dy);
        if (!npcOccupiableTilesMap.has(id)) {
          continue;
        }

        const candidateTile = npcOccupiableTilesMap.get(id)!;
        (candidateTile as OccupiedOccupiableTile).ownedBy = player.id;

        npcOccupiableTilesMap.delete(id);
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
