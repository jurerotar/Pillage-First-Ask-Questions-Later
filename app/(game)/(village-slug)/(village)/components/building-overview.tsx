import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { calculateBuildingEffectValues, getBuildingDataForLevel } from 'app/(game)/(village-slug)/utils/building';
import { Icon } from 'app/components/icon';
import type { Building } from 'app/interfaces/models/game/building';
import { formatValue } from 'app/utils/common';
import { formatTime } from 'app/utils/time';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';

type BuildingOverviewProps = {
  buildingId: Building['id'];
  // In case we want to show "2. granary",...
  titleCount?: number;
  showLevel?: boolean;
  showCumulativeValues?: boolean;
};

export const BuildingOverview: React.FC<BuildingOverviewProps> = ({ buildingId, titleCount = 0, showLevel = false }) => {
  const { t: assetsT } = useTranslation();
  const { t } = useTranslation();
  const { buildingFieldId } = useRouteSegments();
  const { total: buildingDuration } = useComputedEffect('buildingDuration');
  const { actualLevel, virtualLevel, doesBuildingExist } = useBuildingVirtualLevel(buildingId, buildingFieldId!);

  const { building, isMaxLevel: isActualMaxLevel } = getBuildingDataForLevel(buildingId, actualLevel);
  const { isMaxLevel, nextLevelBuildingDuration, nextLevelResourceCost } = getBuildingDataForLevel(buildingId, virtualLevel);
  const cumulativeEffects = calculateBuildingEffectValues(building, actualLevel);

  const formattedTime = formatTime(buildingDuration * nextLevelBuildingDuration);

  return (
    <div className="flex flex-col">
      <section
        data-testid="building-overview-title-section"
        className="pb-2"
      >
        <div className="inline-flex gap-2 items-center font-semibold">
          <Text as="h2">
            {titleCount > 0 && <span data-testid="building-overview-building-count">{titleCount + 1}.</span>}
            <span data-testid="building-overview-building-title">{assetsT(`BUILDINGS.${building.id}.NAME`)}</span>
          </Text>
          {showLevel && (
            <span
              data-testid="building-overview-building-level"
              className="text-sm text-orange-500"
            >
              {t('Level {{level}}', { level: actualLevel })}
            </span>
          )}
        </div>
        <div
          data-testid="building-overview-building-image"
          className="flex border border-red justify-center items-center mr-2 float-left size-12 md:size-14"
        >
          image
        </div>
        <p
          data-testid="building-overview-building-description"
          className="text-gray-500 text-sm"
        >
          {assetsT(`BUILDINGS.${building.id}.DESCRIPTION`)}
        </p>
        {actualLevel !== virtualLevel && (
          <span
            data-testid="building-overview-currently-upgrading-span"
            className="inline-flex text-orange-500 mt-2"
          >
            {assetsT('Currently upgrading to level {{level}}', { level: virtualLevel })}
          </span>
        )}
        {isActualMaxLevel && (
          <span
            data-testid="building-overview-max-level"
            className="inline-flex text-green-600 mt-2"
          >
            {t('{{building}} is fully upgraded', { building: assetsT(`BUILDINGS.${building.id}.NAME`) })}
          </span>
        )}
      </section>
      {isMaxLevel && (
        <section
          data-testid="building-overview-max-level-benefits-section"
          className="pt-2 flex flex-col gap-2 py-2 justify-center border-t border-gray-200"
        >
          <Text as="h3">{t('Benefits')}</Text>
          <div className="flex flex-wrap gap-2">
            {cumulativeEffects.map(({ effectId, currentLevelValue, areEffectValuesRising }, index) => (
              <span
                key={index === 0 ? 'population' : effectId}
                className="flex gap-2"
              >
                <Icon
                  type={index === 0 ? 'population' : effectId}
                  className="size-6"
                  variant={areEffectValuesRising || index === 0 ? 'positive-change' : 'negative-change'}
                />
                <span>{formatValue(Math.abs(currentLevelValue))}</span>
              </span>
            ))}
          </div>
        </section>
      )}
      {!isMaxLevel && (
        <section
          data-testid="building-overview-benefits-section"
          className={'flex flex-col gap-2 py-2 justify-center border-t border-gray-200'}
        >
          <Text as="h3">{t('Benefits at level {{level}}', { level: doesBuildingExist ? actualLevel + 1 : 1 })}</Text>
          <div className="flex flex-wrap gap-2">
            {cumulativeEffects.map(({ effectId, currentLevelValue, nextLevelValue, areEffectValuesRising }, index) => (
              <span
                key={index === 0 ? 'population' : effectId}
                className="flex gap-2"
              >
                <Icon
                  type={index === 0 ? 'population' : effectId}
                  className="size-6"
                  variant={areEffectValuesRising || index === 0 ? 'positive-change' : 'negative-change'}
                />
                <span>
                  {doesBuildingExist && <span>{formatValue(Math.abs(currentLevelValue))} &rarr;</span>}
                  {formatValue(Math.abs(nextLevelValue))}
                </span>
              </span>
            ))}
          </div>
        </section>
      )}
      {!isMaxLevel && (
        <>
          <section
            data-testid="building-overview-costs-section"
            className="flex flex-col flex-wrap gap-2 py-2 justify-center border-t border-gray-200"
          >
            <Text as="h3">
              {doesBuildingExist ? t('Cost to upgrade to level {{level}}', { level: virtualLevel + 1 }) : t('Building construction cost')}
            </Text>
            <Resources resources={nextLevelResourceCost} />
          </section>
          <section className="flex flex-col flex-wrap gap-2 py-2 border-t border-gray-200 justify-center">
            <Text as="h3">{t('Construction duration for level {{level}}', { level: virtualLevel + 1 })}</Text>
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
