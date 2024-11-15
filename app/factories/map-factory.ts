import { isOccupiableOasisTile, isOccupiedOccupiableTile } from 'app/(game)/utils/guards/map-guards';
import { getVillageSize } from 'app/factories/utils/common';
import type { Point } from 'app/interfaces/models/common';
import type { Player } from 'app/interfaces/models/game/player';
import type { Resource, ResourceCombination } from 'app/interfaces/models/game/resource';
import type { Server } from 'app/interfaces/models/game/server';
import type {
  BaseTile,
  MaybeOccupiedBaseTile,
  MaybeOccupiedOrOasisBaseTile,
  MaybeOccupiedOrOasisOccupiableTile,
  OasisResourceBonus,
  OasisTile,
  OccupiableOasisTile,
  OccupiableTile,
  OccupiedOasisTile,
  OccupiedOccupiableTile,
  Tile,
} from 'app/interfaces/models/game/tile';
import type { ResourceFieldComposition, VillageSize } from 'app/interfaces/models/game/village';
import { seededRandomArrayElement, seededRandomIntFromInterval, seededShuffleArray } from 'app/utils/common';
import { prngAlea, type PRNGFunction } from 'ts-seedrandom';

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
  iron: [...shapes.filter(({ group }) => group !== 3), { group: 4, shape: [3] }],
  wheat: shapes,
};

type Distances = {
  offset: number;
  distanceFromCenter: number;
};

