import { z } from 'zod';
import { buildings } from '@pillage-first/game-assets/buildings';
import { calculateTotalPopulationForLevel } from '@pillage-first/game-assets/buildings/utils';
import { merchants } from '@pillage-first/game-assets/merchants';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { units } from '@pillage-first/game-assets/units';
import {
  effectIdSchema,
  type GlobalEffect,
  type HeroEffect,
  type ServerEffect,
  type TribalEffect,
} from '@pillage-first/types/models/effect';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { isVillageEffect } from '@pillage-first/utils/guards/effect';
import { batchInsert } from '../utils/batch-insert';

const heroEffectsFactory = (
  server: Server,
  villageId: number,
): HeroEffect[] => {
  const { tribe } = server.playerConfiguration;
  const isEgyptian = tribe === 'egyptians';
  const sharedProductionPerPoint = isEgyptian ? 12 : 9;
  const initialSkillPoints = 4;

  const heroEffects: Pick<HeroEffect, 'id' | 'value' | 'type'>[] = [
    {
      id: 'woodProduction',
      value: sharedProductionPerPoint * initialSkillPoints,
      type: 'base',
    },
    {
      id: 'clayProduction',
      value: sharedProductionPerPoint * initialSkillPoints,
      type: 'base',
    },
    {
      id: 'ironProduction',
      value: sharedProductionPerPoint * initialSkillPoints,
      type: 'base',
    },
    {
      id: 'wheatProduction',
      value: sharedProductionPerPoint * initialSkillPoints,
      type: 'base',
    },
  ];

  return heroEffects.map((effect) => ({
    ...effect,
    scope: 'village',
    source: 'hero',
    villageId,
    sourceSpecifier: 0,
  }));
};

const globalEffectsFactory = (server: Server): GlobalEffect[] => {
  const { tribe } = server.playerConfiguration;

  const tribeMerchant = merchants.find(
    ({ tribe: tribeToFind }) => tribeToFind === tribe,
  )!;

  const merchantEffects: Pick<TribalEffect, 'id' | 'value'>[] = [
    {
      id: 'merchantCapacity',
      value: tribeMerchant.merchantCapacity,
    },
    {
      id: 'merchantSpeed',
      value: tribeMerchant.merchantSpeed,
    },
  ];

  const storageEffectIds: GlobalEffect['id'][] = [
    'warehouseCapacity',
    'granaryCapacity',
  ];

  return [
    ...merchantEffects.map(
      (partialEffect) =>
        ({
          ...partialEffect,
          scope: 'global',
          source: 'tribe',
          type: 'base',
          sourceSpecifier: null,
        }) satisfies GlobalEffect,
    ),
    ...storageEffectIds.map(
      (effectId) =>
        ({
          id: effectId,
          value: 800,
          source: 'building',
          scope: 'global',
          type: 'base',
          sourceSpecifier: null,
        }) satisfies GlobalEffect,
    ),
  ];
};

const serverEffectsFactory = (server: Server): ServerEffect[] => {
  const {
    configuration: { speed },
  } = server;

  const increasedValueEffectIds: ServerEffect['id'][] = [
    'merchantCapacity',
    'merchantSpeed',
    'woodProduction',
    'clayProduction',
    'ironProduction',
    'wheatProduction',
    'unitSpeed',
  ];

  const decreasedValueEffectIds: ServerEffect['id'][] = [
    'barracksTrainingDuration',
    'greatBarracksTrainingDuration',
    'stableTrainingDuration',
    'greatStableTrainingDuration',
    'workshopTrainingDuration',
    'hospitalTrainingDuration',
    'buildingDuration',
    'unitImprovementDuration',
    'unitResearchDuration',
  ];

  const serverEffectIds: ServerEffect['id'][] = [
    ...increasedValueEffectIds,
    ...decreasedValueEffectIds,
  ];

  return serverEffectIds.map((effectId) => {
    const value = increasedValueEffectIds.includes(effectId)
      ? speed
      : 1 / speed;
    return {
      id: effectId,
      value,
      source: 'server',
      scope: 'server',
      type: 'bonus',
      sourceSpecifier: null,
    } satisfies ServerEffect;
  });
};

type EffectToInsert = (string | number | null)[];

