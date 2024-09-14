import { Resources } from 'app/[game]/components/resources';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useComputedEffect } from 'app/[game]/hooks/use-computed-effect';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { getBuildingDataForLevel } from 'app/[game]/utils/building';
import { Icon } from 'app/components/icon';
import { formatPercentage } from 'app/utils/common';
import { formatTime } from 'app/utils/time';
import clsx from 'clsx';
import type { Building } from 'interfaces/models/game/building';
import type React from 'react';
import { useTranslation } from 'react-i18next';

type BuildingOverviewProps = {
  buildingId: Building['id'];
  // In case we want to show "2. granary",...
  titleCount?: number;
  showLevel?: boolean;
  showCumulativeValues?: boolean;
};

export const BuildingOverview: React.FC<BuildingOverviewProps> = ({ buildingId, titleCount = 0, showLevel = false }) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { total: buildingDuration } = useComputedEffect('buildingDuration');

  const buildingLevel = currentVillage.buildingFields.find(({ id }) => id === buildingFieldId)?.level ?? 0;
  const {
    isMaxLevel,
    building,
    nextLevelCropConsumption,
    cumulativeCropConsumption,
    cumulativeEffects,
    nextLevelBuildingDuration,
    nextLevelResourceCost,
  } = getBuildingDataForLevel(buildingId, buildingLevel);

  const formattedTime = formatTime(buildingDuration * nextLevelBuildingDuration);

  return (
    <div className="flex flex-col">
      <section className="pb-2">
        <div className="inline-flex gap-2 items-center font-semibold">
          <h2 className="text-xl">
            {titleCount > 0 && `${titleCount + 1}.`} {t(`BUILDINGS.${building.id}.NAME`)}
          </h2>
          {showLevel && <span className="text-sm text-orange-500">{t('GENERAL.LEVEL', { level: buildingLevel })}</span>}
        </div>
        <div className="flex border border-red justify-center items-center ml-1 mb-1 float-right size-20 min-w-20 md:min-w-28 md:size-28">
          image
        </div>
        <p className="text-gray-500 text-sm">{t(`BUILDINGS.${building.id}.DESCRIPTION`)}</p>
        {isMaxLevel && (
          <span className="inline-flex text-green-600 mt-2">
            {t('GENERAL.BUILDING.MAX_LEVEL', { building: t(`BUILDINGS.${building.id}.NAME`) })}
          </span>
        )}
      </section>
      <section className={clsx(isMaxLevel ? 'pt-2' : 'py-2', 'flex flex-col gap-2 justify-center border-t border-gray-200')}>
        <h3 className="font-medium">Benefits</h3>
        <div className="flex flex-wrap gap-2">
          <Icon
            type="population"
            className="size-6"
            variant="positive-change"
          />
          {!isMaxLevel && (
            <>
              <span>{nextLevelCropConsumption}</span>
              <span>({cumulativeCropConsumption})</span>
            </>
          )}
          {isMaxLevel && (
            <>
              <span>{cumulativeCropConsumption}</span>
            </>
          )}
          {cumulativeEffects.length > 0 && (
            <>
              {cumulativeEffects.map(({ effectId, cumulativeValue, nextLevelValue, areEffectValuesRising }) => (
                <span
                  key={effectId}
                  className="flex gap-2"
                >
                  <Icon
                    // @ts-ignore - TODO: Add missing icons
                    type={effectId}
                    className="size-6"
                    variant={areEffectValuesRising ? 'positive-change' : 'negative-change'}
                  />
                  {!isMaxLevel && (
                    <>
                      <span>{Number.isInteger(nextLevelValue) ? nextLevelValue : formatPercentage(nextLevelValue)}</span>
                      <span>({Number.isInteger(cumulativeValue) ? cumulativeValue : formatPercentage(cumulativeValue)})</span>
                    </>
                  )}
                  {isMaxLevel && (
                    <>
                      <span>{Number.isInteger(cumulativeValue) ? cumulativeValue : formatPercentage(cumulativeValue)}</span>
                    </>
                  )}
                </span>
              ))}
            </>
          )}
        </div>
      </section>
      {!isMaxLevel && (
        <>
          <section className="flex flex-col flex-wrap gap-2 py-2 justify-center">
            <h3 className="font-medium">Costs</h3>
            <Resources resources={nextLevelResourceCost} />
          </section>
          <section className="flex flex-col flex-wrap gap-2 py-2 border-t border-gray-200 justify-center">
            <h3 className="font-medium">Building duration</h3>
            <span className="flex gap-1">
              <Icon type="buildingDuration" />
              {formattedTime}
            </span>
          </section>
        </>
      )}
    </div>
  );
};
