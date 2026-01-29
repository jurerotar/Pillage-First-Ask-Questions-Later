import { z } from 'zod';
import {
  calculateTotalPopulationForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/buildings/utils';
import { merchants } from '@pillage-first/game-assets/merchants';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitDefinition } from '@pillage-first/game-assets/units/utils';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import {
  effectIdSchema,
  type GlobalEffect,
  type HeroEffect,
  type ServerEffect,
  type TribalEffect,
} from '@pillage-first/types/models/effect';
import { resourceSchema } from '@pillage-first/types/models/resource';
import type { Server } from '@pillage-first/types/models/server';
import { type Unit, unitIdSchema } from '@pillage-first/types/models/unit';
import { isVillageEffect } from '@pillage-first/utils/guards/effect';
import type { Seeder } from '../types/seeder';
import { batchInsert } from '../utils/batch-insert';

const heroEffectsFactory = (
  server: Server,
  villageId: number,
): HeroEffect[] => {
  const { tribe } = server.playerConfiguration;
  const baseResourceProduction = 9;
  const tribalModifier = tribe === 'egyptians' ? 2 : 1;
  const initialSkillPoints = 4;

  const heroEffects: Pick<HeroEffect, 'id' | 'value' | 'type'>[] = [
    {
      id: 'attack',
      value: 0,
      type: 'bonus',
    },
    {
      id: 'infantryDefence',
      value: 0,
      type: 'bonus',
    },
    {
      id: 'cavalryDefence',
      value: 0,
      type: 'bonus',
    },
    {
      id: 'woodProduction',
      value: baseResourceProduction * tribalModifier * initialSkillPoints,
      type: 'base',
    },
    {
      id: 'clayProduction',
      value: baseResourceProduction * tribalModifier * initialSkillPoints,
      type: 'base',
    },
    {
      id: 'ironProduction',
      value: baseResourceProduction * tribalModifier * initialSkillPoints,
      type: 'base',
    },
    {
      id: 'wheatProduction',
      value: baseResourceProduction * tribalModifier * initialSkillPoints,
      type: 'base',
    },
  ];

  return heroEffects.map((effect) => ({
    ...effect,
    scope: 'village',
    source: 'hero',
    villageId,
    sourceSpecifier: null,
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

export const effectsSeeder: Seeder = (database, server): void => {
  const effectIdRows = database.selectObjects({
    sql: 'SELECT effect, id FROM effect_ids',
    schema: z.strictObject({
      effect: effectIdSchema,
      id: z.number(),
    }),
  });

  const effectIds = Object.fromEntries(
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
      effectIds[effect.id],
      effect.value,
      effect.type,
      effect.scope,
      effect.source,
      villageId,
      null,
    ] satisfies EffectToInsert);
  }

  // Building effects
  const buildingFieldsRows = database.selectObjects({
    sql: `
      SELECT
        village_id,
        field_id,
        building_id,
        level
      FROM
        building_fields
    `,
    schema: z.strictObject({
      building_id: buildingIdSchema,
      field_id: z.number(),
      village_id: z.number(),
      level: z.number(),
    }),
  });

  const groupedBuildingFields = new Map<
    number,
    {
      field_id: number;
      building_id: Building['id'];
      level: number;
    }[]
  >();

  for (const row of buildingFieldsRows) {
    let group = groupedBuildingFields.get(row.village_id);
    if (!group) {
      group = [];
      groupedBuildingFields.set(row.village_id, group);
    }
    group.push(row);
  }

  const wheatProductionEffectId = effectIds.wheatProduction;

  for (const [villageId, villageBuildingFields] of groupedBuildingFields) {
    let population = 0;

    for (const { building_id, level, field_id } of villageBuildingFields) {
      const building = getBuildingDefinition(building_id);

      for (const { effectId, type, valuesPerLevel } of building.effects) {
        effectsToInsert.push([
          effectIds[effectId],
          valuesPerLevel[level],
          type,
          'village',
          'building',
          villageId,
          field_id,
        ] satisfies EffectToInsert);
      }

      population += calculateTotalPopulationForLevel(building_id, level);
    }

    effectsToInsert.push([
      wheatProductionEffectId,
      -population,
      'base',
      'village',
      'building',
      villageId,
      0,
    ] satisfies EffectToInsert);
  }

  // Troop effects
  const troopsRows = database.selectObjects({
    sql: `
      SELECT
        tr.unit_id,
        tr.amount,
        v.id AS village_id
      FROM
        troops AS tr
          JOIN villages AS v ON tr.tile_id = v.tile_id;
    `,
    schema: z.strictObject({
      unit_id: unitIdSchema,
      amount: z.number(),
      village_id: z.number(),
    }),
  });

  const groupedTroops = new Map<
    number,
    {
      unit_id: string;
      amount: number;
    }[]
  >();

  for (const row of troopsRows) {
    let group = groupedTroops.get(row.village_id);
    if (!group) {
      group = [];
      groupedTroops.set(row.village_id, group);
    }
    group.push(row);
  }

  for (const [villageId, villageTroops] of groupedTroops) {
    let troopWheatConsumption = 0;

    for (const { unit_id, amount } of villageTroops) {
      const { unitWheatConsumption } = getUnitDefinition(unit_id as Unit['id']);
      troopWheatConsumption += unitWheatConsumption * amount;
    }

    effectsToInsert.push([
      wheatProductionEffectId,
      troopWheatConsumption,
      'base',
      'village',
      'troops',
      villageId,
      null,
    ] satisfies EffectToInsert);
  }

  // Oasis effects
  const oasisFieldsRows = database.selectObjects({
    sql: `
      SELECT
        tile_id,
        village_id,
        resource,
        bonus
      FROM
        oasis
      WHERE
        village_id IS NOT NULL;
    `,
    schema: z.strictObject({
      tile_id: z.number(),
      village_id: z.number(),
      resource: resourceSchema,
      bonus: z.number(),
    }),
  });

  for (const oasis of oasisFieldsRows) {
    const effectId = `${oasis.resource}Production`;
    const value = oasis.bonus === 25 ? 1.25 : 1.5;

    effectsToInsert.push([
      effectIds[effectId],
      value,
      'bonus',
      'village',
      'oasis',
      oasis.village_id,
      oasis.tile_id,
    ] satisfies EffectToInsert);
  }

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
