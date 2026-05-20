import { prngMulberry32 } from 'ts-seedrandom';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitByTribeAndTier } from '@pillage-first/game-assets/utils/units';
import type { Resource } from '@pillage-first/types/models/resource';
import type { Server } from '@pillage-first/types/models/server';
import { type Tribe, tribeSchema } from '@pillage-first/types/models/tribe';
import {
  type NatureUnitId,
  type UnitId,
  unitIdSchema,
} from '@pillage-first/types/models/unit';
import type { VillageSize } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { seededRandomIntFromInterval } from '@pillage-first/utils/random';
import { batchInsert } from '../utils/batch-insert';
import { getVillageSize } from '../utils/village-size';

const oasisTroopCombinations = new Map<
  Resource,
  [NatureUnitId, number, number][]
>([
  [
    'wood',
    [
      ['WILD_BOAR', 2, 11],
      ['WOLF', 2, 7],
      ['BEAR', 2, 5],
    ],
  ],
  [
    'clay',
    [
      ['RAT', 3, 12],
      ['SPIDER', 2, 10],
      ['WILD_BOAR', 2, 7],
    ],
  ],
  [
    'iron',
    [
      ['RAT', 2, 16],
      ['SPIDER', 2, 12],
      ['BAT', 2, 10],
    ],
  ],
  [
    'wheat',
    [
      ['RAT', 2, 20],
      ['SERPENT', 2, 18],
      ['TIGER', 2, 11],
      ['CROCODILE', 2, 9],
    ],
  ],
]);

// Each number array determines [min, max] of units.
// - Scouts are introduced from sm and up.
// - Siege appears from lg and up.
// - Larger sizes scale progressively but stay defeatable.
const npcUnitCompositionByTribeAndSize = new Map<
  Tribe,
  Map<VillageSize, [UnitId, number, number][]>
