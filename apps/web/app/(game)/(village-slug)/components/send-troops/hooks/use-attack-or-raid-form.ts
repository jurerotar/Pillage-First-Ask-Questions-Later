import { useMemo } from 'react';
import type { DefaultValues } from 'react-hook-form';
import type { z } from 'zod';
import type { Tile } from '@pillage-first/types/models/tile';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { attackOrRaidFormSchema, type UnitSelection } from '../utils/schema';
import { createTroopFormTargetFromTileId } from '../utils/troop-form';
import {
  type CatapultTargetsConfirmationOption,
  getDefaultCatapultTargets,
  hasRequiredCatapultTargetData,
  useCatapultTargets,
} from './use-catapult-targets';
import { useTroopMovementForm } from './use-troop-movement-form';

type AttackOrRaidFormValues = z.infer<typeof attackOrRaidFormSchema>;

type TroopMovementAction = AttackOrRaidFormValues['action'];

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
  | CatapultTargetsConfirmationOption
  | {
      type: 'heroOasisAnimalAction';
    };

const hasHardcodedEquippedAnimalCagesForTesting = true;

const isOnlyScoutsSelected = (units: UnitSelection[]) => {
  const selectedUnits = units.filter((unit) => unit.selected > 0);

  return (
    selectedUnits.length > 0 &&
    selectedUnits.every((unit) => unit.tier === 'scout')
  );
};

const isOnlyHeroSelected = (units: UnitSelection[]) => {
  const selectedUnits = units.filter((unit) => unit.selected > 0);

  return (
    selectedUnits.length === 1 &&
    selectedUnits.every((unit) => unit.tier === 'hero')
  );
};

const getRequiredConfirmationOption = ({
  data,
  getCatapultConfirmationOption,
  isTargetUnoccupiedOasis,
}: {
  data: AttackOrRaidFormValues;
  getCatapultConfirmationOption: (
    data: AttackOrRaidFormValues,
  ) => CatapultTargetsConfirmationOption | null;
  isTargetUnoccupiedOasis: boolean;
}): AttackOrRaidConfirmationOption | null => {
  if (isOnlyScoutsSelected(data.units)) {
    return { type: 'scoutingTarget' };
  }

  const catapultConfirmationOption = getCatapultConfirmationOption(data);

  if (catapultConfirmationOption) {
    return catapultConfirmationOption;
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
    return hasRequiredCatapultTargetData(data, option);
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
    return {
      ...data,
      catapultTargets: getDefaultCatapultTargets(data, option),
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
  const { catapultTargetBuildingIds, getCatapultConfirmationOption } =
    useCatapultTargets(targetTribe);

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
        getCatapultConfirmationOption,
        isTargetUnoccupiedOasis,
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
      getCatapultConfirmationOption,
      isTargetUnoccupiedOasis,
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
        getCatapultConfirmationOption,
        isTargetUnoccupiedOasis,
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
