import { useMemo } from 'react';
import type { DefaultValues } from 'react-hook-form';
import type { z } from 'zod';
import type { Coordinates } from '@pillage-first/types/models/coordinates';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { reinforcementRelocationFormSchema } from '../utils/schema';
import { useTroopMovementForm } from './use-troop-movement-form';

type ReinforcementRelocationFormValues = z.infer<
  typeof reinforcementRelocationFormSchema
>;

type TroopMovementAction = ReinforcementRelocationFormValues['action'];

type UseReinforcementRelocationTroopFormOptions = {
  action?: TroopMovementAction;
  target?: Coordinates;
  onSuccess?: () => void;
};

export const useReinforcementRelocationTroopForm = ({
  action = 'reinforcement',
  target,
  onSuccess,
}: UseReinforcementRelocationTroopFormOptions = {}) => {
  const tribe = useTribe();

  const defaultValues = useMemo<
    DefaultValues<ReinforcementRelocationFormValues>
  >(
    () => ({
      action,
      ...(target ? { target } : {}),
    }),
    [action, target],
  );

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
