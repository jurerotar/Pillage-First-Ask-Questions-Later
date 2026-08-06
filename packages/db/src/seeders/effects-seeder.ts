import { z } from 'zod';
import { merchants } from '@pillage-first/game-assets/merchants';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  effectIdSchema,
  effectScopeSchema,
  effectSourceSchema,
  effectTypeSchema,
  type GlobalEffect,
  type HeroEffect,
  type ServerEffect,
  type TribalEffect,
} from '@pillage-first/types/models/effect';
import type { Server } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { isLocalEffect } from '@pillage-first/utils/guards/effect';
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
    scope: 'local',
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

type EffectToInsert = (number | null)[];

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

  const effectTypeRows = database.selectObjects({
    sql: 'SELECT type, id FROM effect_type_ids',
    schema: z.strictObject({
      type: effectTypeSchema,
      id: z.number(),
    }),
  });
  const effectTypeIds = new Map(
    effectTypeRows.map((t) => {
      return [t.type, t.id];
    }),
  );

  const effectScopeRows = database.selectObjects({
    sql: 'SELECT scope, id FROM effect_scope_ids',
    schema: z.strictObject({
      scope: effectScopeSchema,
      id: z.number(),
    }),
  });
  const effectScopeIds = new Map(
    effectScopeRows.map((s) => {
      return [s.scope, s.id];
    }),
  );

  const effectSourceRows = database.selectObjects({
    sql: 'SELECT source, id FROM effect_source_ids',
    schema: z.strictObject({
      source: effectSourceSchema,
      id: z.number(),
    }),
  });
  const effectSourceIds = new Map(
    effectSourceRows.map((s) => {
      return [s.source, s.id];
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
    const villageId = isLocalEffect(effect) ? effect.villageId : null;
    effectsToInsert.push([
      effectIds.get(effect.id)!,
      effect.value,
      effectTypeIds.get(effect.type)!,
      effectScopeIds.get(effect.scope)!,
      effectSourceIds.get(effect.source)!,
      villageId,
      effect.sourceSpecifier,
    ] satisfies EffectToInsert);
  }

  const wheatProductionEffectId = effectIds.get('wheatProduction')!;
  const baseTypeId = effectTypeIds.get('base')!;
  const localScopeId = effectScopeIds.get('local')!;
  const buildingSourceId = effectSourceIds.get('building')!;
  const troopsSourceId = effectSourceIds.get('troops')!;
  const oasisSourceId = effectSourceIds.get('oasis')!;

  database.exec({
    sql: `
      WITH
        building_effect_data AS MATERIALIZED (
          SELECT
            bi.id AS building_id,
            bd.level,
            ti.id AS tribe_id,
            bd.effect_id,
            COALESCE(tbd.value, bd.value) AS value,
            et.id AS type_id
          FROM
            building_data bd
              JOIN building_ids bi ON bi.building = bd.building_id
              JOIN effect_type_ids et ON et.type = bd.type
              CROSS JOIN tribe_ids ti
              LEFT JOIN building_data tbd ON tbd.building_id = bd.building_id
                AND tbd.level = bd.level
                AND tbd.tribe = ti.tribe
                AND tbd.effect_id = bd.effect_id
                AND tbd.type = bd.type
                AND tbd.population IS NULL
          WHERE
            bd.tribe IS NULL
            AND bd.population IS NULL
        ),

        building_population_data AS MATERIALIZED (
          SELECT
            bi.id AS building_id,
            bd.level,
            bd.value
          FROM
            building_data bd
              JOIN building_ids bi ON bi.building = bd.building_id
          WHERE
            bd.tribe IS NULL
            AND bd.population IS NOT NULL
        )

      INSERT INTO
        effects (effect_id, value, type_id, scope_id, source_id, village_id, source_specifier)
      -- Building effects, using tribal overrides when present
      SELECT
        bed.effect_id,
        bed.value,
        bed.type_id,
        $local_scope_id,
        $building_source_id,
        bf.village_id,
        bf.field_id
      FROM
        building_fields bf
          JOIN villages v ON v.id = bf.village_id
          JOIN players p ON p.id = v.player_id
          JOIN building_effect_data bed ON bed.building_id = bf.building_id
            AND bed.level = bf.level
            AND bed.tribe_id = p.tribe_id

      UNION ALL

      -- Aggregated population effect (negative wheat production)
      SELECT
        $wheat_production_effect_id,
        SUM(bpd.value),
        $base_type_id,
        $local_scope_id,
        $building_source_id,
        bf.village_id,
        0
      FROM
        building_fields bf
          JOIN building_population_data bpd ON bpd.building_id = bf.building_id
            AND bpd.level = bf.level
      GROUP BY
        bf.village_id;
    `,
    bind: {
      $base_type_id: baseTypeId,
      $building_source_id: buildingSourceId,
      $local_scope_id: localScopeId,
      $wheat_production_effect_id: wheatProductionEffectId,
    },
  });

  database.exec({
    sql: `
      INSERT INTO
        effects (effect_id, value, type_id, scope_id, source_id, village_id, source_specifier)
      SELECT
        $wheat_production_effect_id,
        SUM(tr.amount * ud.wheat_consumption),
        $base_type_id,
        $local_scope_id,
        $troops_source_id,
        v.id,
        NULL
      FROM
        troops AS tr
          JOIN unit_ids ui ON ui.id = tr.unit_id
          JOIN villages AS v ON tr.tile_id = v.tile_id
          JOIN unit_data ud ON ud.unit_id = ui.unit
      GROUP BY
        v.id;
    `,
    bind: {
      $base_type_id: baseTypeId,
      $local_scope_id: localScopeId,
      $troops_source_id: troopsSourceId,
      $wheat_production_effect_id: wheatProductionEffectId,
    },
  });

  database.exec({
    sql: `
      WITH
        resource_effects(resource_id, effect_id) AS (
          SELECT
            ri.id,
            ei.id
          FROM
            resource_ids ri
              JOIN effect_ids ei ON ei.effect = ri.resource || 'Production'
          WHERE
            ri.resource IN ('wood', 'clay', 'iron', 'wheat')
            AND ei.effect IN (
              'woodProduction',
              'clayProduction',
              'ironProduction',
              'wheatProduction'
            )
          ),

        oasis_production AS (
          SELECT
            tiles.tile_id,
            re.effect_id,
            CASE
              WHEN MAX(o.bonus) = 50 THEN 80
              WHEN MAX(o.bonus) = 25 THEN 40
              ELSE 10
              END AS value
          FROM
            (
              SELECT DISTINCT tile_id
              FROM oasis
              ) tiles
              CROSS JOIN resource_effects re
              LEFT JOIN oasis o ON o.tile_id = tiles.tile_id
              AND o.resource_id = re.resource_id
          GROUP BY
            tiles.tile_id,
            re.effect_id
          )

      INSERT
      INTO
        effects (effect_id, value, type_id, scope_id, source_id, village_id, source_specifier)
      SELECT
        op.effect_id,
        op.value,
        $base_type_id,
        $local_scope_id,
        $oasis_source_id,
        NULL,
        op.tile_id
      FROM
        oasis_production op
      WHERE
        op.value > 0;
    `,
    bind: {
      $base_type_id: baseTypeId,
      $local_scope_id: localScopeId,
      $oasis_source_id: oasisSourceId,
    },
  });

  batchInsert(
    database,
    'effects',
    [
      'effect_id',
      'value',
      'type_id',
      'scope_id',
      'source_id',
      'village_id',
      'source_specifier',
    ],
    effectsToInsert,
  );
};
