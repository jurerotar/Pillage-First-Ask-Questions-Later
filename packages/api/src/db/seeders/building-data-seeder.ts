import { z } from 'zod';
import { buildings } from '@pillage-first/game-assets/buildings';
import { calculateTotalPopulationForLevel } from '@pillage-first/game-assets/utils/buildings';
import type {
  Building,
  BuildingEffect,
} from '@pillage-first/types/models/building';
import {
  type Effect,
  effectIdSchema,
} from '@pillage-first/types/models/effect';
import { TRIBES, type Tribe } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

type BuildingDataRow = [
  buildingId: string,
  level: number,
  tribe: Tribe | null,
  effectId: number,
  value: number,
  type: Effect['type'],
  population: number | null,
];

type BuildingEffectData = {
  effect: BuildingEffect;
  effectsByTribe: Map<Tribe, BuildingEffect>;
  hasTribalValues: boolean;
};

type BuildingEffectValueData = {
  effect: BuildingEffect;
  tribes: Tribe[];
};

const getEffectDataKey = ({
  effectId,
  type,
}: Pick<BuildingEffect, 'effectId' | 'type'>): string => {
  return `${effectId}:${type}`;
};

const getBuildingEffectsByTribe = (
  building: Building,
): Map<Tribe, Map<string, BuildingEffect>> => {
  const effectsByTribe = new Map(
    TRIBES.map((tribe) => [
      tribe,
      new Map(
        building
          .effects(tribe)
          .map((effect) => [getEffectDataKey(effect), effect]),
      ),
    ]),
  );

  const defaultEffectKeys = effectsByTribe.get(TRIBES[0])!;

  for (const effects of effectsByTribe.values()) {
    const hasSameEffectKeys =
      effects.size === defaultEffectKeys.size &&
      [...defaultEffectKeys.keys()].every((effectKey) =>
        effects.has(effectKey),
      );

    if (!hasSameEffectKeys) {
      throw new Error(
        `${building.id} effects must return the same effect ids and types for every tribe. Only values may differ.`,
      );
    }
  }

  return effectsByTribe;
};

const hasDifferentValues = (
  a: BuildingEffect['valuesPerLevel'],
  b: BuildingEffect['valuesPerLevel'],
): boolean => {
  return a.some((value, index) => value !== b[index]);
};

const getBuildingEffectData = (building: Building): BuildingEffectData[] => {
  const effectsByTribe = getBuildingEffectsByTribe(building);
  const effectKeys = [...effectsByTribe.get(TRIBES[0])!.keys()];

  return effectKeys.map((effectKey) => {
    const defaultEffect = effectsByTribe.get(TRIBES[0])!.get(effectKey)!;
    const effectByTribe = new Map(
      TRIBES.map((tribe) => [
        tribe,
        effectsByTribe.get(tribe)!.get(effectKey)!,
      ]),
    );

    return {
      effect: defaultEffect,
      effectsByTribe: effectByTribe,
      hasTribalValues: [...effectByTribe.values()].some((effect) =>
        hasDifferentValues(defaultEffect.valuesPerLevel, effect.valuesPerLevel),
      ),
    };
  });
};

export const buildingDataSeeder = (database: DbFacade): void => {
  const effectIdRows = database.selectObjects({
    sql: 'SELECT effect, id FROM effect_ids',
    schema: z.strictObject({
      effect: effectIdSchema,
      id: z.number(),
    }),
  });

  const effectIds = new Map<Effect['id'], number>(
    effectIdRows.map((t) => {
      return [t.effect, t.id];
    }),
  );

  const wheatProductionEffectId = effectIds.get('wheatProduction')!;

  const buildingDataToInsert: BuildingDataRow[] = [];

  for (const building of buildings) {
    const buildingEffectData = getBuildingEffectData(building);

    for (let level = 0; level <= building.maxLevel; level += 1) {
      const population = calculateTotalPopulationForLevel(building.id, level);

      // Add population (negative wheat production)
      buildingDataToInsert.push([
        building.id,
        level,
        null,
        wheatProductionEffectId,
        -population,
        'base',
        population,
      ]);

      for (const {
        effect,
        effectsByTribe,
        hasTribalValues,
      } of buildingEffectData) {
        if (!hasTribalValues) {
          buildingDataToInsert.push([
            building.id,
            level,
            null,
            effectIds.get(effect.effectId)!,
            effect.valuesPerLevel[level],
            effect.type,
            null,
          ]);

          continue;
        }

        const effectDataByValue = new Map<number, BuildingEffectValueData>();

        for (const tribe of TRIBES) {
          const effect = effectsByTribe.get(tribe)!;
          const value = effect.valuesPerLevel[level];
          const valueGroup = effectDataByValue.get(value);

          if (valueGroup) {
            valueGroup.tribes.push(tribe);
            continue;
          }

          effectDataByValue.set(value, {
            effect,
            tribes: [tribe],
          });
        }

        let defaultEffectData: BuildingEffectValueData | undefined;

        for (const effectData of effectDataByValue.values()) {
          if (
            !defaultEffectData ||
            effectData.tribes.length > defaultEffectData.tribes.length
          ) {
            defaultEffectData = effectData;
          }
        }

        const {
          effect: { effectId, type, valuesPerLevel },
        } = defaultEffectData!;

        buildingDataToInsert.push([
          building.id,
          level,
          null,
          effectIds.get(effectId)!,
          valuesPerLevel[level],
          type,
          null,
        ]);

        for (const [value, effectData] of effectDataByValue) {
          if (effectData === defaultEffectData) {
            continue;
          }

          for (const tribe of effectData.tribes) {
            buildingDataToInsert.push([
              building.id,
              level,
              tribe,
              effectIds.get(effectData.effect.effectId)!,
              value,
              effectData.effect.type,
              null,
            ]);
          }
        }
      }
    }
  }

  batchInsert(
    database,
    'building_data',
    [
      'building_id',
      'level',
      'tribe',
      'effect_id',
      'value',
      'type',
      'population',
    ],
    buildingDataToInsert,
  );
};
