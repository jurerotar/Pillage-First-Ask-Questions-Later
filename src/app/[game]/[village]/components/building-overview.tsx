import { Resources } from 'app/[game]/components/resources';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useComputedEffect } from 'app/[game]/hooks/use-computed-effect';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { getBuildingDataForLevel } from 'app/[game]/utils/building';
import { Icon } from 'app/components/icon';
import { formatPercentage } from 'app/utils/common';
import { formatTime } from 'app/utils/time';
import type { Building } from 'interfaces/models/game/building';
import type React from 'react';
import { useTranslation } from 'react-i18next';

type BuildingOverviewProps = {
  buildingId: Building['id'];
};

export const BuildingOverview: React.FC<BuildingOverviewProps> = ({ buildingId }) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { buildingFieldId } = useRouteSegments();
  const { total: buildingDuration } = useComputedEffect('buildingDuration');

  const buildingLevel = currentVillage.buildingFields.find(({ id }) => id === buildingFieldId)?.level ?? 0;
  const {
    building,
    nextLevelCropConsumption,
    cumulativeCropConsumption,
    cumulativeEffects,
    nextLevelBuildingDuration,
    nextLevelResourceCost,
  } = getBuildingDataForLevel(buildingId, buildingLevel);

  const formattedTime = formatTime(buildingDuration * nextLevelBuildingDuration * 1000);

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">{t(`BUILDINGS.${building.id}.NAME`)}</h2>
        <p>{t(`BUILDINGS.${building.id}.DESCRIPTION`)}</p>
      </div>
      <div className="" />
      {/* Effects */}
      <section className="flex gap-4 justify-center">
        <div className="flex gap-2">
          <Icon
            type="population"
            className="size-6"
            variant="positive-change"
          />
          <span>{nextLevelCropConsumption}</span>
          <span>({cumulativeCropConsumption})</span>
        </div>
        <div className="flex gap-2">
          {cumulativeEffects.map(({ effectId, cumulativeValue, nextLevelValue, areEffectValuesRising }) => (
            <div
              key={effectId}
              className="flex gap-2"
            >
              <Icon
                // @ts-ignore - TODO: Add missing icons
                type={effectId}
                className="size-6"
                variant={areEffectValuesRising ? 'positive-change' : 'negative-change'}
              />
              <span>{Number.isInteger(nextLevelValue) ? nextLevelValue : formatPercentage(nextLevelValue)}</span>
              <span>({Number.isInteger(cumulativeValue) ? cumulativeValue : formatPercentage(cumulativeValue)})</span>
            </div>
          ))}
        </div>
      </section>
      <section className="flex gap-4 justify-center">
        <Resources resources={nextLevelResourceCost} />
        <span className="flex gap-1">
          <Icon type="buildingDuration" />
          {formattedTime}
        </span>
      </section>
    </div>
  );
};
