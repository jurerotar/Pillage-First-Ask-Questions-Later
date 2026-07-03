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

  database.exec({
    sql: `
      INSERT INTO
        effects (effect_id, value, type_id, scope_id, source_id, village_id, source_specifier)
      -- Regular building effects
      SELECT
        bd.effect_id,
        bd.value,
        et.id,
        (SELECT id FROM effect_scope_ids WHERE scope = 'local'),
        (SELECT id FROM effect_source_ids WHERE source = 'building'),
        bf.village_id,
        bf.field_id
      FROM
        building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
          JOIN building_data bd ON bd.building_id = bi.building AND bd.level = bf.level
          JOIN effect_type_ids et ON et.type = bd.type
      WHERE
        bd.population IS NULL

      UNION ALL

      -- Aggregated population effect (negative wheat production)
      SELECT
        $wheat_production_effect_id,
        SUM(bd.value),
        (SELECT id FROM effect_type_ids WHERE type = 'base'),
        (SELECT id FROM effect_scope_ids WHERE scope = 'local'),
        (SELECT id FROM effect_source_ids WHERE source = 'building'),
        bf.village_id,
        0
      FROM
        building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
          JOIN building_data bd ON bd.building_id = bi.building AND bd.level = bf.level
      WHERE
        bd.population IS NOT NULL
      GROUP BY
        bf.village_id;
    `,
    bind: {
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
        (SELECT id FROM effect_type_ids WHERE type = 'base'),
        (SELECT id FROM effect_scope_ids WHERE scope = 'local'),
        (SELECT id FROM effect_source_ids WHERE source = 'troops'),
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
      $wheat_production_effect_id: wheatProductionEffectId,
    },
  });

  database.exec({
    sql: `
      WITH
        resource_effects(resource, effect) AS (
          VALUES
            ('wood', 'woodProduction'),
            ('clay', 'clayProduction'),
            ('iron', 'ironProduction'),
            ('wheat', 'wheatProduction')
          ),

        oasis_production AS (
          SELECT
            tiles.tile_id,
            re.effect,
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
              AND o.resource = re.resource
          GROUP BY
            tiles.tile_id,
            re.effect
          )

      INSERT
      INTO
        effects (effect_id, value, type_id, scope_id, source_id, village_id, source_specifier)
      SELECT
        ei.id,
        op.value,
        (SELECT id FROM effect_type_ids WHERE type = 'base'),
        (SELECT id FROM effect_scope_ids WHERE scope = 'local'),
        (SELECT id FROM effect_source_ids WHERE source = 'oasis'),
        NULL,
        op.tile_id
      FROM
        oasis_production op
          JOIN effect_ids ei ON ei.effect = op.effect
      WHERE
        op.value > 0;
    `,
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
