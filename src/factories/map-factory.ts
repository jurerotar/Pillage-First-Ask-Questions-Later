import { ResourceFieldComposition } from 'interfaces/models/game/village';
import { seededRandomArrayElement, seededRandomIntFromInterval, seededShuffleArray } from 'utils/common';
import {
  BaseTile,
  MaybeOccupiedBaseTile,
  MaybeOccupiedOrOasisBaseTile,
  MaybeOccupiedOrOasisOccupiableTile, OasisResourceBonus,
  OasisTile,
  OccupiableTile,
  OccupiedOccupiableTile,
  Tile
} from 'interfaces/models/game/tile';
import { Point } from 'interfaces/models/common';
import { Resource, ResourceCombination } from 'interfaces/models/game/resource';
import { Server } from 'interfaces/models/game/server';
import { createHash } from 'sha1-uint8array';
import { Player } from 'interfaces/models/game/player';

export type OasisShapes = Record<Resource, {
  backgroundColor: string;
  shapes: Array<{
    group: number;
    shape: number[][];
  }>;
}>;

const oasisShapes: OasisShapes = {
  wheat: {
    backgroundColor: '#FFF600',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 1],
          [0, 1, 1]
        ]
      },
      {
        group: 2,
        shape: [
          [0, 1, 1]
        ]
      },
      {
        group: 3,
        shape: [
          [0, 1, 3],
          [0, 1, 2],
          [1, 1, 2],
          [0, 1, 1]
        ]
      },
      {
        group: 4,
        shape: [
          [0, 1, 1],
          [0, 1, 2],
          [0, 1, 2]
        ]
      },
      {
        group: 5,
        shape: [
          [0, 1, 1],
          [1, 1, 2],
          [1, 1, 1],
          [1, 1, 0]
        ]
      },
      {
        group: 6,
        shape: [
          [0, 1, 0],
          [0, 1, 0]
        ]
      }
      // {
      //   group: 6,
      //   shape: [
      //     [0, 1, 2],
      //     [0, 1, 2],
      //     [0, 1, 3],
      //     [0, 0, 3]
      //   ]
      // },
    ]
  },
  iron: {
    backgroundColor: '#7B90A1',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 2],
          [0, 1, 2]
        ]
      },
      {
        group: 2,
        shape: [
          [0, 1, 0],
          [0, 1, 1]
        ]
      },
      {
        group: 3,
        shape: [
          [0, 1, 1]
        ]
      },
      {
        group: 4,
        shape: [
          [0, 1, 1],
          [0, 1, 0],
          [0, 1, 0]
        ]
      },
      {
        group: 5,
        shape: [
          [0, 1, 1],
          [0, 1, 2],
          [0, 1, 2]
        ]
      },
      {
        group: 8,
        shape: [
          [0, 1, 0],
          [0, 1, 0]
        ]
      }
    ]
  },
  wood: {
    backgroundColor: '#426002',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 1]
        ]
      },
      {
        group: 2,
        shape: [
          [0, 1, 1],
          [0, 0, 1],
          [0, 0, 1]
        ]
      },
      {
        group: 3,
        shape: [
          [0, 1, 2],
          [0, 0, 1]
        ]
      },
      {
        group: 4,
        shape: [
          [0, 1, 1],
          [0, 1, 0],
          [0, 1, 0]
        ]
      },
      {
        group: 5,
        shape: [
          [0, 1, 0],
          [0, 1, 0]
        ]
      },
      {
        group: 6,
        shape: [
          [1, 0, 1],
          [1, 1, 1]
        ]
      }
    ]
  },
  clay: {
    backgroundColor: '#C29760',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 0],
          [0, 1, 1]
        ]
      },
      {
        group: 2,
        shape: [
          [0, 1, 1],
          [0, 0, 1]
        ]
      },
      {
        group: 3,
        shape: [
          [0, 1, 1],
          [0, 1, 0]
        ]
      },
      {
        group: 4,
        shape: [
          [0, 1, 0],
          [0, 1, 1],
          [0, 0, 1]
        ]
      },
      {
        group: 5,
        shape: [
          [0, 1, 1]
        ]
      }
    ]
  }
};

type Distances = {
  offset: number;
  distanceFromCenter: number;
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
  60: '5436'
};

