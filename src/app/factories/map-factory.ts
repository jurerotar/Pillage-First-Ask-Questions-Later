import { isOccupiableOasisTile, isOccupiedOccupiableTile } from 'app/[game]/utils/guards/map-guards';
import { seededRandomArrayElement, seededRandomArrayElements, seededRandomIntFromInterval, seededShuffleArray } from 'app/utils/common';
import type { Point } from 'interfaces/models/common';
import type { Player } from 'interfaces/models/game/player';
import type { Resource, ResourceCombination } from 'interfaces/models/game/resource';
import type { Server } from 'interfaces/models/game/server';
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
} from 'interfaces/models/game/tile';
import type { ResourceFieldComposition } from 'interfaces/models/game/village';
import { prng_alea } from 'esm-seedrandom';
import type { PRNGFunction } from 'interfaces/libs/esm-seedrandom';

type OasisShapes = Record<Resource, Array<{ group: number; shape: number[] }>>;

const oasisShapes: OasisShapes = {
  wheat: [
    {
      group: 1,
      shape: [2, 2],
    },
    {
      group: 2,
      shape: [2],
    },
    {
      group: 3,
      shape: [3, 3, 2],
    },
    {
      group: 4,
      shape: [1, 3, 3],
    },
    {
      group: 5,
      shape: [3, 3],
    },
  ],
  iron: [
    {
      group: 1,
      shape: [3, 3],
    },
    {
      group: 2,
      shape: [1, 2],
    },
    {
      group: 3,
      shape: [2],
    },
    {
      group: 4,
      shape: [2, 1, 1],
    },
    {
      group: 5,
      shape: [2, 3, 3],
    },
    {
      group: 8,
      shape: [1, 1],
    },
  ],
  wood: [
    {
      group: 1,
      shape: [2],
    },
    {
      group: 2,
      shape: [2, 2, 3],
    },
    {
      group: 3,
      shape: [3, 2],
    },
    {
      group: 4,
      shape: [2, 1],
    },
  ],
  clay: [
    {
      group: 1,
      shape: [2, 1],
    },
    {
      group: 2,
      shape: [2, 3],
    },
    {
      group: 3,
      shape: [1, 1],
    },
    {
      group: 4,
      shape: [2],
    },
  ],
};

type Distances = {
  offset: number;
  distanceFromCenter: number;
};

const weightedVillageSize: Record<number, OccupiedOccupiableTile['villageSize']> = {
  5: 'lg',
  20: 'md',
  50: 'sm',
};

const generateVillageSize = (prng: PRNGFunction): OccupiedOccupiableTile['villageSize'] => {
  const randomInt: number = seededRandomIntFromInterval(prng, 1, 100);

  for (const weight in weightedVillageSize) {
    if (randomInt <= Number(weight)) {
      return weightedVillageSize[weight];
    }
  }

  return 'xs';
};

const weightedResourceFieldComposition: Record<number, ResourceFieldComposition> = {
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
  60: '5436',
};

