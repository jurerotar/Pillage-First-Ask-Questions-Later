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

export type OasisShapes = Record<
  Resource,
  {
    backgroundColor: string;
    shapes: Array<{
      group: number;
      shape: number[][];
    }>;
  }
>;

const oasisShapes: OasisShapes = {
  wheat: {
    backgroundColor: '#FFF600',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 1],
          [0, 1, 1],
        ],
      },
      {
        group: 2,
        shape: [[0, 1, 1]],
      },
      {
        group: 3,
        shape: [
          [0, 1, 3],
          [0, 1, 2],
          [1, 1, 2],
          [0, 1, 1],
        ],
      },
      {
        group: 4,
        shape: [
          [0, 1, 1],
          [0, 1, 2],
          [0, 1, 2],
        ],
      },
      {
        group: 5,
        shape: [
          [0, 1, 1],
          [1, 1, 2],
          [1, 1, 1],
          [1, 1, 0],
        ],
      },
      {
        group: 6,
        shape: [
          [0, 1, 0],
          [0, 1, 0],
        ],
      },
      // {
      //   group: 6,
      //   shape: [
      //     [0, 1, 2],
      //     [0, 1, 2],
      //     [0, 1, 3],
      //     [0, 0, 3]
      //   ]
      // },
    ],
  },
  iron: {
    backgroundColor: '#7B90A1',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 2],
          [0, 1, 2],
        ],
      },
      {
        group: 2,
        shape: [
          [0, 1, 0],
          [0, 1, 1],
        ],
      },
      {
        group: 3,
        shape: [[0, 1, 1]],
      },
      {
        group: 4,
        shape: [
          [0, 1, 1],
          [0, 1, 0],
          [0, 1, 0],
        ],
      },
      {
        group: 5,
        shape: [
          [0, 1, 1],
          [0, 1, 2],
          [0, 1, 2],
        ],
      },
      {
        group: 8,
        shape: [
          [0, 1, 0],
          [0, 1, 0],
        ],
      },
    ],
  },
  wood: {
    backgroundColor: '#426002',
    shapes: [
      {
        group: 1,
        shape: [[0, 1, 1]],
      },
      {
        group: 2,
        shape: [
          [0, 1, 1],
          [0, 0, 1],
          [0, 0, 1],
        ],
      },
      {
        group: 3,
        shape: [
          [0, 1, 2],
          [0, 0, 1],
        ],
      },
      {
        group: 4,
        shape: [
          [0, 1, 1],
          [0, 1, 0],
          [0, 1, 0],
        ],
      },
      {
        group: 5,
        shape: [
          [0, 1, 0],
          [0, 1, 0],
        ],
      },
      {
        group: 6,
        shape: [
          [1, 0, 1],
          [1, 1, 1],
        ],
      },
    ],
  },
  clay: {
    backgroundColor: '#C29760',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 0],
          [0, 1, 1],
        ],
      },
      {
        group: 2,
        shape: [
          [0, 1, 1],
          [0, 0, 1],
        ],
      },
      {
        group: 3,
        shape: [
          [0, 1, 1],
          [0, 1, 0],
        ],
      },
      {
        group: 4,
        shape: [
          [0, 1, 0],
          [0, 1, 1],
          [0, 0, 1],
        ],
      },
      {
        group: 5,
        shape: [[0, 1, 1]],
      },
    ],
  },
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

