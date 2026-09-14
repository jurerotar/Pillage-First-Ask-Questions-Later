import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';
import type { BaseTroopFormValues } from 'app/(game)/(village-slug)/components/send-troops/utils/schema';
import {
  createTroopFormTargetFromTileId,
  createUnitSelections,
} from 'app/(game)/(village-slug)/components/send-troops/utils/troop-form';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';

type UseTroopSelectionFormOptions = {
  isOpen: boolean;
  tribe: Tribe;
  troops: Troop[];
  targetTileId?: number;
};

export const useTroopSelectionForm = ({
  isOpen,
  tribe,
  troops,
  targetTileId,
}: UseTroopSelectionFormOptions) => {
  const { mapSize } = useServer();
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

    form.reset({
      target: createTroopFormTargetFromTileId(targetTileId, mapSize),
      units: createUnitSelections({ tribe, troops }),
    });
  }, [form, isOpen, mapSize, targetTileId, tribe, troops]);

  return {
    form,
    hasSelectedTroops: units.some(({ selected }) => selected > 0),
    maxUnits,
    target,
  };
};
