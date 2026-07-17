import type { CombatResultId } from '@pillage-first/types/models/report';
import { Icon } from 'app/components/icon';
import type { IconType } from 'app/components/icons/icons';

type CombatResultIconProps = {
  combatResultId: CombatResultId | null;
};

const combatResultIconTypes: Record<CombatResultId, IconType> = {
  ATTACKER_NO_LOSS: 'attackerNoLoss',
  ATTACKER_SOME_LOSS: 'attackerSomeLoss',
  ATTACKER_FULL_LOSS: 'attackerFullLoss',
  DEFENDER_NO_LOSS: 'defenderNoLoss',
  DEFENDER_SOME_LOSS: 'defenderSomeLoss',
  DEFENDER_FULL_LOSS: 'defenderFullLoss',
};

export const CombatResultIcon = ({ combatResultId }: CombatResultIconProps) => {
  if (combatResultId === null) {
    return null;
  }

  return <Icon type={combatResultIconTypes[combatResultId]} />;
};