const generateVillageSize = (tile: MaybeOccupiedOrOasisBaseTile): OccupiedOccupiableTile['villageSize'] => {
  const randomInt: number = seededRandomIntFromInterval(tile.id, 1, 100);

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

const generateOccupiableTileType = (tile: MaybeOccupiedOrOasisBaseTile): ResourceFieldComposition => {
  const randomInt: number = seededRandomIntFromInterval(tile.id, 1, 80);

  for (const weight in weightedResourceFieldComposition) {
    if (randomInt <= Number(weight)) {
      return weightedResourceFieldComposition[weight];
    }
  }

  return '4446';
};

const generateOasisTile = (
  tile: MaybeOccupiedOrOasisBaseTile,
  oasisGroup: number,
  oasisGroupPosition: number[],
  preGeneratedResourceType?: Resource
): OasisTile => {
  const resourceType = (() => {
    if (!preGeneratedResourceType) {
      return seededRandomArrayElement<Resource | ResourceCombination>(tile.id, [
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
      return seededRandomArrayElement<Resource | ResourceCombination>(tile.id, ['wood', 'wood-wheat']);
    }

    if (preGeneratedResourceType === 'clay') {
      return seededRandomArrayElement<Resource | ResourceCombination>(tile.id, ['clay', 'clay-wheat']);
    }

    if (preGeneratedResourceType === 'iron') {
      return seededRandomArrayElement<Resource | ResourceCombination>(tile.id, ['iron', 'iron-wheat']);
    }

    return 'wheat';
  })();

  const isResourceCombination = resourceType.includes('-');

  // wood-wheat -> wood
  const typeForGraphic = (isResourceCombination ? resourceType.split('-')[0] : resourceType) as Resource;
  const willOasisHaveABonus = seededRandomIntFromInterval(tile.id, 1, 3) >= 2;

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

    const willBe50PercentBonus = seededRandomIntFromInterval(tile.id, 1, 10) === 1;

    return [
      {
        resource: resourceType as Resource,
        bonus: willBe50PercentBonus ? '50%' : '25%',
      },
    ];
  })();

  return {
    ...tile,
    type: 'oasis-tile',
    oasisResourceBonus,
    villageId: null,
    graphics: {
      oasisGroup,
      backgroundColor: oasisShapes[typeForGraphic].backgroundColor,
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

const generateGrid = (server: Server): BaseTile[] => {
  const {
    id,
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
      id: `${id}-${xCoordinateCounter}-${yCoordinateCounter}`,
      serverId: id,
      coordinates,
      graphics: {
        backgroundColor: '#B9D580',
      },
    };
  });
};

const generateInitialUserVillage = (tiles: BaseTile[], player: Player): MaybeOccupiedBaseTile[] => {
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

const generatePredefinedVillages = (server: Server, npcPlayers: Player[], tiles: MaybeOccupiedBaseTile[]): MaybeOccupiedBaseTile[] => {
  const tilesToUpdate = [...tiles];
  const { artifactVillagesCoordinates } = getPredefinedVillagesCoordinates(server);
  // Used for seeding array shuffling, so we get same result every time
  const joinedSeeds: string = tiles.reduce((accumulator: string, tile) => accumulator + tile.id, '');

  // Since there's 4 npc players and 8 predefined villages, we just duplicate the npc players array, so each faction gets 2 villages
  const players = seededShuffleArray<Player>(joinedSeeds, [...npcPlayers, ...npcPlayers]);

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

const generateShapedOasisFields = (tiles: MaybeOccupiedBaseTile[]): MaybeOccupiedBaseTile[] => {
  const tilesWithOasisShapes: MaybeOccupiedBaseTile[] = [...tiles];

  const tilesByCoordinates = tiles.reduce(
    (acc, tile) => {
      acc[`${tile.coordinates.x},${tile.coordinates.y}`] = tile;
      return acc;
    },
    {} as Record<string, MaybeOccupiedBaseTile>
  );

  for (const currentTile of tilesWithOasisShapes) {
    if (Object.hasOwn(currentTile, 'type')) {
      continue; // Skip already occupied tiles
    }

    const willTileBeOasis: boolean = seededRandomIntFromInterval(currentTile.id, 1, 25) === 1;

    if (!willTileBeOasis) {
      continue;
    }

    const { coordinates: tileCoordinates } = currentTile;
    const resourceType: Resource = seededRandomArrayElement<Resource>(currentTile.id, ['wheat', 'iron', 'clay', 'wood']);
    const oasisShapesForResource = oasisShapes[resourceType];
    const selectedOasis = seededRandomArrayElement(currentTile.id, oasisShapesForResource.shapes);
    const { group: oasisGroup, shape: originalShape } = selectedOasis;

    const tilesToUpdate: BaseTile[] = [];
    const oasisGroupPositions: number[][] = [];

    outerLoop: for (let y = 0; y < originalShape.length; y++) {
      const row = originalShape[y];
      for (let x = 0; x < row.length; x++) {
        const [xMovementLeft, hasMiddleField, xMovementRight] = row;
        for (let dx = -xMovementLeft; dx <= xMovementRight; dx++) {
          if (!(dx === 0 && !hasMiddleField)) {
            const coordsKey = `${tileCoordinates.x + dx},${tileCoordinates.y - y}`;
            const tile = tilesByCoordinates[coordsKey];
            if (!tile || Object.hasOwn(tile, 'type')) {
              break outerLoop; // Move to the next tile
            }
            tilesToUpdate.push(tile);
            oasisGroupPositions.push([y, dx]);
          }
        }
      }
    }

    tilesToUpdate.forEach((tile, index) => {
      const oasisTile = generateOasisTile(tile, oasisGroup, oasisGroupPositions[index], resourceType);
      Object.assign(tile, oasisTile);
    });
  }

  return tilesWithOasisShapes;
};

const generateSingleOasisFields = (tiles: MaybeOccupiedBaseTile[]): MaybeOccupiedBaseTile[] => {
  // To make world feel more alive and give player more options, we sprinkle a bunch of 1x1 oasis on empty fields as well
  return tiles.map((tile: MaybeOccupiedBaseTile) => {
    // If field is already an oasis, or a free field, continue
    if (Object.hasOwn(tile, 'type') || Object.hasOwn(tile, 'oasisType')) {
      return tile;
    }
    const willBeOccupied = seededRandomIntFromInterval(tile.id, 1, 5) === 1;
    if (!willBeOccupied) {
      return tile;
    }

    return generateOasisTile(tile, 0, [0, 0]);
  });
};

const generateOccupiableTileTypes = (tiles: MaybeOccupiedOrOasisBaseTile[]): MaybeOccupiedOrOasisOccupiableTile[] => {
  return tiles.map((tile: MaybeOccupiedOrOasisBaseTile) => {
    if (Object.hasOwn(tile, 'type') || Object.hasOwn(tile, 'oasisType')) {
      return tile as MaybeOccupiedOrOasisOccupiableTile;
    }
    return {
      ...tile,
      type: 'free-tile',
      resourceFieldComposition: generateOccupiableTileType(tile),
    } satisfies OccupiableTile;
  });
};

// This method will mark which fields will have villages
const populateOccupiableTiles = (tiles: Tile[], npcPlayers: Player[]): Tile[] => {
  return tiles.map((tile: Tile) => {
    if (tile.type !== 'free-tile' || Object.hasOwn(tile, 'ownedBy')) {
      return tile;
    }
    const willBeOccupied = seededRandomIntFromInterval(tile.id, 1, 3) === 1;
    const willBeATreasureVillage = willBeOccupied ? seededRandomIntFromInterval(tile.id, 1, 5) === 1 : false;
    const treasureType = willBeATreasureVillage
      ? seededRandomArrayElement<Exclude<OccupiedOccupiableTile['treasureType'], 'null' | 'artifact'>>(tile.id, [
          'hero-item',
          'currency',
          'resources',
        ])
      : null;

    const villageSize = generateVillageSize(tile);

    return {
      ...tile,
      ...(willBeOccupied && {
        ownedBy: seededRandomArrayElement<Player>(tile.id, npcPlayers).id,
        treasureType,
        villageSize,
      }),
    };
  });
};

// Some NPC villages have occupied oasis tiles
const assignOasisToNpcVillages = (tiles: Tile[]): Tile[] => {
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
    {} as Record<string, OccupiableOasisTile[]>
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

    const selectedOasis = seededRandomArrayElements<OccupiableOasisTile>(tile.id, eligibleOasisTiles, maxOasisAmount);

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

  const emptyTiles = generateGrid(server);
  const tilesWithInitialUserVillage = generateInitialUserVillage(emptyTiles, player);
  const tilesWithPredefinedVillages = generatePredefinedVillages(server, npcPlayers, tilesWithInitialUserVillage);
  const tilesWithShapedOasisFields = generateShapedOasisFields(tilesWithPredefinedVillages);
  const tilesWithSingleOasisFields = generateSingleOasisFields(tilesWithShapedOasisFields);
  const tilesWithOccupiableTileTypes = generateOccupiableTileTypes(tilesWithSingleOasisFields);
  const tilesWithPopulatedOccupiableTiles = populateOccupiableTiles(tilesWithOccupiableTileTypes, npcPlayers);
  const tilesWithAssignedOasis = assignOasisToNpcVillages(tilesWithPopulatedOccupiableTiles);

  return tilesWithAssignedOasis;
};
