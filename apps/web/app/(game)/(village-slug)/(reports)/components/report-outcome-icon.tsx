import type { ReportOutcome } from '@pillage-first/types/models/report';
import { Icon } from 'app/components/icon';

type ReportOutcomeIconProps = {
  outcome: ReportOutcome;
};

export const ReportOutcomeIcon = ({ outcome }: ReportOutcomeIconProps) => {
  return <Icon type={outcome} />;
};
