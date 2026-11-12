import { useTranslation } from 'react-i18next';
import type { BattleSiegeResult } from '@pillage-first/types/models/battle';

type SiegeResultInformationProps = {
  result: BattleSiegeResult;
};

export const SiegeResultInformation = ({
  result,
}: SiegeResultInformationProps) => {
  const { t } = useTranslation();
  const buildingName =
    result.buildingId === null ? '' : t(`BUILDINGS.${result.buildingId}.NAME`);
  const isDamageOutcome =
    result.outcome === 'damaged' || result.outcome === 'destroyed';

  return (
    <div className="flex flex-col gap-1">
      <span>
        {buildingName && !isDamageOutcome && `${buildingName}: `}
        {t(`REPORTS.SIEGE.OUTCOMES.${result.outcome}`, {
          buildingName,
          before: result.levelBefore,
          after: result.levelAfter,
          level: result.levelAfter,
        })}
      </span>
      {result.reason !== null && (
        <span className="text-muted-foreground">
          {t(`REPORTS.SIEGE.FAILURE_REASONS.${result.reason}`)}
        </span>
      )}
    </div>
  );
};
