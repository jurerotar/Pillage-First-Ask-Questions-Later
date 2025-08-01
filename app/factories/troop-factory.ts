import type { Player } from 'app/interfaces/models/game/player';
import type {
  Resource,
  ResourceCombination,
} from 'app/interfaces/models/game/resource';
import type { Server } from 'app/interfaces/models/game/server';
import type {
  OasisTile,
  OccupiedOccupiableTile,
} from 'app/interfaces/models/game/tile';
import type { Tribe } from 'app/interfaces/models/game/tribe';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { NatureUnitId, UnitId } from 'app/interfaces/models/game/unit';
import type { VillageSize } from 'app/interfaces/models/game/village';
import { seededRandomIntFromInterval } from 'app/utils/common';
import { prngMulberry32 } from 'ts-seedrandom';
import { getUnitByTribeAndTier } from 'app/(game)/(village-slug)/utils/units';

type GenerateTroopsArgs = {
  server: Server;
  occupiableOasisTiles: OasisTile[];
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
  players: Player[];
};

const oasisTroopCombinations = new Map<
  Resource | ResourceCombination,
  [NatureUnitId, [number, number]][]
>([
  [
    'wood',
    [
      ['WILD_BOAR', [2, 11]],
      ['WOLF', [2, 7]],
      ['BEAR', [2, 5]],
    ],
  ],
  [
    'wood-wheat',
    [
      ['WILD_BOAR', [2, 11]],
      ['WOLF', [2, 7]],
      ['BEAR', [2, 5]],
    ],
  ],
  [
    'clay',
    [
      ['RAT', [3, 12]],
      ['SPIDER', [2, 10]],
      ['WILD_BOAR', [2, 7]],
    ],
  ],
  [
    'clay-wheat',
    [
      ['RAT', [3, 12]],
      ['SPIDER', [2, 10]],
      ['WILD_BOAR', [2, 7]],
    ],
  ],
  [
    'iron',
    [
      ['RAT', [2, 16]],
      ['SPIDER', [2, 12]],
      ['BAT', [2, 10]],
    ],
  ],
  [
    'iron-wheat',
    [
      ['RAT', [2, 16]],
      ['SPIDER', [2, 12]],
      ['BAT', [2, 10]],
    ],
  ],
  [
    'wheat',
    [
      ['RAT', [2, 20]],
      ['SERPENT', [2, 18]],
      ['TIGER', [2, 11]],
      ['CROCODILE', [2, 9]],
    ],
  ],
]);

// Each number array determines [min, max] of units.
// - Villages of size sm or larger should have scouts present.
// - Villages of size lg should have rams and catapults present
// - Villages of size xs should have between 20-120 troops present composed of only first and second unit
// - Villages of size sm should have between 150-450 troops present composed of only first and second unit + scouts
// - Villages of size md should have between 600-1200 troops present composed of any unit except rams and catapults
// - Villages of size lg should have between 1500-2500 troops present composed of any unit
// TODO: Units must be added and numbers must be tweaked!
// TODO: New village sizes were added, add missing stuff!
// TODO: These should be generated by some function
const npcUnitCompositionByTribeAndSize = new Map<
  Tribe,
  Map<VillageSize, [UnitId, number, number][]>