>([
  [
    'gauls',
    new Map([
      [
        'xxs',
        [
          ['PHALANX', 8, 26],
          ['SWORDSMAN', 3, 18],
        ],
      ],
      [
        'xs',
        [
          ['PHALANX', 20, 65],
          ['SWORDSMAN', 10, 50],
        ],
      ],
      [
        'sm',
        [
          ['PHALANX', 95, 180],
          ['SWORDSMAN', 55, 140],
          ['GAUL_SCOUT', 8, 20],
        ],
      ],
      [
        'md',
        [
          ['PHALANX', 190, 360],
          ['SWORDSMAN', 150, 300],
          ['GAUL_SCOUT', 25, 70],
          ['THEUTATES_THUNDER', 25, 80],
          ['DRUIDRIDER', 20, 55],
          ['HAEDUAN', 10, 35],
        ],
      ],
      [
        'lg',
        [
          ['PHALANX', 280, 520],
          ['SWORDSMAN', 180, 360],
          ['GAUL_SCOUT', 40, 120],
          ['THEUTATES_THUNDER', 70, 180],
          ['DRUIDRIDER', 50, 120],
          ['HAEDUAN', 20, 80],
          ['GAUL_RAM', 12, 50],
          ['GAUL_CATAPULT', 8, 28],
        ],
      ],
      [
        'xl',
        [
          ['PHALANX', 360, 650],
          ['SWORDSMAN', 220, 420],
          ['GAUL_SCOUT', 55, 150],
          ['THEUTATES_THUNDER', 100, 240],
          ['DRUIDRIDER', 70, 150],
          ['HAEDUAN', 35, 110],
          ['GAUL_RAM', 20, 75],
          ['GAUL_CATAPULT', 14, 45],
        ],
      ],
      [
        '2xl',
        [
          ['PHALANX', 460, 800],
          ['SWORDSMAN', 260, 500],
          ['GAUL_SCOUT', 75, 180],
          ['THEUTATES_THUNDER', 130, 300],
          ['DRUIDRIDER', 90, 190],
          ['HAEDUAN', 50, 140],
          ['GAUL_RAM', 30, 110],
          ['GAUL_CATAPULT', 20, 60],
        ],
      ],
      [
        '3xl',
        [
          ['PHALANX', 560, 950],
          ['SWORDSMAN', 320, 580],
          ['GAUL_SCOUT', 90, 220],
          ['THEUTATES_THUNDER', 160, 360],
          ['DRUIDRIDER', 120, 240],
          ['HAEDUAN', 70, 170],
          ['GAUL_RAM', 40, 130],
          ['GAUL_CATAPULT', 25, 75],
        ],
      ],
      [
        '4xl',
        [
          ['PHALANX', 680, 1150],
          ['SWORDSMAN', 380, 700],
          ['GAUL_SCOUT', 110, 260],
          ['THEUTATES_THUNDER', 190, 430],
          ['DRUIDRIDER', 150, 290],
          ['HAEDUAN', 90, 210],
          ['GAUL_RAM', 55, 160],
          ['GAUL_CATAPULT', 35, 95],
        ],
      ],
    ]),
  ],
  [
    'romans',
    new Map([
      [
        'xxs',
        [
          ['LEGIONNAIRE', 8, 24],
          ['PRAETORIAN', 4, 16],
        ],
      ],
      [
        'xs',
        [
          ['LEGIONNAIRE', 16, 55],
          ['PRAETORIAN', 8, 40],
        ],
      ],
      [
        'sm',
        [
          ['LEGIONNAIRE', 80, 160],
          ['PRAETORIAN', 55, 130],
          ['ROMAN_SCOUT', 8, 18],
        ],
      ],
      [
        'md',
        [
          ['LEGIONNAIRE', 170, 320],
          ['PRAETORIAN', 120, 250],
          ['ROMAN_SCOUT', 20, 60],
          ['IMPERIAN', 35, 110],
          ['EQUITES_IMPERATORIS', 20, 60],
          ['EQUITES_CAESARIS', 8, 30],
        ],
      ],
      [
        'lg',
        [
          ['LEGIONNAIRE', 260, 470],
          ['PRAETORIAN', 180, 340],
          ['ROMAN_SCOUT', 35, 100],
          ['IMPERIAN', 80, 190],
          ['EQUITES_IMPERATORIS', 55, 120],
          ['EQUITES_CAESARIS', 20, 70],
          ['ROMAN_RAM', 10, 40],
          ['ROMAN_CATAPULT', 8, 26],
        ],
      ],
      [
        'xl',
        [
          ['LEGIONNAIRE', 330, 580],
          ['PRAETORIAN', 230, 420],
          ['ROMAN_SCOUT', 50, 130],
          ['IMPERIAN', 110, 240],
          ['EQUITES_IMPERATORIS', 75, 155],
          ['EQUITES_CAESARIS', 32, 95],
          ['ROMAN_RAM', 16, 60],
          ['ROMAN_CATAPULT', 12, 36],
        ],
      ],
      [
        '2xl',
        [
          ['LEGIONNAIRE', 420, 700],
          ['PRAETORIAN', 290, 500],
          ['ROMAN_SCOUT', 65, 160],
          ['IMPERIAN', 145, 300],
          ['EQUITES_IMPERATORIS', 95, 190],
          ['EQUITES_CAESARIS', 45, 125],
          ['ROMAN_RAM', 24, 85],
          ['ROMAN_CATAPULT', 16, 50],
        ],
      ],
      [
        '3xl',
        [
          ['LEGIONNAIRE', 500, 840],
          ['PRAETORIAN', 350, 590],
          ['ROMAN_SCOUT', 80, 190],
          ['IMPERIAN', 180, 360],
          ['EQUITES_IMPERATORIS', 120, 230],
          ['EQUITES_CAESARIS', 58, 150],
          ['ROMAN_RAM', 32, 110],
          ['ROMAN_CATAPULT', 20, 62],
        ],
      ],
      [
        '4xl',
        [
          ['LEGIONNAIRE', 620, 1020],
          ['PRAETORIAN', 420, 700],
          ['ROMAN_SCOUT', 95, 220],
          ['IMPERIAN', 220, 430],
          ['EQUITES_IMPERATORIS', 150, 280],
          ['EQUITES_CAESARIS', 75, 180],
          ['ROMAN_RAM', 45, 140],
          ['ROMAN_CATAPULT', 28, 78],
        ],
      ],
    ]),
  ],
  [
    'teutons',
    new Map([
      [
        'xxs',
        [
          ['CLUBSWINGER', 12, 40],
          ['SPEARMAN', 4, 18],
        ],
      ],
      [
        'xs',
        [
          ['CLUBSWINGER', 30, 95],
          ['SPEARMAN', 10, 45],
        ],
      ],
      [
        'sm',
        [
          ['CLUBSWINGER', 110, 220],
          ['SPEARMAN', 55, 140],
          ['TEUTONIC_SCOUT', 10, 25],
        ],
      ],
      [
        'md',
        [
          ['CLUBSWINGER', 220, 420],
          ['SPEARMAN', 130, 280],
          ['TEUTONIC_SCOUT', 20, 55],
          ['AXEMAN', 45, 130],
          ['PALADIN', 20, 65],
          ['TEUTONIC_KNIGHT', 10, 35],
        ],
      ],
      [
        'lg',
        [
          ['CLUBSWINGER', 330, 620],
          ['SPEARMAN', 180, 360],
          ['TEUTONIC_SCOUT', 35, 100],
          ['AXEMAN', 90, 220],
          ['PALADIN', 60, 140],
          ['TEUTONIC_KNIGHT', 25, 80],
          ['TEUTONIC_RAM', 14, 45],
          ['TEUTONIC_CATAPULT', 8, 24],
        ],
      ],
      [
        'xl',
        [
          ['CLUBSWINGER', 420, 760],
          ['SPEARMAN', 240, 430],
          ['TEUTONIC_SCOUT', 50, 130],
          ['AXEMAN', 120, 270],
          ['PALADIN', 80, 170],
          ['TEUTONIC_KNIGHT', 35, 105],
          ['TEUTONIC_RAM', 20, 68],
          ['TEUTONIC_CATAPULT', 12, 34],
        ],
      ],
      [
        '2xl',
        [
          ['CLUBSWINGER', 520, 900],
          ['SPEARMAN', 290, 500],
          ['TEUTONIC_SCOUT', 65, 160],
          ['AXEMAN', 155, 330],
          ['PALADIN', 95, 200],
          ['TEUTONIC_KNIGHT', 45, 130],
          ['TEUTONIC_RAM', 28, 95],
          ['TEUTONIC_CATAPULT', 16, 46],
        ],
      ],
      [
        '3xl',
        [
          ['CLUBSWINGER', 620, 1060],
          ['SPEARMAN', 350, 590],
          ['TEUTONIC_SCOUT', 80, 190],
          ['AXEMAN', 190, 390],
          ['PALADIN', 115, 230],
          ['TEUTONIC_KNIGHT', 58, 150],
          ['TEUTONIC_RAM', 36, 120],
          ['TEUTONIC_CATAPULT', 22, 60],
        ],
      ],
      [
        '4xl',
        [
          ['CLUBSWINGER', 740, 1260],
          ['SPEARMAN', 410, 680],
          ['TEUTONIC_SCOUT', 95, 220],
          ['AXEMAN', 230, 460],
          ['PALADIN', 140, 270],
          ['TEUTONIC_KNIGHT', 72, 175],
          ['TEUTONIC_RAM', 50, 150],
          ['TEUTONIC_CATAPULT', 30, 75],
        ],
      ],
    ]),
  ],
  [
    'huns',
    new Map([
      [
        'xxs',
        [
          ['MERCENARY', 8, 26],
          ['BOWMAN', 4, 18],
        ],
      ],
      [
        'xs',
        [
          ['MERCENARY', 20, 65],
          ['BOWMAN', 10, 45],
        ],
      ],
      [
        'sm',
        [
          ['MERCENARY', 85, 175],
          ['BOWMAN', 55, 140],
          ['HUN_SCOUT', 10, 25],
        ],
      ],
      [
        'md',
        [
          ['MERCENARY', 170, 320],
          ['BOWMAN', 120, 250],
          ['HUN_SCOUT', 22, 60],
          ['STEPPE_RIDER', 30, 95],
          ['MARKSMAN', 25, 80],
          ['MARAUDER', 10, 35],
        ],
      ],
      [
        'lg',
        [
          ['MERCENARY', 250, 470],
          ['BOWMAN', 180, 360],
          ['HUN_SCOUT', 40, 110],
          ['STEPPE_RIDER', 80, 200],
          ['MARKSMAN', 60, 160],
          ['MARAUDER', 22, 80],
          ['HUN_RAM', 12, 42],
          ['HUN_CATAPULT', 8, 24],
        ],
      ],
      [
        'xl',
        [
          ['MERCENARY', 320, 580],
          ['BOWMAN', 230, 430],
          ['HUN_SCOUT', 55, 140],
          ['STEPPE_RIDER', 110, 250],
          ['MARKSMAN', 80, 195],
          ['MARAUDER', 35, 105],
          ['HUN_RAM', 18, 62],
          ['HUN_CATAPULT', 12, 34],
        ],
      ],
      [
        '2xl',
        [
          ['MERCENARY', 410, 700],
          ['BOWMAN', 290, 500],
          ['HUN_SCOUT', 70, 170],
          ['STEPPE_RIDER', 145, 310],
          ['MARKSMAN', 105, 240],
          ['MARAUDER', 50, 135],
          ['HUN_RAM', 26, 90],
          ['HUN_CATAPULT', 16, 48],
        ],
      ],
      [
        '3xl',
        [
          ['MERCENARY', 500, 840],
          ['BOWMAN', 350, 590],
          ['HUN_SCOUT', 85, 200],
          ['STEPPE_RIDER', 180, 370],
          ['MARKSMAN', 125, 290],
          ['MARAUDER', 68, 165],
          ['HUN_RAM', 34, 118],
          ['HUN_CATAPULT', 22, 62],
        ],
      ],
      [
        '4xl',
        [
          ['MERCENARY', 620, 1020],
          ['BOWMAN', 420, 700],
          ['HUN_SCOUT', 105, 230],
          ['STEPPE_RIDER', 220, 440],
          ['MARKSMAN', 160, 340],
          ['MARAUDER', 82, 195],
          ['HUN_RAM', 46, 145],
          ['HUN_CATAPULT', 30, 78],
        ],
      ],
    ]),
  ],
  [
    'egyptians',
    new Map([
      [
        'xxs',
        [
          ['SLAVE_MILITIA', 10, 32],
          ['ASH_WARDEN', 4, 16],
        ],
      ],
      [
        'xs',
        [
          ['SLAVE_MILITIA', 25, 80],
          ['ASH_WARDEN', 10, 45],
        ],
      ],
      [
        'sm',
        [
          ['SLAVE_MILITIA', 100, 210],
          ['ASH_WARDEN', 50, 140],
          ['EGYPTIAN_SCOUT', 8, 20],
        ],
      ],
      [
        'md',
        [
          ['SLAVE_MILITIA', 190, 360],
          ['ASH_WARDEN', 130, 280],
          ['EGYPTIAN_SCOUT', 24, 65],
          ['KHOPESH_WARRIOR', 35, 110],
          ['ANHUR_GUARD', 20, 60],
          ['RESHEPH_CHARIOT', 8, 30],
        ],
      ],
      [
        'lg',
        [
          ['SLAVE_MILITIA', 280, 520],
          ['ASH_WARDEN', 180, 360],
          ['EGYPTIAN_SCOUT', 40, 110],
          ['KHOPESH_WARRIOR', 80, 190],
          ['ANHUR_GUARD', 55, 130],
          ['RESHEPH_CHARIOT', 20, 75],
          ['EGYPTIAN_RAM', 12, 45],
          ['EGYPTIAN_CATAPULT', 8, 24],
        ],
      ],
      [
        'xl',
        [
          ['SLAVE_MILITIA', 360, 650],
          ['ASH_WARDEN', 220, 420],
          ['EGYPTIAN_SCOUT', 55, 140],
          ['KHOPESH_WARRIOR', 110, 240],
          ['ANHUR_GUARD', 75, 160],
          ['RESHEPH_CHARIOT', 30, 100],
          ['EGYPTIAN_RAM', 18, 68],
          ['EGYPTIAN_CATAPULT', 12, 34],
        ],
      ],
      [
        '2xl',
        [
          ['SLAVE_MILITIA', 460, 800],
          ['ASH_WARDEN', 280, 500],
          ['EGYPTIAN_SCOUT', 70, 170],
          ['KHOPESH_WARRIOR', 145, 300],
          ['ANHUR_GUARD', 95, 200],
          ['RESHEPH_CHARIOT', 45, 130],
          ['EGYPTIAN_RAM', 26, 95],
          ['EGYPTIAN_CATAPULT', 16, 48],
        ],
      ],
      [
        '3xl',
        [
          ['SLAVE_MILITIA', 560, 950],
          ['ASH_WARDEN', 340, 580],
          ['EGYPTIAN_SCOUT', 85, 200],
          ['KHOPESH_WARRIOR', 180, 360],
          ['ANHUR_GUARD', 115, 240],
          ['RESHEPH_CHARIOT', 58, 160],
          ['EGYPTIAN_RAM', 34, 120],
          ['EGYPTIAN_CATAPULT', 22, 62],
        ],
      ],
      [
        '4xl',
        [
          ['SLAVE_MILITIA', 680, 1150],
          ['ASH_WARDEN', 400, 700],
          ['EGYPTIAN_SCOUT', 105, 230],
          ['KHOPESH_WARRIOR', 220, 430],
          ['ANHUR_GUARD', 140, 280],
          ['RESHEPH_CHARIOT', 75, 190],
          ['EGYPTIAN_RAM', 46, 145],
          ['EGYPTIAN_CATAPULT', 30, 78],
        ],
      ],
    ]),
  ],
  [
    'natars',
    new Map([
      [
        'xxs',
        [
          ['PIKEMAN', 10, 32],
          ['THORNED_WARRIOR', 4, 16],
        ],
      ],
      [
        'xs',
        [
          ['PIKEMAN', 25, 80],
          ['THORNED_WARRIOR', 10, 45],
        ],
      ],
      [
        'sm',
        [
          ['PIKEMAN', 100, 210],
          ['THORNED_WARRIOR', 50, 140],
          ['NATARIAN_SCOUT', 10, 25],
        ],
      ],
      [
        'md',
        [
          ['PIKEMAN', 190, 360],
          ['THORNED_WARRIOR', 130, 280],
          ['NATARIAN_SCOUT', 24, 65],
          ['GUARDSMAN', 35, 110],
          ['AXERIDER', 20, 60],
          ['NATARIAN_KNIGHT', 8, 30],
        ],
      ],
      [
        'lg',
        [
          ['PIKEMAN', 280, 520],
          ['THORNED_WARRIOR', 180, 360],
          ['NATARIAN_SCOUT', 40, 110],
          ['GUARDSMAN', 80, 190],
          ['AXERIDER', 55, 130],
          ['NATARIAN_KNIGHT', 20, 75],
          ['NATARIAN_RAM', 12, 45],
          ['NATARIAN_CATAPULT', 8, 24],
        ],
      ],
      [
        'xl',
        [
          ['PIKEMAN', 360, 650],
          ['THORNED_WARRIOR', 220, 420],
          ['NATARIAN_SCOUT', 55, 140],
          ['GUARDSMAN', 110, 240],
          ['AXERIDER', 75, 160],
          ['NATARIAN_KNIGHT', 30, 100],
          ['NATARIAN_RAM', 18, 68],
          ['NATARIAN_CATAPULT', 12, 34],
        ],
      ],
      [
        '2xl',
        [
          ['PIKEMAN', 460, 800],
          ['THORNED_WARRIOR', 280, 500],
          ['NATARIAN_SCOUT', 70, 170],
          ['GUARDSMAN', 145, 300],
          ['AXERIDER', 95, 200],
          ['NATARIAN_KNIGHT', 45, 130],
          ['NATARIAN_RAM', 26, 95],
          ['NATARIAN_CATAPULT', 16, 48],
        ],
      ],
      [
        '3xl',
        [
          ['PIKEMAN', 560, 950],
          ['THORNED_WARRIOR', 340, 580],
          ['NATARIAN_SCOUT', 85, 200],
          ['GUARDSMAN', 180, 360],
          ['AXERIDER', 115, 240],
          ['NATARIAN_KNIGHT', 58, 160],
          ['NATARIAN_RAM', 34, 120],
          ['NATARIAN_CATAPULT', 22, 62],
        ],
      ],
      [
        '4xl',
        [
          ['PIKEMAN', 680, 1150],
          ['THORNED_WARRIOR', 400, 700],
          ['NATARIAN_SCOUT', 105, 230],
          ['GUARDSMAN', 220, 430],
          ['AXERIDER', 140, 280],
          ['NATARIAN_KNIGHT', 75, 190],
          ['NATARIAN_RAM', 46, 145],
          ['NATARIAN_CATAPULT', 30, 78],
        ],
      ],
    ]),
  ],
]);