const weightedResourceFieldComposition: Record<number, ResourceFieldComposition> = {
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

const generateOccupiableTileType = (prng: PRNGFunction): ResourceFieldComposition => {
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

const generateOasisTile = ({ tile, oasisGroup, oasisGroupPosition, prng, preGeneratedResourceType }: GenerateOasisTileArgs): OasisTile => {
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

  return {
    ...tile,
    type: 'oasis-tile',
    oasisResourceBonus,
    villageId: null,
    graphics: {
      oasisResource,
      oasisGroup,
      oasisGroupPosition,
      oasisVariant: 0,
    },
  };
};

const getPredefinedVillagesDistances = (server: Server): Distances => {
  const {
    configuration: { mapSize },
  } = server;
  // Artifact villages are positioned 80% distance from center at the points of a rotated octagon. You can picture a stop sign.
  const distanceFromCenter = Math.round(0.8 * (mapSize / 2));
  const octagonSideLengthFormula = (incircleRadius: number) => (2 * incircleRadius) / (1 + Math.sqrt(2));
  // Offset is exactly 1/2 of octagon side length
  const offset = Math.round(octagonSideLengthFormula(distanceFromCenter) / 2);

  return {
    offset,
    distanceFromCenter,
  };
};

const getPredefinedVillagesCoordinates = (server: Server): Record<string, Point[]> => {
  const { offset, distanceFromCenter } = getPredefinedVillagesDistances(server);

  const artifactVillagesCoordinates = [
    { x: -offset, y: distanceFromCenter },
    { x: offset, y: distanceFromCenter },
    { x: -offset, y: -distanceFromCenter },
    { x: offset, y: -distanceFromCenter },
    { x: distanceFromCenter, y: offset },
    { x: distanceFromCenter, y: -offset },
    { x: -distanceFromCenter, y: offset },
    { x: -distanceFromCenter, y: -offset },
  ];

  return {
    artifactVillagesCoordinates,
  };
};

const generateGrid = ({ server }: { server: Server }): (BaseTile | OasisTile)[] => {
  const {
    configuration: { mapSize: size },
  } = server;

  const borderWidth = 4;
  const totalSize = Math.ceil(size * Math.sqrt(2)) + borderWidth;
  const halfSize = totalSize / 2;
  const totalTiles = (totalSize + 1) ** 2;

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

    tiles[i] = {
      id: `${x}-${y}`,
      coordinates: { x, y },
      ...(distance >= halfSize - borderWidth / 2 && {
        type: 'oasis-tile',
        oasisResourceBonus: [],
        graphics: {
          oasisResource: 'wood',
          oasisGroup: 0,
          oasisGroupPosition: [0, 0],
          oasisVariant: 0,
        },
      }),
    } satisfies OasisTile | BaseTile;
  }

  return tiles;
};

type GenerateInitialUserVillageArgs = {
  tiles: BaseTile[];
  player: Player;
};

const generateInitialUserVillage = ({ tiles, player }: GenerateInitialUserVillageArgs): MaybeOccupiedBaseTile[] => {
  const tilesToUpdate: MaybeOccupiedBaseTile[] = [...tiles];

  const initialUserTileFindFunction = ({ coordinates }: BaseTile) => coordinates.x === 0 && coordinates.y === 0;

  const indexToUpdate = tiles.findIndex(initialUserTileFindFunction);
  const initialUserTile = tiles[indexToUpdate];

  tilesToUpdate[indexToUpdate] = {
    ...initialUserTile,
    type: 'free-tile',
    resourceFieldComposition: '4446',
    ownedBy: player.id,
    treasureType: null,
  } satisfies OccupiedOccupiableTile;

  return tilesToUpdate;
};

type GeneratePredefinedVillagesArgs = {
  server: Server;
  tiles: MaybeOccupiedBaseTile[];
  npcPlayers: Player[];
};

const generatePredefinedVillages = ({ server, tiles, npcPlayers }: GeneratePredefinedVillagesArgs): MaybeOccupiedBaseTile[] => {
  const tilesToUpdate = [...tiles];
  const { artifactVillagesCoordinates } = getPredefinedVillagesCoordinates(server);

  const prng = prngAlea(server.seed);

  // Since there's 4 npc players and 8 predefined villages, we just duplicate the npc players array, so each faction gets 2 villages
  const players = seededShuffleArray<Player>(prng, [...npcPlayers, ...npcPlayers]);

  [...artifactVillagesCoordinates].forEach(({ x, y }: Point, index: number) => {
    const playerId = players[index].id;
    const tileFindFunction = ({ coordinates }: BaseTile) => coordinates.x === x && coordinates.y === y;

    const tileToUpdateIndex = tiles.findIndex(tileFindFunction);
    const tileToUpdate = tiles[tileToUpdateIndex];

    tilesToUpdate[tileToUpdateIndex] = {
      ...tileToUpdate,
      type: 'free-tile',
      resourceFieldComposition: '4446',
      ownedBy: playerId,
      treasureType: 'artifact',
    } satisfies OccupiedOccupiableTile;
  });

  return tilesToUpdate;
};

type GenerateShapedOasisFieldsArgs = {
  server: Server;
  tiles: MaybeOccupiedBaseTile[];
};

const generateShapedOasisFields = ({ server, tiles }: GenerateShapedOasisFieldsArgs): MaybeOccupiedBaseTile[] => {
  const tilesWithOasisShapes: MaybeOccupiedBaseTile[] = [...tiles];

  const prng = prngAlea(server.seed);

  const tilesByCoordinates = new Map<string, MaybeOccupiedBaseTile>(
    tiles.map((tile) => [`${tile.coordinates.x},${tile.coordinates.y}`, tile]),
  );

  tileLoop: for (let i = 0; i < tilesWithOasisShapes.length; i += 1) {
    const currentTile = tilesWithOasisShapes[i];

    if (Object.hasOwn(currentTile, 'type')) {
      continue; // Skip already occupied tiles
    }

    const willTileBeOasis: boolean = seededRandomIntFromInterval(prng, 1, 20) === 1;

    if (!willTileBeOasis) {
      continue;
    }

    const { coordinates: tileCoordinates } = currentTile;
    const resourceType: Resource = seededRandomArrayElement<Resource>(prng, ['wheat', 'iron', 'clay', 'wood']);
    const { group: oasisGroup, shape: oasisShape } = seededRandomArrayElement(prng, shapesByResource[resourceType]);

    const tilesToUpdate: BaseTile[] = [];
    const oasisGroupPositions: number[][] = [];

    for (let k = 0; k < oasisShape.length; k += 1) {
      const amountOfTiles = oasisShape[k];
      for (let j = 0; j < amountOfTiles; j += 1) {
        const tile: MaybeOccupiedBaseTile | undefined = tilesByCoordinates.get(`${j + tileCoordinates.x},${tileCoordinates.y - k}`)!;

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

type GenerateSingleOasisFieldsArgs = {
  server: Server;
  tiles: MaybeOccupiedBaseTile[];
};

const generateSingleOasisFields = ({ server, tiles }: GenerateSingleOasisFieldsArgs): MaybeOccupiedBaseTile[] => {
  const prng = prngAlea(server.seed);

  // To make world feel more alive and give player more options, we sprinkle a bunch of 1x1 oasis on empty fields as well
  return tiles.map((tile: MaybeOccupiedBaseTile) => {
    // If field is already an oasis, or a free field, continue
    if (Object.hasOwn(tile, 'type')) {
      return tile;
    }

    const willBeOccupied = seededRandomIntFromInterval(prng, 1, 20) === 1;
    if (!willBeOccupied) {
      return tile;
    }

    return generateOasisTile({ tile, oasisGroup: 0, oasisGroupPosition: [0, 0], prng });
  });
};

type GenerateOccupiableTileTypesArgs = {
  server: Server;
  tiles: MaybeOccupiedOrOasisBaseTile[];
};

const generateOccupiableTileTypes = ({ server, tiles }: GenerateOccupiableTileTypesArgs): MaybeOccupiedOrOasisOccupiableTile[] => {
  const prng = prngAlea(server.seed);

  return tiles.map((tile: MaybeOccupiedOrOasisBaseTile) => {
    if (Object.hasOwn(tile, 'type')) {
      return tile as MaybeOccupiedOrOasisOccupiableTile;
    }
    return {
      ...tile,
      type: 'free-tile',
      resourceFieldComposition: generateOccupiableTileType(prng),
    } satisfies OccupiableTile;
  });
};

type PopulateOccupiableTilesArgs = {
  server: Server;
  tiles: Tile[];
  npcPlayers: Player[];
};

const populateOccupiableTiles = ({ server, tiles, npcPlayers }: PopulateOccupiableTilesArgs): Tile[] => {
  const prng = prngAlea(server.seed);

  return tiles.map((tile: Tile) => {
    if (tile.type !== 'free-tile' || Object.hasOwn(tile, 'ownedBy') || tile.resourceFieldComposition !== '4446') {
      return tile;
    }
    const willBeOccupied = seededRandomIntFromInterval(prng, 1, 2) === 1;
    const willBeATreasureVillage = willBeOccupied ? seededRandomIntFromInterval(prng, 1, 5) === 1 : false;
    const treasureType = willBeATreasureVillage
      ? seededRandomArrayElement<Exclude<OccupiedOccupiableTile['treasureType'], 'null' | 'artifact'>>(prng, [
          'hero-item',
          'currency',
          'resources',
        ])
      : null;

    return {
      ...tile,
      ...(willBeOccupied && {
        ownedBy: seededRandomArrayElement<Player>(prng, npcPlayers).id,
        treasureType,
      }),
    };
  });
};

type AssignOasisToNpcVillagesArgs = {
  server: Server;
  tiles: Tile[];
};

// Some NPC villages have occupied oasis tiles
const assignOasisToNpcVillages = ({ server, tiles }: AssignOasisToNpcVillagesArgs): Tile[] => {
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

    const villageSize = getVillageSize(server.configuration.mapSize, tile.coordinates);
    const maxAmountOfOccupiableOasis = villageSizeToMaxOasisAmountMap.get(villageSize)!;
    return maxAmountOfOccupiableOasis > 0;
  }) as OccupiedOccupiableTile[];

  const oasisTilesByCoordinates = new Map<string, OccupiableOasisTile>(
    oasisTiles.map((tile) => [`${tile.coordinates.x},${tile.coordinates.y}`, tile]),
  );

  for (const tile of npcVillagesEligibleForOasis) {
    const { coordinates: villageCoordinates } = tile;
    const villageSize = getVillageSize(server.configuration.mapSize, tile.coordinates);

    const maxOasisAmount = villageSizeToMaxOasisAmountMap.get(villageSize)!;
    let assignedOasisCounter = 0;

    outer: for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const key = `${villageCoordinates.x + dx},${villageCoordinates.y + dy}`;
        if (!oasisTilesByCoordinates.has(key)) {
          continue;
        }

        const willOasisBeAssigned = seededRandomIntFromInterval(prng, 1, 3) === 1;

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

type MapFactoryProps = {
  server: Server;
  players: Player[];
};

export const mapFactory = ({ server, players }: MapFactoryProps): Tile[] => {
  const npcPlayers = players.filter(({ faction }) => faction !== 'player');
  const player = players.find(({ faction }) => faction === 'player')!;

  const emptyTiles = generateGrid({ server });
  const tilesWithInitialUserVillage = generateInitialUserVillage({ tiles: emptyTiles, player });
  const tilesWithPredefinedVillages = generatePredefinedVillages({ server, tiles: tilesWithInitialUserVillage, npcPlayers });
  const tilesWithShapedOasisFields = generateShapedOasisFields({ server, tiles: tilesWithPredefinedVillages });
  const tilesWithSingleOasisFields = generateSingleOasisFields({ server, tiles: tilesWithShapedOasisFields });
  const tilesWithOccupiableTileTypes = generateOccupiableTileTypes({ server, tiles: tilesWithSingleOasisFields });
  const tilesWithPopulatedOccupiableTiles = populateOccupiableTiles({ server, tiles: tilesWithOccupiableTileTypes, npcPlayers });
  const tilesWithAssignedOasis = assignOasisToNpcVillages({ server, tiles: tilesWithPopulatedOccupiableTiles });

  return tilesWithAssignedOasis;
};
