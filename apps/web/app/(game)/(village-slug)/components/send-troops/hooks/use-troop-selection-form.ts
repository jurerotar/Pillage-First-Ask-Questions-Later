import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Coordinates } from '@pillage-first/types/models/coordinates';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';
import type { BaseTroopFormValues } from '../utils/schema';

type UseTroopSelectionFormOptions = {
  isOpen: boolean;
  tribe: Tribe;
  troops: Troop[];
  targetCoordinates?: Coordinates;
};

export const useTroopSelectionForm = ({
  isOpen,
  tribe,
  troops,
  targetCoordinates,
}: UseTroopSelectionFormOptions) => {
  const form = useForm<BaseTroopFormValues>({
    defaultValues: {
      target: {},
      units: [],
    },
  });
  const units = form.watch('units');
  const target = form.watch('target');

  const maxUnits = useMemo(() => {
    return troops.map(({ unitId, amount }) => ({
      unitId,
      amount,
    }));
  }, [troops]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const troopAmountByUnitId = new Map(
      troops.map(({ unitId, amount }) => [unitId, amount] as const),
    );
    const tribeUnits = [...getUnitsByTribe(tribe), getUnitDefinition('HERO')];

    form.reset({
      target: targetCoordinates
        ? {
            x: targetCoordinates.x,
            y: targetCoordinates.y,
          }
        : {},
      units: tribeUnits.map((unitDef) => ({
        unitId: unitDef.id,
        selected: 0,
        available: troopAmountByUnitId.get(unitDef.id) ?? 0,
        tier: unitDef.tier,
        category: unitDef.category,
      })),
    });
  }, [form, isOpen, targetCoordinates, tribe, troops]);

  return {
    form,
    hasSelectedTroops: units.some(({ selected }) => selected > 0),
    maxUnits,
    target,
  };
};
