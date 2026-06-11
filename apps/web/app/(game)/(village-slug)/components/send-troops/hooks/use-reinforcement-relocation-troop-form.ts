import { useMemo } from 'react';
import type { DefaultValues } from 'react-hook-form';
import type { z } from 'zod';
import type { Tile } from '@pillage-first/types/models/tile';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { reinforcementRelocationFormSchema } from '../utils/schema';
import { createTroopFormTargetFromTileId } from '../utils/troop-form';
import { useTroopMovementForm } from './use-troop-movement-form';

type ReinforcementRelocationFormValues = z.infer<
  typeof reinforcementRelocationFormSchema
>;

type TroopMovementAction = ReinforcementRelocationFormValues['action'];

type UseReinforcementRelocationTroopFormOptions = {
  action?: TroopMovementAction;
  targetTileId?: Tile['id'];
  onSuccess?: () => void;
};

export const useReinforcementRelocationTroopForm = ({
  action = 'reinforcement',
  targetTileId,
  onSuccess,
}: UseReinforcementRelocationTroopFormOptions = {}) => {
  const tribe = useTribe();
  const { mapSize } = useServer();

  const defaultValues = useMemo<
    DefaultValues<ReinforcementRelocationFormValues>
  >(() => {
    const target = createTroopFormTargetFromTileId(targetTileId, mapSize);

    if (target.tileId === undefined) {
      return { action };
    }

    return {
      action,
      target,
    };
  }, [action, mapSize, targetTileId]);

  const troopMovementForm = useTroopMovementForm({
    schema: reinforcementRelocationFormSchema,
    formOptions: {
      defaultValues,
    },
    getMovementValidationType: (data) =>
      data.action === 'reinforcement' ? 'reinforcements' : 'relocation',
    getEventType: (data) =>
      data.action === 'reinforcement'
        ? 'troopMovementReinforcements'
        : 'troopMovementRelocation',
    onSuccess,
  });

  return {
    ...troopMovementForm,
    tribe,
  };
};
