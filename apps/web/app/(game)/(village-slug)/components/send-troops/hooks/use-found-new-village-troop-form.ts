import { useMemo } from 'react';
import type { DefaultValues } from 'react-hook-form';
import type { z } from 'zod';
import { getSettlerUnitIdByTribe } from '@pillage-first/game-assets/utils/units';
import type { Tile } from '@pillage-first/types/models/tile';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { foundNewVillageFormSchema, type UnitSelection } from '../utils/schema';
import { createTroopFormTargetFromTileId } from '../utils/troop-form';
import { useTroopMovementForm } from './use-troop-movement-form';

type FoundNewVillageFormValues = z.infer<typeof foundNewVillageFormSchema>;

type UseFoundNewVillageTroopFormOptions = {
  targetTileId?: Tile['id'];
  onSuccess?: () => void;
};

const disabledFoundNewVillageUnitTiers = [
  'tier-1',
  'tier-2',
  'tier-3',
  'scout',
  'tier-4',
  'tier-5',
  'siege-ram',
  'siege-catapult',
  'administration',
  'hero',
] as const satisfies UnitSelection['tier'][];

export const useFoundNewVillageTroopForm = ({
  targetTileId,
  onSuccess,
}: UseFoundNewVillageTroopFormOptions = {}) => {
  const tribe = useTribe();
  const { mapSize } = useServer();
  const settlerUnitId = getSettlerUnitIdByTribe(tribe);

  const defaultUnits = useMemo(() => {
    return [{ unitId: settlerUnitId, amount: 3 }];
  }, [settlerUnitId]);

  const maxUnits = useMemo(() => {
    return [{ unitId: settlerUnitId, amount: 3 }];
  }, [settlerUnitId]);

  const defaultValues = useMemo<
    DefaultValues<FoundNewVillageFormValues>
  >(() => {
    const target = createTroopFormTargetFromTileId(targetTileId, mapSize);

    if (target.tileId === undefined) {
      return {};
    }

    return {
      target,
    };
  }, [mapSize, targetTileId]);

  const troopMovementForm = useTroopMovementForm({
    schema: foundNewVillageFormSchema,
    formOptions: {
      defaultValues,
      defaultUnits,
    },
    getMovementValidationType: () => 'findNewVillage',
    getEventType: () => 'troopMovementFindNewVillage',
    onSuccess,
  });

  return {
    ...troopMovementForm,
    disabledUnitTiers: [...disabledFoundNewVillageUnitTiers],
    maxUnits,
    tribe,
  };
};