const generateOccupiableTileType = (tile: MaybeOccupiedOrOasisBaseTile): ResourceFieldComposition => {
  const randomInt: number = seededRandomIntFromInterval(tile.tileId, 1, 80);

  // eslint-disable-next-line no-restricted-syntax
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
      return seededRandomArrayElement<Resource | ResourceCombination>(tile.tileId, ['wheat', 'iron', 'clay', 'wood', 'wood-wheat', 'clay-wheat', 'iron-wheat']);
    }

    if (preGeneratedResourceType === 'wood') {
      return seededRandomArrayElement<Resource | ResourceCombination>(tile.tileId, ['wood', 'wood-wheat']);
    }

    if (preGeneratedResourceType === 'clay') {
      return seededRandomArrayElement<Resource | ResourceCombination>(tile.tileId, ['clay', 'clay-wheat']);
    }

    if (preGeneratedResourceType === 'iron') {
      return seededRandomArrayElement<Resource | ResourceCombination>(tile.tileId, ['iron', 'iron-wheat']);
    }

    return 'wheat';
  })();

  const isResourceCombination = resourceType.includes('-');

  // wood-wheat -> wood
  const typeForGraphic = (isResourceCombination ? resourceType.split('-')[0] : resourceType) as Resource;
  const willOasisHaveABonus = seededRandomIntFromInterval(tile.tileId, 1, 3) >= 2;

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

    const willBe50PercentBonus = seededRandomIntFromInterval(tile.tileId, 1, 10) === 1;

    return [
      {
        resource: resourceType as Resource,
        bonus: willBe50PercentBonus ? '50%' : '25%'
      }
    ];
  })();

  return {
    ...tile,
    type: 'oasis-tile',
    oasisResourceBonus,
    graphics: {
      oasisGroup,
      backgroundColor: oasisShapes[typeForGraphic].backgroundColor,
      oasisGroupPosition
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

  return {
    artifactVillagesCoordinates
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
      tileId: createHash()
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
    treasureType: null
  } satisfies OccupiedOccupiableTile;

  return tilesToUpdate;
};

const generatePredefinedVillages = (server: Server, npcPlayers: Player[], tiles: MaybeOccupiedBaseTile[]): MaybeOccupiedBaseTile[] => {
  const tilesToUpdate = [...tiles];
  const { artifactVillagesCoordinates } = getPredefinedVillagesCoordinates(server);
  // Used for seeding array shuffling, so we get same result every time
  const joinedSeeds: string = tiles.reduce((accumulator: string, tile) => accumulator + tile.tileId, '');

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
      treasureType: 'artifact'
    } satisfies OccupiedOccupiableTile;
  });

  return tilesToUpdate;
};

const generateShapedOasisFields = (tiles: MaybeOccupiedBaseTile[]): MaybeOccupiedBaseTile[] => {
  const tilesWithOasisShapes: MaybeOccupiedBaseTile[] = [...tiles];

  for (let i = 0; i < tilesWithOasisShapes.length; i += 1) {
    const currentTile: MaybeOccupiedBaseTile = tilesWithOasisShapes[i];
    if (Object.hasOwn(currentTile, 'type')) {
      continue;
    }

    const tileWillBeOasis: boolean = seededRandomIntFromInterval(currentTile.tileId, 1, 25) === 1;

    // Determine oasis position and shape
    if (tileWillBeOasis) {
      // Surrounding tiles will have to become oasis as well, depending on shape of the oasis
      const tilesToUpdate: BaseTile[] = [];
      const resourceType: Resource = seededRandomArrayElement<Resource>(currentTile.tileId, ['wheat', 'iron', 'clay', 'wood']);
      const { shapes } = oasisShapes[resourceType];
      const selectedOasis = shapes[seededRandomArrayElement(currentTile.tileId, [...Array(shapes.length)
        .keys()])];
      const {
        group: oasisGroup,
        shape: oasisShape
      } = selectedOasis;

      const {
        x,
        y
      }: Point = currentTile.coordinates;

      let breakCondition: boolean = false;
      // Get the position of individual tile in oasisShapes matrix, this way we know which graphic to show
      const oasisGroupPositions: number[][] = [];

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
          const tile: MaybeOccupiedBaseTile | undefined = tilesWithOasisShapes.find(
            (cell: MaybeOccupiedBaseTile) => cell.coordinates.y === y - k && cell.coordinates.x === j
          );
          if (!tile) {
            breakCondition = true;
            break;
          }
          if (Object.hasOwn(tile, 'type')) {
            breakCondition = true;
            break;
          }

          oasisGroupPositions.push([k, j]);
          tilesToUpdate.push(tile);
        }
      }
      if (breakCondition) {
        continue;
      }

      tilesToUpdate.forEach((occupiedCell: BaseTile, index) => {
        const cellToUpdateFindFunction = (cell: BaseTile) => {
          return cell.coordinates.x === occupiedCell.coordinates.x && cell.coordinates.y === occupiedCell.coordinates.y;
        };

        const oasisGroupPosition = oasisGroupPositions[index];

        const cellToUpdateIndex = tilesWithOasisShapes.findIndex(cellToUpdateFindFunction);
        const cellToUpdate = tilesWithOasisShapes[cellToUpdateIndex];

        tilesWithOasisShapes[cellToUpdateIndex] = generateOasisTile(cellToUpdate, oasisGroup, oasisGroupPosition, resourceType);
      });
    }
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
    const willBeOccupied = seededRandomIntFromInterval(tile.tileId, 1, 5) === 1;
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
      resourceFieldComposition: generateOccupiableTileType(tile)
    } satisfies OccupiableTile;
  });
};

// This method will mark which fields will have villages
const populateOccupiableTiles = (tiles: Tile[], npcPlayers: Player[]): Tile[] => {
  return tiles.map((tile: Tile) => {
    if (tile.type !== 'free-tile' && !Object.hasOwn(tile, 'ownedBy')) {
      return tile;
    }
    const willBeOccupied = seededRandomIntFromInterval(tile.tileId, 1, 3) === 1;
    const willBeATreasureVillage = willBeOccupied ? seededRandomIntFromInterval(tile.tileId, 1, 5) === 1 : false;
    const treasureType = willBeATreasureVillage
      ? seededRandomArrayElement<Exclude<OccupiedOccupiableTile['treasureType'], 'null' | 'artifact'>>(tile.tileId, ['hero-item', 'currency', 'resources'])
      : null;

    return {
      ...tile,
      ...(willBeOccupied && {
        ownedBy: seededRandomArrayElement<Player>(tile.tileId, npcPlayers).id,
        treasureType
      })
    };
  });
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

  return tilesWithPopulatedOccupiableTiles;
};
