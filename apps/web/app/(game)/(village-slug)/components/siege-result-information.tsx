import { useTranslation } from 'react-i18next';
import type { BattleSiegeResult } from '@pillage-first/types/models/battle';

type SiegeResultInformationProps = {
  result: BattleSiegeResult;
};

export const SiegeResultInformation = ({
  result,
}: SiegeResultInformationProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1">
      <span>
        {result.buildingId !== null && (
          <>
            {t(`BUILDINGS.${result.buildingId}.NAME`)}
            {result.fieldId === null ? ': ' : ' '}
          </>
        )}
        {result.fieldId !== null && (
          <>
            {t('(field {{fieldId}})', { fieldId: result.fieldId })}
            {': '}
          </>
        )}
        {t(`REPORTS.SIEGE.OUTCOMES.${result.outcome}`, {
          before: result.levelBefore,
          after: result.levelAfter,
          level: result.levelAfter,
        })}
      </span>
      <span className="text-muted-foreground">
        {t(`REPORTS.SIEGE.TARGETING.${result.targeting}`)}
        {result.requestedBuildingId !== null && (
          <>
            {' · '}
            {t('Requested: {{buildingName}}', {
              buildingName: t(`BUILDINGS.${result.requestedBuildingId}.NAME`),
            })}
          </>
        )}
      </span>
      {result.reason !== null && (
        <span className="text-muted-foreground">
          {t(`REPORTS.SIEGE.FAILURE_REASONS.${result.reason}`)}
        </span>
      )}
    </div>
  );
};
