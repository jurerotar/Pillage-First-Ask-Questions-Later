import { useMemo } from 'react';
import type { DefaultValues } from 'react-hook-form';
import type { z } from 'zod';
import type { Tile } from '@pillage-first/types/models/tile';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { attackOrRaidFormSchema, type UnitSelection } from '../utils/schema';
import { createTroopFormTargetFromTileId } from '../utils/troop-form';
import { useTroopMovementForm } from './use-troop-movement-form';

type AttackOrRaidFormValues = z.infer<typeof attackOrRaidFormSchema>;

type TroopMovementAction = AttackOrRaidFormValues['action'];

type UseAttackOrRaidFormOptions = {
  action?: TroopMovementAction;
  targetTileId?: Tile['id'];
  onSuccess?: () => void;
};

export const disabledAttackOrRaidUnitTiers = [
  'scout',
  'siege-ram',
  'siege-catapult',
  'administration',
  'hero',
] as const satisfies UnitSelection['tier'][];

export const useAttackOrRaidForm = ({
  action = 'attack',
  targetTileId,
  onSuccess,
}: UseAttackOrRaidFormOptions = {}) => {
  const tribe = useTribe();
  const { mapSize } = useServer();

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

  const troopMovementForm = useTroopMovementForm({
    schema: attackOrRaidFormSchema,
    formOptions: {
      defaultValues,
    },
    getMovementValidationType: (data) =>
      data.action === 'attack' ? 'attack' : 'raid',
    getEventType: (data) =>
      data.action === 'attack' ? 'troopMovementAttack' : 'troopMovementRaid',
    onSuccess,
  });

  return {
    ...troopMovementForm,
    disabledUnitTiers: [...disabledAttackOrRaidUnitTiers],
    tribe,
  };
};
