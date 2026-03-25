import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { type DefaultValues, type FieldValues, useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe.ts';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops.ts';
import { villageTroopsCacheKey } from 'app/(game)/constants/query-keys.ts';
import type { BaseTroopFormValues, UnitSelection } from '../utils/schema.ts';

export const useTroopForm = <T extends FieldValues & BaseTroopFormValues>(
  schema: z.ZodSchema<T>,
  defaultValues: DefaultValues<T>,
) => {
  const { currentVillage } = useCurrentVillage();
  const tribe = useTribe();
  const { getDeployableTroops } = useVillageTroops();

  const deployableTroops = useMemo(() => {
    return getDeployableTroops();
  }, [getDeployableTroops]);

  const initialUnits = useMemo<UnitSelection[]>(() => {
    const tribeUnits = [...getUnitsByTribe(tribe), getUnitDefinition('HERO')];

    return tribeUnits.map((unitDef) => {
      const troop = deployableTroops.find((t) => t.unitId === unitDef.id);

      return {
        unitId: unitDef.id,
        available: troop?.amount ?? 0,
        selected: 0,
        tier: unitDef.tier,
        category: unitDef.category,
      };
    });
  }, [deployableTroops, tribe]);

  const form = useForm<T>({
    // Unsure if this can be typed more strictly :(
    resolver: zodResolver(schema as any),
    defaultValues: {
      ...defaultValues,
      units: initialUnits,
    },
  });

  useEffect(() => {
    form.reset({
      ...form.getValues(),
      units: initialUnits,
    });
  }, [form, initialUnits]);

  const formatTroopsForSubmission = (units: UnitSelection[]) => {
    return units
      .filter((u) => u.selected > 0)
      .map((u) => ({
        unitId: u.unitId,
        amount: u.selected,
        tileId: currentVillage.tileId,
        source: currentVillage.id,
      }));
  };

  const getBaseEventArgs = (data: T) => ({
    troops: formatTroopsForSubmission(data.units),
    coordinates: { x: data.target.x, y: data.target.y },
    cachesToClearImmediately: [villageTroopsCacheKey],
  });

  return {
    form,
    currentVillage,
    getBaseEventArgs,
  };
};