>([
  [
    'gauls',
    new Map([
      [
        'xs',
        [
          ['PHALANX', 10, 50],
          ['SWORDSMAN', 5, 40],
        ],
      ],
      [
        'sm',
        [
          ['PHALANX', 100, 200],
          ['SWORDSMAN', 60, 150],
          ['GAUL_SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['PHALANX', 300, 600],
          ['SWORDSMAN', 250, 400],
          ['GAUL_SCOUT', 20, 80],
          ['THEUTATES_THUNDER', 5, 40],
          ['DRUIDRIDER', 5, 40],
          ['HAEDUAN', 5, 40],
        ],
      ],
      [
        'lg',
        [
          ['PHALANX', 700, 1200],
          ['SWORDSMAN', 5, 40],
          ['GAUL_SCOUT', 5, 40],
          ['THEUTATES_THUNDER', 5, 40],
          ['DRUIDRIDER', 5, 40],
          ['HAEDUAN', 5, 40],
          ['GAUL_RAM', 20, 100],
          ['GAUL_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
  [
    'romans',
    new Map([
      [
        'xs',
        [
          ['LEGIONNAIRE', 10, 35],
          ['PRAETORIAN', 5, 25],
        ],
      ],
      [
        'sm',
        [
          ['LEGIONNAIRE', 10, 35],
          ['PRAETORIAN', 5, 25],
          ['ROMAN_SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['LEGIONNAIRE', 10, 35],
          ['PRAETORIAN', 5, 25],
          ['ROMAN_SCOUT', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['LEGIONNAIRE', 10, 35],
          ['PRAETORIAN', 5, 25],
          ['ROMAN_SCOUT', 5, 10],
          ['ROMAN_RAM', 20, 100],
          ['ROMAN_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
  [
    'teutons',
    new Map([
      [
        'xs',
        [
          ['CLUBSWINGER', 30, 100],
          ['SPEARMAN', 5, 30],
        ],
      ],
      [
        'sm',
        [
          ['CLUBSWINGER', 30, 100],
          ['SPEARMAN', 5, 30],
          ['TEUTONIC_SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['CLUBSWINGER', 30, 100],
          ['SPEARMAN', 5, 30],
          ['TEUTONIC_SCOUT', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['CLUBSWINGER', 30, 100],
          ['SPEARMAN', 5, 30],
          ['TEUTONIC_SCOUT', 5, 10],
          ['TEUTONIC_RAM', 20, 100],
          ['TEUTONIC_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
  [
    'huns',
    new Map([
      [
        'xs',
        [
          ['MERCENARY', 15, 45],
          ['BOWMAN', 5, 25],
        ],
      ],
      [
        'sm',
        [
          ['MERCENARY', 15, 45],
          ['BOWMAN', 5, 25],
          ['HUN_SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['MERCENARY', 15, 45],
          ['BOWMAN', 5, 25],
          ['HUN_SCOUT', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['MERCENARY', 15, 45],
          ['BOWMAN', 5, 25],
          ['HUN_SCOUT', 5, 10],
          ['HUN_RAM', 20, 100],
          ['HUN_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
  [
    'egyptians',
    new Map([
      [
        'xs',
        [
          ['SLAVE_MILITIA', 30, 70],
          ['ASH_WARDEN', 5, 20],
        ],
      ],
      [
        'sm',
        [
          ['SLAVE_MILITIA', 30, 70],
          ['ASH_WARDEN', 5, 20],
          ['EGYPTIAN_SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['SLAVE_MILITIA', 30, 70],
          ['ASH_WARDEN', 5, 20],
          ['EGYPTIAN_SCOUT', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['SLAVE_MILITIA', 30, 70],
          ['ASH_WARDEN', 5, 20],
          ['EGYPTIAN_SCOUT', 5, 10],
          ['EGYPTIAN_RAM', 20, 100],
          ['EGYPTIAN_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
]);

export const generateTroops = ({
  server,
  occupiableOasisTiles,
  occupiedOccupiableTiles,
  players,
}: GenerateTroopsArgs) => {
  const prng = prngMulberry32(server.seed);

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const oasisTroops: Troop[] = occupiableOasisTiles.flatMap(
    ({ id: tileId, ORB }) => {
      const resourceCombination = ORB.map(({ resource }) => resource).join(
        '-',
      ) as Resource | ResourceCombination;
      const troopIdsWithAmount =
        oasisTroopCombinations.get(resourceCombination)!;
      return troopIdsWithAmount.map((unitIdWithAmount) => {
        const [unitId, amount] = unitIdWithAmount;
        const [min, max] = amount;
        return {
          unitId,
          amount: seededRandomIntFromInterval(prng, min, max),
          source: tileId,
          tileId,
        } satisfies Troop;
      });
    },
  );

  const npcPlayersTroops: Troop[] = occupiedOccupiableTiles.flatMap(
    ({ id: tileId, ownedBy }) => {
      const { tribe } = playerMap.get(ownedBy)!;
      // TODO: Uncomment this once above TODOs are fixed
      //const villageSize = getVillageSize(server.configuration.mapSize, coordinates);
      const villageSize = 'xs';

      // Player starting units are handled separately
      if (ownedBy === 'player') {
        return [];
      }

      const unitCompositionByTribe =
        npcUnitCompositionByTribeAndSize.get(tribe)!;
      const unitCompositionBySize = unitCompositionByTribe.get(villageSize)!;

      return unitCompositionBySize.map((unitComposition) => {
        const [unitId, min, max] = unitComposition;

        return {
          unitId,
          amount: seededRandomIntFromInterval(prng, min, max),
          source: tileId,
          tileId,
        } satisfies Troop;
      });
    },
  );

  const npcTroops = [...oasisTroops, ...npcPlayersTroops];

  const { tribe } = playerMap.get('player')!;
  const { id: tileId } = occupiedOccupiableTiles.find(
    ({ ownedBy }) => ownedBy === 'player',
  )!;
  const tier1UnitIt = getUnitByTribeAndTier(tribe, 'tier-1');

  // Player always starts with 3 tier-1 units and a hero
  const playerTroops: Troop[] = [
    {
      unitId: 'HERO',
      amount: 1,
      source: tileId,
      tileId,
    },
    {
      unitId: tier1UnitIt.id,
      amount: 3,
      source: tileId,
      tileId,
    },
  ];

  return {
    playerTroops,
    npcTroops,
  };
};
