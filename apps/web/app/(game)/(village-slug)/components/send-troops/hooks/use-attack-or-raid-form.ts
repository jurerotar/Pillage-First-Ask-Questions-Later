import { useMemo } from 'react';
import type { DefaultValues } from 'react-hook-form';
import type { z } from 'zod';
import { buildings } from '@pillage-first/game-assets/buildings';
import type { Building } from '@pillage-first/types/models/building';
import type { CatapultTarget } from '@pillage-first/types/models/game-event';
import type { Tile } from '@pillage-first/types/models/tile';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { attackOrRaidFormSchema, type UnitSelection } from '../utils/schema';
import { createTroopFormTargetFromTileId } from '../utils/troop-form';
import { useTroopMovementForm } from './use-troop-movement-form';

type AttackOrRaidFormValues = z.infer<typeof attackOrRaidFormSchema>;

type TroopMovementAction = AttackOrRaidFormValues['action'];
type TribeBuildingRequirement = Extract<
  Building['buildingRequirements'][number],
  { type: 'tribe' }
>;

type UseAttackOrRaidFormOptions = {
  action?: TroopMovementAction;
  targetTileId?: Tile['id'];
  targetTribe?: Tribe;
  isTargetUnoccupiedOasis?: boolean;
  onSuccess?: () => void;
};

export const disabledAttackOrRaidUnitTiers = [
  'siege-ram',
  'administration',
] as const satisfies UnitSelection['tier'][];

export type AttackOrRaidConfirmationOption =
  | {
      type: 'scoutingTarget';
    }
  | {
      type: 'catapultTargets';
      targetCount: 1 | 2;
    }
  | {
      type: 'heroOasisAnimalAction';
    };

const hasHardcodedEquippedAnimalCagesForTesting = true;
const minimumCatapultsForTwoTargets = 20;
const rallyPointLevelForResourceTargets = 5;
const rallyPointLevelForAllTargets = 10;
const rallyPointLevelForTwoTargets = 20;

const resourceCatapultTargetBuildingIds = [
  'WOODCUTTER',
  'CLAY_PIT',
  'IRON_MINE',
  'WHEAT_FIELD',
  'BRICKYARD',
  'IRON_FOUNDRY',
  'SAWMILL',
  'GRAIN_MILL',
  'BAKERY',
] as const satisfies Building['id'][];

const excludedAllCatapultTargetBuildingIds = [
  'CRANNY',
  'TRAPPER',
] as const satisfies Building['id'][];

const isOnlyScoutsSelected = (units: UnitSelection[]) => {
  const selectedUnits = units.filter((unit) => unit.selected > 0);

  return (
    selectedUnits.length > 0 &&
    selectedUnits.every((unit) => unit.tier === 'scout')
  );
};

const hasCatapultsSelected = (units: UnitSelection[]) => {
  return units.some(
    (unit) => unit.selected > 0 && unit.tier === 'siege-catapult',
  );
};

const getSelectedCatapultCount = (units: UnitSelection[]) => {
  let selectedCatapultCount = 0;

  for (const unit of units) {
    if (unit.tier !== 'siege-catapult') {
      continue;
    }

    selectedCatapultCount += unit.selected;
  }

  return selectedCatapultCount;
};

const isOnlyHeroSelected = (units: UnitSelection[]) => {
  const selectedUnits = units.filter((unit) => unit.selected > 0);

  return (
    selectedUnits.length === 1 &&
    selectedUnits.every((unit) => unit.tier === 'hero')
  );
};

const getRallyPointLevel = (
  buildingFields: { buildingId: Building['id']; level: number }[],
) => {
  return (
    buildingFields.find(({ buildingId }) => buildingId === 'RALLY_POINT')
      ?.level ?? 0
  );
};

const isBuildingAvailableForTribe = (
  building: Building,
  targetTribe: Tribe | undefined,
) => {
  const tribeRequirements = building.buildingRequirements.filter(
    (requirement): requirement is TribeBuildingRequirement =>
      requirement.type === 'tribe',
  );

  if (tribeRequirements.length === 0) {
    return true;
  }

  return tribeRequirements.some(
    (requirement) => requirement.tribe === targetTribe,
  );
};

export const getCatapultTargetBuildingIds = (
  rallyPointLevel: number,
  targetTribe: Tribe | undefined,
) => {
  if (rallyPointLevel < rallyPointLevelForResourceTargets) {
    return [];
  }

  if (rallyPointLevel < rallyPointLevelForAllTargets) {
    return [...resourceCatapultTargetBuildingIds];
  }

  const catapultTargetBuildingIds: Building['id'][] = [];

  for (const building of buildings) {
    const isExcluded = excludedAllCatapultTargetBuildingIds.some(
      (buildingId) => buildingId === building.id,
    );

    if (isExcluded || !isBuildingAvailableForTribe(building, targetTribe)) {
      continue;
    }

    catapultTargetBuildingIds.push(building.id);
  }

  return catapultTargetBuildingIds;
};

const getCatapultTargetCount = (
  rallyPointLevel: number,
  units: UnitSelection[],
): 1 | 2 => {
  if (
    rallyPointLevel >= rallyPointLevelForTwoTargets &&
    getSelectedCatapultCount(units) >= minimumCatapultsForTwoTargets
  ) {
    return 2;
  }

  return 1;
};

const getRequiredConfirmationOption = ({
  data,
  isTargetUnoccupiedOasis,
  rallyPointLevel,
}: {
  data: AttackOrRaidFormValues;
  isTargetUnoccupiedOasis: boolean;
  rallyPointLevel: number;
}): AttackOrRaidConfirmationOption | null => {
  if (isOnlyScoutsSelected(data.units)) {
    return { type: 'scoutingTarget' };
  }

  if (data.action === 'attack' && hasCatapultsSelected(data.units)) {
    return {
      type: 'catapultTargets',
      targetCount: getCatapultTargetCount(rallyPointLevel, data.units),
    };
  }

  if (
    isTargetUnoccupiedOasis &&
    hasHardcodedEquippedAnimalCagesForTesting &&
    isOnlyHeroSelected(data.units)
  ) {
    return { type: 'heroOasisAnimalAction' };
  }

  return null;
};

