import { Resources } from 'app/(game)/components/resources';
import { useComputedEffect } from 'app/(game)/hooks/use-computed-effect';
import { useCurrentVillage } from 'app/(game)/hooks/current-village/use-current-village';
import { getBuildingDataForLevel, getBuildingFieldByBuildingFieldId } from 'app/(game)/utils/building';
import { Icon } from 'app/components/icon';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { formatTime } from 'app/utils/time';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentVillageBuildingEvents } from 'app/(game)/hooks/current-village/use-current-village-building-events';

type BuildingFieldTooltipProps = {
  buildingFieldId: BuildingField['id'];
};

export const BuildingFieldTooltip: React.FC<BuildingFieldTooltipProps> = ({ buildingFieldId }) => {
  const { t } = useTranslation();
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId);
  const { total: buildingDuration } = useComputedEffect('buildingDuration');
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();

  if (!buildingField) {
    return t('Building site');
  }

  const { buildingId, level } = buildingField;

  const sameBuildingConstructionEvents = currentVillageBuildingEvents.filter(({ buildingFieldId: eventBuildingFieldId, building }) => {
    return building.id === buildingId && eventBuildingFieldId === buildingFieldId;
  });

  const isCurrentlyUpgradingThisBuilding = sameBuildingConstructionEvents.length > 0;

  const upgradingToLevel = level + sameBuildingConstructionEvents.length;

  const { nextLevelBuildingDuration, nextLevelResourceCost, isMaxLevel } = getBuildingDataForLevel(buildingId, upgradingToLevel);

  const title = `${assetsT(`BUILDINGS.${buildingId}.NAME`)} - ${t('level {{level}}', { level })}`;
  const formattedTime = formatTime(buildingDuration * nextLevelBuildingDuration);

  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold">{title}</span>
      {isMaxLevel && <span>{t('{{building}} is fully upgraded', { building: assetsT(`BUILDINGS.${buildingId}.NAME`) })}</span>}
      {!isMaxLevel && (
        <>
          {isCurrentlyUpgradingThisBuilding && (
            <span className="text-orange-500">{t('Currently upgrading to level {{level}}', { level: upgradingToLevel })}</span>
          )}
          <span className="text-gray-300">{t('Cost for upgrading building to level {{level}}', { level: upgradingToLevel + 1 })}:</span>
          <Resources resources={nextLevelResourceCost} />
          <span className="flex gap-1">
            <Icon
              type="buildingDuration"
              className="size-4"
            />
            {formattedTime}
          </span>
        </>
      )}
    </div>
  );
};
