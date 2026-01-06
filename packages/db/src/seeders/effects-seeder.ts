import { z } from 'zod';
import {
  calculateTotalPopulationForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/buildings/utils';
import { merchants } from '@pillage-first/game-assets/merchants';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitDefinition } from '@pillage-first/game-assets/units/utils';
import type { Building } from '@pillage-first/types/models/building';
import type {
  GlobalEffect,
  HeroEffect,
  ServerEffect,
  TribalEffect,
} from '@pillage-first/types/models/effect';
import { resourceSchema } from '@pillage-first/types/models/resource';
import type { Server } from '@pillage-first/types/models/server';
import { unitIdSchema } from '@pillage-first/types/models/unit';
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

export const effectsSeeder: Seeder = (database, server): void => {
  const initialPlayerVillageId = database.selectValue(
    `
      SELECT id
      FROM villages
      WHERE player_id = $player_id;`,
    {
      $player_id: PLAYER_ID,
    },
  ) as number;

  const effectsToInsert = [];

  // Static effects
  const staticEffects: (HeroEffect | GlobalEffect | ServerEffect)[] = [
    ...serverEffectsFactory(server),
    ...globalEffectsFactory(server),
    ...heroEffectsFactory(server, initialPlayerVillageId),
  ];

  effectsToInsert.push(
    ...staticEffects.map((effect) => {
      const villageId = isVillageEffect(effect) ? effect.villageId : null;
      return [
        effect.id,
        effect.value,
        effect.type,
        effect.scope,
        effect.source,
        villageId,
        null,
      ];
    }),
  );

  // Building effects
  const buildingFieldsSchema = z.object({
    village_id: z.number(),
    field_id: z.number(),
    building_id: z.string(),
    level: z.number(),
  });

  const buildingFieldsListSchema = z.array(buildingFieldsSchema);

  const buildingFieldsRows = database.selectObjects(`
    SELECT village_id,
           field_id,
           building_id,
           level
    FROM building_fields
  `);

  const buildingFields = buildingFieldsListSchema.parse(buildingFieldsRows);

  const groupedBuildingFields = Object.groupBy(
    buildingFields,
    ({ village_id }) => {
      return village_id;
    },
  );

  for (const [villageId, villageBuildingFields] of Object.entries(
    groupedBuildingFields,
  )) {
    let population = 0;

    for (const { building_id, level, field_id } of villageBuildingFields!) {
      const buildingId = building_id as Building['id'];

      const building = getBuildingDefinition(buildingId);

      for (const { effectId, type, valuesPerLevel } of building.effects) {
        effectsToInsert.push([
          effectId,
          valuesPerLevel[level],
          type,
          'village',
          'building',
          villageId,
          field_id,
        ]);
      }

      population += calculateTotalPopulationForLevel(buildingId, level);
    }

    effectsToInsert.push([
      'wheatProduction',
      -population,
      'base',
      'village',
      'building',
      villageId,
      0,
    ]);
  }

  // Troop effects
  const troopsSchema = z.object({
    unit_id: unitIdSchema,
    amount: z.number(),
    village_id: z.number(),
  });

  const troopsRows = database.selectObjects(`
    SELECT tr.unit_id,
           tr.amount,
           v.id AS village_id
    FROM troops AS tr
           JOIN villages AS v ON tr.tile_id = v.tile_id;
  `);

  const troops = z.array(troopsSchema).parse(troopsRows);

  const groupedTroops = Object.groupBy(troops, ({ village_id }) => {
    return village_id;
  });

  for (const [villageId, villageTroops] of Object.entries(groupedTroops)) {
    let troopWheatConsumption = 0;

    for (const { unit_id, amount } of villageTroops!) {
      const { unitWheatConsumption } = getUnitDefinition(unit_id);
      troopWheatConsumption += unitWheatConsumption * amount;
    }

    effectsToInsert.push([
      'wheatProduction',
      troopWheatConsumption,
      'base',
      'village',
      'troops',
      villageId,
      null,
    ]);
  }

  // Oasis effects
  const oasisFieldsSchema = z.object({
    tile_id: z.number(),
    village_id: z.number(),
    resource: resourceSchema,
    bonus: z.number(),
  });

  const oasisFieldsRows = database.selectObjects(`
    SELECT tile_id,
           village_id,
           resource,
           bonus
    FROM oasis
    WHERE village_id IS NOT NULL;
  `);

  const oasisFields = z.array(oasisFieldsSchema).parse(oasisFieldsRows);

  effectsToInsert.push(
    ...oasisFields.map((oasis) => {
      const effectId = `${oasis.resource}Production`;
      const value = oasis.bonus === 25 ? 1.25 : 1.5;

      return [
        effectId,
        value,
        'bonus',
        'village',
        'oasis',
        oasis.village_id,
        oasis.tile_id,
      ];
    }),
  );

  const effectIdRows = database.selectArrays(
    'SELECT effect, id FROM effect_ids',
  );

  const effectIds = Object.fromEntries(effectIdRows);

  const rows = effectsToInsert.map((effect) => {
    const effectId = effectIds[effect[0]!];

    return effect.with(0, effectId);
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
    rows,
  );
};