const hasRequiredConfirmationOptionData = (
  data: AttackOrRaidFormValues,
  option: AttackOrRaidConfirmationOption,
) => {
  if (option.type === 'scoutingTarget') {
    return data.scoutingTarget !== undefined;
  }

  if (option.type === 'catapultTargets') {
    const catapultTargets = data.catapultTargets?.filter(Boolean) ?? [];

    if (catapultTargets.length < option.targetCount) {
      return false;
    }

    const specificTargetCount = new Set(
      catapultTargets.filter(
        (target): target is Exclude<CatapultTarget, 'random'> =>
          target !== 'random',
      ),
    ).size;
    const selectedSpecificTargetCount = catapultTargets.filter(
      (target) => target !== 'random',
    ).length;

    return specificTargetCount === selectedSpecificTargetCount;
  }

  return data.heroOasisAnimalAction !== undefined;
};

const stripConfirmationOptionData = (
  data: AttackOrRaidFormValues,
): AttackOrRaidFormValues => {
  return {
    ...data,
    scoutingTarget: undefined,
    catapultTargets: undefined,
    heroOasisAnimalAction: undefined,
  };
};

const addDefaultConfirmationOptionData = (
  data: AttackOrRaidFormValues,
  option: AttackOrRaidConfirmationOption | null,
): AttackOrRaidFormValues => {
  if (option?.type === 'scoutingTarget') {
    return {
      ...data,
      scoutingTarget: data.scoutingTarget ?? 'defensiveStructures',
    };
  }

  if (option?.type === 'catapultTargets') {
    const catapultTargets = data.catapultTargets ?? [];

    return {
      ...data,
      catapultTargets: Array.from(
        { length: option.targetCount },
        (_, index) => catapultTargets[index] ?? 'random',
      ),
    };
  }

  if (option?.type === 'heroOasisAnimalAction') {
    return {
      ...data,
      heroOasisAnimalAction: data.heroOasisAnimalAction ?? 'battle',
    };
  }

  return data;
};

export const useAttackOrRaidForm = ({
  action = 'attack',
  targetTileId,
  targetTribe,
  isTargetUnoccupiedOasis = false,
  onSuccess,
}: UseAttackOrRaidFormOptions = {}) => {
  const tribe = useTribe();
  const { mapSize } = useServer();
  const { currentVillage } = useCurrentVillage();

  const rallyPointLevel = useMemo(() => {
    return getRallyPointLevel(currentVillage.buildingFields);
  }, [currentVillage.buildingFields]);

  const catapultTargetBuildingIds = useMemo(() => {
    return getCatapultTargetBuildingIds(rallyPointLevel, targetTribe);
  }, [rallyPointLevel, targetTribe]);

  const defaultValues = useMemo<DefaultValues<AttackOrRaidFormValues>>(() => {
    const target = createTroopFormTargetFromTileId(targetTileId, mapSize);

    if (target.tileId === undefined) {
      return { action };
    }

    return {
      action,
      target,
    };
  }, [action, mapSize, targetTileId]);

  const troopMovementForm = useTroopMovementForm<AttackOrRaidFormValues>({
    schema: attackOrRaidFormSchema,
    formOptions: {
      defaultValues,
    },
    getMovementValidationType: (data) =>
      data.action === 'attack' ? 'attack' : 'raid',
    getEventType: (data) =>
      data.action === 'attack' ? 'troopMovementAttack' : 'troopMovementRaid',
    canConfirm: (data) => {
      const requiredConfirmationOption = getRequiredConfirmationOption({
        data,
        isTargetUnoccupiedOasis,
        rallyPointLevel,
      });

      return (
        !requiredConfirmationOption ||
        hasRequiredConfirmationOptionData(data, requiredConfirmationOption)
      );
    },
    onSuccess,
  });

  const onFormSubmit = async (data: AttackOrRaidFormValues) => {
    const strippedData = stripConfirmationOptionData(data);
    const confirmationOption = getRequiredConfirmationOption({
      data: strippedData,
      isTargetUnoccupiedOasis,
      rallyPointLevel,
    });
    const dataWithDefaults = addDefaultConfirmationOptionData(
      strippedData,
      confirmationOption,
    );

    troopMovementForm.form.setValue(
      'scoutingTarget',
      dataWithDefaults.scoutingTarget,
    );
    troopMovementForm.form.setValue(
      'catapultTargets',
      dataWithDefaults.catapultTargets,
    );
    troopMovementForm.form.setValue(
      'heroOasisAnimalAction',
      dataWithDefaults.heroOasisAnimalAction,
    );

    await troopMovementForm.onFormSubmit(dataWithDefaults);
  };

  const confirmationOption = troopMovementForm.formData.current
    ? getRequiredConfirmationOption({
        data: troopMovementForm.formData.current,
        isTargetUnoccupiedOasis,
        rallyPointLevel,
      })
    : null;

  const watchedFormValues = troopMovementForm.form.watch();
  const isConfirmDisabled =
    !!confirmationOption &&
    !hasRequiredConfirmationOptionData(watchedFormValues, confirmationOption);

  return {
    ...troopMovementForm,
    catapultTargetBuildingIds,
    confirmationOption,
    disabledUnitTiers: [...disabledAttackOrRaidUnitTiers],
    isConfirmDisabled,
    onFormSubmit,
    tribe,
  };
};
