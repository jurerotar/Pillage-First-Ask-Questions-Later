import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  type DefaultValues,
  type FieldValues,
  type Resolver,
  useForm,
} from 'react-hook-form';
import { useSearchParams } from 'react-router';
import type { z } from 'zod';
import type { TroopMovementEventType } from '@pillage-first/types/models/game-event';
import type { Troop } from '@pillage-first/types/models/troop';
import type { Unit } from '@pillage-first/types/models/unit';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useValidateTroopMovement } from 'app/(game)/(village-slug)/hooks/use-validate-troop-movement';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import type { BaseTroopFormValues, UnitSelection } from '../utils/schema';
import {
  createTroopFormTargetFromCoordinates,
  createUnitSelections,
  parseOptionalInteger,
} from '../utils/troop-form';

export type TroopFormOptions<T extends FieldValues> = {
  defaultUnits?: { unitId: Unit['id']; amount: number }[];
  defaultValues: DefaultValues<T>;
};

const defaultTroopFormUnits: { unitId: Unit['id']; amount: number }[] = [];

export const useTroopForm = <T extends FieldValues & BaseTroopFormValues>(
  schema: z.ZodType<T>,
  options: TroopFormOptions<T>,
) => {
  const {
    defaultValues: providedDefaultValues,
    defaultUnits: providedDefaultUnits = defaultTroopFormUnits,
  } = options;

  const { currentVillage } = useCurrentVillage();
  const { mapSize } = useServer();
  const tribe = useTribe();
  const { getDeployableTroops } = useVillageTroops();
  const [searchParams] = useSearchParams();
  const { validateTroopMovement } = useValidateTroopMovement();

  const deployableTroops = useMemo(() => {
    return getDeployableTroops();
  }, [getDeployableTroops]);

  const initialTarget = useMemo(() => {
    return createTroopFormTargetFromCoordinates(
      {
        x: parseOptionalInteger(searchParams.get('x')),
        y: parseOptionalInteger(searchParams.get('y')),
      },
      mapSize,
    );
  }, [mapSize, searchParams]);

  const initialUnits = useMemo<UnitSelection[]>(() => {
    return createUnitSelections({
      defaultUnits: providedDefaultUnits,
      tribe,
      troops: deployableTroops,
    });
  }, [deployableTroops, providedDefaultUnits, tribe]);

  const initialValues = useMemo(
    () => ({
      ...providedDefaultValues,
      target: {
        ...initialTarget,
        ...providedDefaultValues.target,
      },
      units: initialUnits,
    }),
    [providedDefaultValues, initialTarget, initialUnits],
  );

  const form = useForm<T, unknown, T>({
    resolver: zodResolver(schema as z.ZodType<T, FieldValues>) as Resolver<
      T,
      unknown,
      T
    >,
    defaultValues: initialValues as DefaultValues<T>,
  });

  const resetForm = useCallback(() => {
    form.reset(initialValues);
  }, [form, initialValues]);

  const lastResetValuesRef = useRef(JSON.stringify(initialValues));

  useEffect(() => {
    const currentValuesJson = JSON.stringify(initialValues);
    if (lastResetValuesRef.current !== currentValuesJson) {
      resetForm();
      lastResetValuesRef.current = currentValuesJson;
    }
  }, [initialValues, resetForm]);

  const formatTroopsForSubmission = (units: UnitSelection[]) => {
    const formattedUnits: Troop[] = [];

    for (const unit of units) {
      if (unit.selected === 0) {
        continue;
      }

      formattedUnits.push({
        unitId: unit.unitId,
        amount: unit.selected,
        tileId: currentVillage.tileId,
        source: currentVillage.tileId,
      });
    }

    return formattedUnits;
  };

  const getBaseEventArgs = (data: T) => ({
    troops: formatTroopsForSubmission(data.units),
    targetTileId: data.target.tileId,
  });

  const validateTroopMovementAsync = async (
    data: T,
    movementType:
      | 'reinforcements'
      | 'relocation'
      | 'findNewVillage'
      | 'attack'
      | 'raid'
      | 'oasisOccupation',
  ) => {
    const movementTypeMap = {
      reinforcements: 'troopMovementReinforcements',
      relocation: 'troopMovementRelocation',
      findNewVillage: 'troopMovementFindNewVillage',
      attack: 'troopMovementAttack',
      raid: 'troopMovementRaid',
      oasisOccupation: 'troopMovementOasisOccupation',
    } as const satisfies Record<string, TroopMovementEventType>;

    const type = movementTypeMap[movementType];

    const { errors } = await validateTroopMovement({
      ...getBaseEventArgs(data),
      type: type,
      villageId: currentVillage.id,
    });

    form.clearErrors('root');

    if (errors.length > 0) {
      errors.forEach((error, index) => {
        form.setError(`root.${index}`, {
          type: 'manual',
          message: error,
        });
      });

      return false;
    }

    return true;
  };

  return {
    form,
    currentVillage,
    getBaseEventArgs,
    resetForm,
    validateTroopMovementAsync,
  };
};
