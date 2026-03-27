import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type DefaultValues, type FieldValues, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import type { z } from 'zod';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Troop } from '@pillage-first/types/models/troop';
import type { Unit } from '@pillage-first/types/models/unit';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing.ts';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe.ts';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops.ts';
import { villageTroopsCacheKey } from 'app/(game)/constants/query-keys.ts';
import type { BaseTroopFormValues, UnitSelection } from '../utils/schema.ts';

type TroopFormOptions<T extends FieldValues> = {
  defaultUnits?: { unitId: Unit['id']; amount: number }[];
  defaultValues: DefaultValues<T>;
};

export const useTroopForm = <T extends FieldValues & BaseTroopFormValues>(
  schema: z.ZodSchema<T>,
  options: TroopFormOptions<T>,
) => {
  const {
    defaultValues: providedDefaultValues,
    defaultUnits: providedDefaultUnits = [],
  } = options;

  const defaultValues = useMemo(
    () => providedDefaultValues,
    [providedDefaultValues],
  );
  const defaultUnits = useMemo(
    () => providedDefaultUnits,
    [providedDefaultUnits],
  );

  const { currentVillage } = useCurrentVillage();
  const tribe = useTribe();
  const { getDeployableTroops } = useVillageTroops();
  const [searchParams] = useSearchParams();
  const { playerVillages } = usePlayerVillageListing();

  const deployableTroops = getDeployableTroops();

  const initialTarget = useMemo(() => {
    const xParam = searchParams.get('x');
    const yParam = searchParams.get('y');

    const x = xParam !== null ? Number.parseInt(xParam, 10) : undefined;
    const y = yParam !== null ? Number.parseInt(yParam, 10) : undefined;

    return { x, y };
  }, [searchParams]);

  const initialUnits = useMemo<UnitSelection[]>(() => {
    const tribeUnits = [...getUnitsByTribe(tribe), getUnitDefinition('HERO')];

    return tribeUnits.map((unitDef) => {
      const troop = deployableTroops.find((t) => t.unitId === unitDef.id);
      const available = troop?.amount ?? 0;
      const defaultUnit = defaultUnits.find((du) => du.unitId === unitDef.id);
      const selected = defaultUnit
        ? Math.min(defaultUnit.amount, available)
        : 0;

      return {
        unitId: unitDef.id,
        available,
        selected,
        tier: unitDef.tier,
        category: unitDef.category,
      };
    });
  }, [deployableTroops, tribe, defaultUnits]);

  const initialValues = useMemo(
    () => ({
      ...defaultValues,
      target: {
        ...initialTarget,
        ...defaultValues.target,
      },
      units: initialUnits,
    }),
    [defaultValues, initialTarget, initialUnits],
  );

  const form = useForm<T>({
    // Unsure if this can be typed more strictly :(
    resolver: zodResolver(schema as any),
    defaultValues: initialValues,
  });

  const resetForm = useCallback(
    () => form.reset(initialValues),
    [form, initialValues],
  );

  const lastResetValuesRef = useRef<string>('');

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
    coordinates: {
      x: data.target.x,
      y: data.target.y,
    },
    cachesToClearImmediately: [villageTroopsCacheKey],
  });

  return {
    form,
    currentVillage,
    getBaseEventArgs,
    playerVillages,
    resetForm,
  };
};