const BASELINE_TROOP_MULTIPLIER = 1.2;

export const troopSeeder = (database: DbFacade, server: Server): void => {
  const prng = prngMulberry32(server.seed);

  const results: [number, number, number, number][] = [];

  const unitIdRows = database.selectObjects({
    sql: 'SELECT id, unit FROM unit_ids',
    schema: z.strictObject({ id: z.number(), unit: unitIdSchema }),
  });

  const unitIdMap = new Map<UnitId, number>(
    unitIdRows.map((u) => [u.unit, u.id]),
  );

  const villages = database.selectObjects({
    sql: `
      SELECT
        players.id AS player_id,
        ti.tribe,
        tiles.id AS tile_id,
        tiles.x,
        tiles.y
      FROM
        villages
          INNER JOIN players ON villages.player_id = players.id
          JOIN tribe_ids ti ON players.tribe_id = ti.id
          INNER JOIN tiles ON villages.tile_id = tiles.id;
    `,
    schema: z.strictObject({
      player_id: z.number(),
      tribe: tribeSchema,
      tile_id: z.number(),
      x: z.number(),
      y: z.number(),
    }),
  });

  for (const { tribe, tile_id, player_id, x, y } of villages) {
    if (player_id === PLAYER_ID) {
      const tier1UnitIt = getUnitByTribeAndTier(tribe, 'tier-1');

      // Player starts with 3 tier-1 units and a hero
      results.push(
        [unitIdMap.get(tier1UnitIt.id)!, 3, tile_id, tile_id],
        [unitIdMap.get('HERO')!, 1, tile_id, tile_id],
      );
      continue;
    }

    const villageSize = getVillageSize(server.configuration.mapSize, x, y);

    const unitCompositionByTribe = npcUnitCompositionByTribeAndSize.get(tribe)!;
    const unitCompositionBySize = unitCompositionByTribe.get(villageSize)!;

    for (const [unitId, min, max] of unitCompositionBySize) {
      const scaledMin = Math.max(
        1,
        Math.floor(min * BASELINE_TROOP_MULTIPLIER),
      );
      const scaledMax = Math.max(
        scaledMin,
        Math.floor(max * BASELINE_TROOP_MULTIPLIER),
      );
      const amount = seededRandomIntFromInterval(prng, scaledMin, scaledMax);

      results.push([unitIdMap.get(unitId)!, amount, tile_id, tile_id]);
    }
  }

  const oasis = database.selectObjects({
    sql: `
      SELECT
        o.tile_id AS tile_id,
        GROUP_CONCAT(o.resource) AS resources
      FROM
        oasis o
      GROUP BY
        o.tile_id
      HAVING
        MAX(o.village_id) IS NULL;
    `,
    schema: z.strictObject({
      tile_id: z.number(),
      resources: z.string(),
    }),
  });

  for (const { tile_id, resources } of oasis) {
    const [r1, r2] = resources.split(',') as Resource[];
    const primaryResource = r2 ? (r1 === 'wheat' ? r2 : r1) : r1;

    const troopIdsWithAmount = oasisTroopCombinations.get(primaryResource)!;

    for (const [unitId, min, max] of troopIdsWithAmount) {
      const amount = seededRandomIntFromInterval(prng, min, max);
      results.push([unitIdMap.get(unitId)!, amount, tile_id, tile_id]);
    }
  }

  batchInsert(
    database,
    'troops',
    ['unit_id', 'amount', 'tile_id', 'source_tile_id'],
    results,
  );
};
