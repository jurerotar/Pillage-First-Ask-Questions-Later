import type { ReportTag } from '@pillage-first/types/models/report';
import { Icon } from 'app/components/icon';
import type { IconType } from 'app/components/icons/icons';

type ReportTagIconProps = {
  tags: ReportTag[];
};

const reportTagIconTypes: Partial<Record<ReportTag, IconType>> = {
  ATTACKER_NO_LOSS: 'attackerNoLoss',
  ATTACKER_SOME_LOSS: 'attackerSomeLoss',
  ATTACKER_FULL_LOSS: 'attackerFullLoss',
  DEFENDER_NO_LOSS: 'defenderNoLoss',
  DEFENDER_SOME_LOSS: 'defenderSomeLoss',
  DEFENDER_FULL_LOSS: 'defenderFullLoss',
};

export const ReportTagIcon = ({ tags }: ReportTagIconProps) => {
  for (const tag of tags) {
    const iconType = reportTagIconTypes[tag];

    if (iconType) {
      return <Icon type={iconType} />;
    }
  }

  return null;
};
