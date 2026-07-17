import type { BattleResultId } from '@pillage-first/types/models/report';
import { Icon } from 'app/components/icon';
import type { IconType } from 'app/components/icons/icons';

type BattleResultIconProps = {
  battleResultId: BattleResultId | null;
};

const battleResultIconTypes: Record<BattleResultId, IconType> = {
  attackerNoLoss: 'attackerNoLoss',
  attackerSomeLoss: 'attackerSomeLoss',
  attackerFullLoss: 'attackerFullLoss',
  defenderNoLoss: 'defenderNoLoss',
  defenderSomeLoss: 'defenderSomeLoss',
  defenderFullLoss: 'defenderFullLoss',
};

export const BattleResultIcon = ({ battleResultId }: BattleResultIconProps) => {
  if (battleResultId === null) {
    return null;
  }

  return <Icon type={battleResultIconTypes[battleResultId]} />;
};
