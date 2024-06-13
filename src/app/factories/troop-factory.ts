import type { Troop } from 'interfaces/models/game/troop';
import type { Resource, ResourceCombination } from 'interfaces/models/game/resource';
import { seededRandomIntFromInterval } from 'app/utils/common';
import type { Server } from 'interfaces/models/game/server';
import type { OccupiableOasisTile, OccupiedOccupiableTile } from 'interfaces/models/game/tile';
import type { Player } from 'interfaces/models/game/player';
import { prng_alea } from 'esm-seedrandom';
import type { NatureUnitId, UnitId } from 'interfaces/models/game/unit';
import type { Tribe } from 'interfaces/models/game/tribe';

type GenerateTroopsArgs = {
  server: Server;
  occupiableOasisTiles: OccupiableOasisTile[];
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
  players: Player[];
};

const oasisTroopCombinations = new Map<Resource | ResourceCombination, [NatureUnitId, [number, number]][]>([
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
const npcUnitCompositionByTribeAndSize = new Map<Tribe, Map<OccupiedOccupiableTile['villageSize'], [UnitId, number, number][]>>([
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
          ['PATHFINDER', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['PHALANX', 300, 600],
          ['SWORDSMAN', 250, 400],
          ['PATHFINDER', 20, 80],
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
          ['PATHFINDER', 5, 40],
          ['THEUTATES_THUNDER', 5, 40],
          ['DRUIDRIDER', 5, 40],
          ['HAEDUAN', 5, 40],
          ['GAUL_RAM', 20, 100],
          ['TREBUCHET', 20, 50],
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
          ['EQUITES_LEGATI', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['LEGIONNAIRE', 10, 35],
          ['PRAETORIAN', 5, 25],
          ['EQUITES_LEGATI', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['LEGIONNAIRE', 10, 35],
          ['PRAETORIAN', 5, 25],
          ['EQUITES_LEGATI', 5, 10],
          ['ROMAN_RAM', 20, 100],
          ['FIRE_CATAPULT', 20, 50],
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
          ['MACEMAN', 30, 100],
          ['SPEARMAN', 5, 30],
        ],
      ],
      [
        'sm',
        [
          ['MACEMAN', 30, 100],
          ['SPEARMAN', 5, 30],
          ['SCOUT', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['MACEMAN', 30, 100],
          ['SPEARMAN', 5, 30],
          ['SCOUT', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['MACEMAN', 30, 100],
          ['SPEARMAN', 5, 30],
          ['SCOUT', 5, 10],
          ['TEUTONIC_RAM', 20, 100],
          ['ONAGER', 20, 50],
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
          ['SPOTTER', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['MERCENARY', 15, 45],
          ['BOWMAN', 5, 25],
          ['SPOTTER', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['MERCENARY', 15, 45],
          ['BOWMAN', 5, 25],
          ['SPOTTER', 5, 10],
          ['HUN_RAM', 20, 100],
          ['MANGONEL', 20, 50],
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
          ['SOPDU_EXPLORER', 5, 10],
        ],
      ],
      [
        'md',
        [
          ['SLAVE_MILITIA', 30, 70],
          ['ASH_WARDEN', 5, 20],
          ['SOPDU_EXPLORER', 5, 10],
        ],
      ],
      [
        'lg',
        [
          ['SLAVE_MILITIA', 30, 70],
          ['ASH_WARDEN', 5, 20],
          ['SOPDU_EXPLORER', 5, 10],
          ['EGYPTIAN_RAM', 20, 100],
          ['STONE_CATAPULT', 20, 50],
        ],
      ],
    ]),
  ],
]);

const villageSizeToTroopsLevel = new Map<OccupiedOccupiableTile['villageSize'], number>([
  ['xs', 0],
  ['sm', 5],
  ['md', 10],
  ['lg', 20],
]);

export const generateTroops = ({ server, occupiableOasisTiles, occupiedOccupiableTiles, players }: GenerateTroopsArgs) => {
  const prng = prng_alea(server.seed);

  const oasisTroops: Troop[] = occupiableOasisTiles.flatMap(({ id: tileId, oasisResourceBonus }) => {
    const resourceCombination = oasisResourceBonus.map(({ resource }) => resource).join('-') as Resource | ResourceCombination;
    const troopIdsWithAmount = oasisTroopCombinations.get(resourceCombination)!;
    return troopIdsWithAmount.map((unitIdWithAmount) => {
      const [unitId, amount] = unitIdWithAmount;
      const [min, max] = amount;
      return {
        unitId,
        amount: seededRandomIntFromInterval(prng, min, max),
        source: tileId,
        tileId,
        level: 0,
      };
    });
  });

  const npcTroops: Troop[] = occupiedOccupiableTiles.flatMap(({ id: tileId, ownedBy, villageSize }) => {
    const { tribe, faction } = players.find(({ id }) => id === ownedBy)!;

    if (faction === 'player') {
      return [];
    }

    const unitCompositionByTribe = npcUnitCompositionByTribeAndSize.get(tribe)!;
    const unitCompositionBySize = unitCompositionByTribe.get(villageSize)!;

    return unitCompositionBySize.map((unitComposition) => {
      const [unitId, min, max] = unitComposition;

      return {
        unitId,
        amount: seededRandomIntFromInterval(prng, min, max),
        source: tileId,
        tileId,
        level: villageSizeToTroopsLevel.get(villageSize)!,
      };
    });
  });

  return [...oasisTroops, ...npcTroops];
};