const generateOccupiableTileType = (prng: PRNGFunction): ResourceFieldComposition => {
  const randomInt: number = seededRandomIntFromInterval(prng, 1, 80);

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

    if (preGeneratedResourceType === 'wood') {
      return seededRandomArrayElement<Resource | ResourceCombination>(prng, ['wood', 'wood-wheat']);
    }

    if (preGeneratedResourceType === 'clay') {
      return seededRandomArrayElement<Resource | ResourceCombination>(prng, ['clay', 'clay-wheat']);
    }

    if (preGeneratedResourceType === 'iron') {
      return seededRandomArrayElement<Resource | ResourceCombination>(prng, ['iron', 'iron-wheat']);
    }

    return 'wheat';
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

const generateGrid = ({ server }: { server: Server }): BaseTile[] => {
  const {
    seed,
    configuration: { mapSize: size },
  } = server;

  let xCoordinateCounter: number = -size / 2 - 1;
  let yCoordinateCounter: number = size / 2;

  return [...Array((size + 1) ** 2)].map(() => {
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
      y,
    };

    return {
      id: `${seed}-${xCoordinateCounter}-${yCoordinateCounter}`,
      coordinates,
      graphics: {
        backgroundColor: '#B9D580',
      },
    };
  });
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
    villageSize: 'xs',
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

  const prng = prng_alea(server.seed);

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
      villageSize: 'lg',
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

  const prng = prng_alea(server.seed);

  const tilesByCoordinates = tiles.reduce(
    (acc, tile) => {
      acc[`${tile.coordinates.x},${tile.coordinates.y}`] = tile;
      return acc;
    },
    {} as Record<string, MaybeOccupiedBaseTile>,
  );

  tileLoop: for (let i = 0; i < tilesWithOasisShapes.length; i += 1) {
    const currentTile = tilesWithOasisShapes[i];

    if (Object.hasOwn(currentTile, 'type')) {
      continue; // Skip already occupied tiles
    }

    const willTileBeOasis: boolean = seededRandomIntFromInterval(prng, 1, 25) === 1;

    if (!willTileBeOasis) {
      continue;
    }

    const { coordinates: tileCoordinates } = currentTile;
    const resourceType: Resource = seededRandomArrayElement<Resource>(prng, ['wheat', 'iron', 'clay', 'wood']);
    const oasisShapesForResource = oasisShapes[resourceType];
    const selectedOasis = seededRandomArrayElement(prng, oasisShapesForResource);
    const { group: oasisGroup, shape: oasisShape } = selectedOasis;

    const tilesToUpdate: BaseTile[] = [];
    const oasisGroupPositions: number[][] = [];

    for (let k = 0; k < oasisShape.length; k += 1) {
      const amountOfTiles = oasisShape[k];
      for (let j = 0; j < amountOfTiles; j += 1) {
        const tile: MaybeOccupiedBaseTile | undefined = tilesByCoordinates[`${j + tileCoordinates.x},${tileCoordinates.y - k}`];

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
  const prng = prng_alea(server.seed);

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
  const prng = prng_alea(server.seed);

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
  const prng = prng_alea(server.seed);

  return tiles.map((tile: Tile) => {
    if (tile.type !== 'free-tile' || Object.hasOwn(tile, 'ownedBy')) {
      return tile;
    }
    const willBeOccupied = seededRandomIntFromInterval(prng, 1, 3) === 1;
    const willBeATreasureVillage = willBeOccupied ? seededRandomIntFromInterval(prng, 1, 5) === 1 : false;
    const treasureType = willBeATreasureVillage
      ? seededRandomArrayElement<Exclude<OccupiedOccupiableTile['treasureType'], 'null' | 'artifact'>>(prng, [
          'hero-item',
          'currency',
          'resources',
        ])
      : null;

    const villageSize = generateVillageSize(prng);

    return {
      ...tile,
      ...(willBeOccupied && {
        ownedBy: seededRandomArrayElement<Player>(prng, npcPlayers).id,
        treasureType,
        villageSize,
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
  const prng = prng_alea(server.seed);

  const villageSizeToMaxOasisAmountMap = new Map<OccupiedOccupiableTile['villageSize'], number>([
    ['sm', 1],
    ['md', 2],
    ['lg', 3],
  ]);

  const oasisTiles = tiles.filter(isOccupiableOasisTile);

  const npcVillagesEligibleForOasis = tiles.filter((tile: Tile) => {
    return !(!isOccupiedOccupiableTile(tile) || tile.ownedBy === 'player' || tile.villageSize === 'xs');
  }) as OccupiedOccupiableTile[];

  const oasisTilesByCoordinate = oasisTiles.reduce(
    (acc, oasisTile) => {
      const { coordinates } = oasisTile;
      const key = `${coordinates.x},${coordinates.y}`;
      acc[key] = acc[key] || [];
      acc[key].push(oasisTile);
      return acc;
    },
    {} as Record<string, OccupiableOasisTile[]>,
  );

  for (const tile of npcVillagesEligibleForOasis) {
    const { villageSize, coordinates: villageCoordinates } = tile;

    const maxOasisAmount = villageSizeToMaxOasisAmountMap.get(villageSize)!;
    const eligibleOasisTiles: OccupiableOasisTile[] = [];

    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const key = `${villageCoordinates.x + dx},${villageCoordinates.y + dy}`;
        if (oasisTilesByCoordinate[key]) {
          eligibleOasisTiles.push(...oasisTilesByCoordinate[key]);
        }
      }
    }

    const selectedOasis = seededRandomArrayElements<OccupiableOasisTile>(prng, eligibleOasisTiles, maxOasisAmount);

    for (const tileToUpdate of selectedOasis) {
      // This assertion is okay, since by assigning a villageId, it's now a OccupiedOasisTile
      (tileToUpdate as never as OccupiedOasisTile).villageId = tile.id;
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
