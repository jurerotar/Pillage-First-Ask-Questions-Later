import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import type {
  GlobalEffect,
  HeroEffect,
  ServerEffect,
  TribalEffect,
} from 'app/interfaces/models/game/effect';
import type { Server } from 'app/interfaces/models/game/server';
import { merchants } from 'app/assets/merchants';
import { PLAYER_ID } from 'app/constants/player';
import { isVillageEffect } from 'app/(game)/(village-slug)/hooks/guards/effect-guards';
import { z } from 'zod';
import { calculateTotalPopulationForLevel } from 'app/(game)/(village-slug)/utils/building';
import type { BuildingId } from 'app/interfaces/models/game/building';
import { getUnitData } from 'app/(game)/(village-slug)/utils/units';
import type { Unit } from 'app/interfaces/models/game/unit';

const heroEffectsFactory = (
  server: Server,
  villageId: number,
): HeroEffect[] => {
  const tribe = server.playerConfiguration.tribe;
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
  }));
};

const globalEffectsFactory = (server: Server): GlobalEffect[] => {
  const { tribe } = server.playerConfiguration;

  const tribeMerchant = merchants.find(
    ({ tribe: tribeToFind }) => tribeToFind === tribe,
  )!;

  const merchantEffects: Omit<TribalEffect, 'scope'>[] = [
    {
      id: 'merchantCapacity',
      value: tribeMerchant.merchantCapacity,
      source: 'tribe',
      type: 'base',
    },
    {
      id: 'merchantSpeed',
      value: tribeMerchant.merchantSpeed,
      source: 'tribe',
      type: 'base',
    },
  ];

  return [...merchantEffects].map((partialEffect) => ({
    ...partialEffect,
    scope: 'global',
  }));
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
    };
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

    for (const { building_id, level } of villageBuildingFields!) {
      population -= calculateTotalPopulationForLevel(
        building_id as BuildingId,
        level,
      );
    }

    effectsToInsert.push([
      'wheatProduction',
      population,
      'base',
      'village',
      'building',
      villageId,
      0,
    ]);
  }

  // Troop effects
  const troopsSchema = z.object({
    unit_id: z.string(),
    amount: z.number(),
    village_id: z.number(),
  });

  const troopsListSchema = z.array(troopsSchema);

  const troopsRows = database.selectObjects(`
    SELECT
      tr.unit_id,
      tr.amount,
      v.id    AS village_id
    FROM troops   AS tr
           JOIN villages AS v  ON tr.tile_id = v.tile_id;
  `);

  const troops = troopsListSchema.parse(troopsRows);

  const groupedTroops = Object.groupBy(troops, ({ village_id }) => {
    return village_id;
  });

  for (const [villageId, villageTroops] of Object.entries(groupedTroops)) {
    let troopWheatConsumption = 0;

    for (const { unit_id, amount } of villageTroops!) {
      const { unitWheatConsumption } = getUnitData(unit_id as Unit['id']);
      troopWheatConsumption -= unitWheatConsumption * amount;
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
    resource: z.enum(['wood', 'clay', 'iron', 'wheat']),
    bonus: z.number(),
  });

  const oasisFieldsListSchema = z.array(oasisFieldsSchema);

  const oasisFieldsRows = database.selectObjects(`
    SELECT tile_id,
           village_id,
           resource,
           bonus
    FROM oasis
    WHERE village_id IS NOT NULL;
  `);

  const oasisFields = oasisFieldsListSchema.parse(oasisFieldsRows);

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