export const effectsSeeder = (database: DbFacade, server: Server): void => {
  const effectIdRows = database.selectObjects({
    sql: 'SELECT effect, id FROM effect_ids',
    schema: z.strictObject({
      effect: effectIdSchema,
      id: z.number(),
    }),
  });

  const effectIds = new Map(
    effectIdRows.map((t) => {
      return [t.effect, t.id];
    }),
  );

  const initialPlayerVillageId = database.selectValue({
    sql: `
      SELECT id
      FROM
        villages
      WHERE
        player_id = $player_id;`,
    bind: {
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  })!;

  const effectsToInsert: EffectToInsert[] = [];

  // Static effects
  const staticEffects: (HeroEffect | GlobalEffect | ServerEffect)[] = [
    ...serverEffectsFactory(server),
    ...globalEffectsFactory(server),
    ...heroEffectsFactory(server, initialPlayerVillageId),
  ];

  for (const effect of staticEffects) {
    const villageId = isVillageEffect(effect) ? effect.villageId : null;
    effectsToInsert.push([
      effectIds.get(effect.id)!,
      effect.value,
      effect.type,
      effect.scope,
      effect.source,
      villageId,
      effect.sourceSpecifier,
    ] satisfies EffectToInsert);
  }

  const wheatProductionEffectId = effectIds.get('wheatProduction')!;

  database.exec({
    sql: `
      CREATE TEMPORARY TABLE temp_building_data (
        building_id TEXT,
        level INTEGER,
        effect_id INTEGER,
        value REAL,
        type TEXT,
        population INTEGER
      );
    `,
  });

  const buildingDataToInsert: (string | number | null)[][] = [];

  for (const building of buildings) {
    for (let level = 0; level <= building.maxLevel; level++) {
      const population = calculateTotalPopulationForLevel(building.id, level);

      // Add population (negative wheat production)
      buildingDataToInsert.push([
        building.id,
        level,
        wheatProductionEffectId,
        -population,
        'base',
        population,
      ]);

      // Add other building effects
      for (const { effectId, type, valuesPerLevel } of building.effects) {
        buildingDataToInsert.push([
          building.id,
          level,
          effectIds.get(effectId)!,
          valuesPerLevel[level],
          type,
          null,
        ]);
      }
    }
  }

  batchInsert(
    database,
    'temp_building_data',
    ['building_id', 'level', 'effect_id', 'value', 'type', 'population'],
    buildingDataToInsert,
  );

  database.exec({
    sql: `
      INSERT INTO
        effects (effect_id, value, type, scope, source, village_id, source_specifier)
      -- Regular building effects
      SELECT
        tbd.effect_id,
        tbd.value,
        tbd.type,
        'village',
        'building',
        bf.village_id,
        bf.field_id
      FROM
        building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
          JOIN temp_building_data tbd ON tbd.building_id = bi.building AND tbd.level = bf.level
      WHERE
        tbd.population IS NULL

      UNION ALL

      -- Aggregated population effect (negative wheat production)
      SELECT
        $wheat_production_effect_id,
        SUM(tbd.value),
        'base',
        'village',
        'building',
        bf.village_id,
        0
      FROM
        building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
          JOIN temp_building_data tbd ON tbd.building_id = bi.building AND tbd.level = bf.level
      WHERE
        tbd.population IS NOT NULL
      GROUP BY
        bf.village_id;
    `,
    bind: {
      $wheat_production_effect_id: wheatProductionEffectId,
    },
  });

  database.exec({
    sql: `
      CREATE TEMPORARY TABLE temp_unit_data (
        unit_id TEXT,
        wheat_consumption INTEGER
      );
    `,
  });

  const unitDataToInsert: (string | number)[][] = [];

  for (const unit of units) {
    unitDataToInsert.push([unit.id, unit.unitWheatConsumption]);
  }

  batchInsert(
    database,
    'temp_unit_data',
    ['unit_id', 'wheat_consumption'],
    unitDataToInsert,
  );

  database.exec({
    sql: `
      INSERT INTO
        effects (effect_id, value, type, scope, source, village_id, source_specifier)
      SELECT
        $wheat_production_effect_id,
        SUM(tr.amount * tud.wheat_consumption),
        'base',
        'village',
        'troops',
        v.id,
        NULL
      FROM
        troops AS tr
          JOIN unit_ids ui ON ui.id = tr.unit_id
          JOIN villages AS v ON tr.tile_id = v.tile_id
          JOIN temp_unit_data tud ON tud.unit_id = ui.unit
      GROUP BY
        v.id;
    `,
    bind: {
      $wheat_production_effect_id: wheatProductionEffectId,
    },
  });

  database.exec({
    sql: `
      INSERT INTO
        effects (effect_id, value, type, scope, source, village_id, source_specifier)
      SELECT
        ei.id,
        CASE WHEN o.bonus = 25 THEN 1.25 ELSE 1.5 END,
        'bonus',
        'village',
        'oasis',
        o.village_id,
        o.tile_id
      FROM
        oasis o
          JOIN effect_ids ei ON ei.effect = o.resource || 'Production'
      WHERE
        o.village_id IS NOT NULL;
    `,
  });

  batchInsert(
    database,
    'effects',
    [
      'effect_id',
      'value',
      'type',
      'scope',
      'source',
      'village_id',
      'source_specifier',
    ],
    effectsToInsert,
  );
};
