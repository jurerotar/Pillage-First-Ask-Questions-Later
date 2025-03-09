import { Resources } from 'app/(game)/components/resources';
import { useComputedEffect } from 'app/(game)/hooks/use-computed-effect';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useEvents } from 'app/(game)/hooks/use-events';
import { getBuildingDataForLevel, getBuildingFieldByBuildingFieldId } from 'app/(game)/utils/building';
import { Icon } from 'app/components/icon';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { formatTime } from 'app/utils/time';
import type React from 'react';
import { use } from 'react';
import { useTranslation } from 'react-i18next';

type BuildingFieldTooltipProps = {
  buildingFieldId: BuildingField['id'];
};

export const BuildingFieldTooltip: React.FC<BuildingFieldTooltipProps> = ({ buildingFieldId }) => {
  const { t } = useTranslation();
  const { currentVillage } = use(CurrentVillageContext);
  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId);
  const { total: buildingDuration } = useComputedEffect('buildingDuration');
  const { getCurrentVillageBuildingEvents } = useEvents();

  if (!buildingField) {
    return t('APP.GAME.VILLAGE.BUILDING_FIELD.EMPTY');
  }

  const { buildingId, level } = buildingField;

  const currentVillageBuildingEvents = getCurrentVillageBuildingEvents(currentVillage);

  const sameBuildingConstructionEvents = currentVillageBuildingEvents.filter(({ buildingFieldId: eventBuildingFieldId, building }) => {
    return building.id === buildingId && eventBuildingFieldId === buildingFieldId;
  });

  const isCurrentlyUpgradingThisBuilding = sameBuildingConstructionEvents.length > 0;

  const upgradingToLevel = level + sameBuildingConstructionEvents.length;

  const { nextLevelBuildingDuration, nextLevelResourceCost, isMaxLevel } = getBuildingDataForLevel(buildingId, upgradingToLevel);

  const title = `${t(`BUILDINGS.${buildingId}.NAME`)} - ${t('GENERAL.LEVEL', { level }).toLowerCase()}`;
  const formattedTime = formatTime(buildingDuration * nextLevelBuildingDuration);

  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold">{title}</span>
      {isMaxLevel && <span>{t('GENERAL.BUILDING.MAX_LEVEL', { building: t(`BUILDINGS.${buildingId}.NAME`) })}</span>}
      {!isMaxLevel && (
        <>
          {isCurrentlyUpgradingThisBuilding && (
            <span className="text-orange-500">{t('APP.GAME.VILLAGE.BUILDING_FIELD.CURRENTLY_UPGRADING', { level: upgradingToLevel })}</span>
          )}
          <span className="text-gray-300">{t('APP.GAME.VILLAGE.BUILDING_FIELD.NEXT_LEVEL_COST', { level: upgradingToLevel + 1 })}</span>
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
