import { Resources } from 'app/(game)/components/resources';
import { useComputedEffect } from 'app/(game)/hooks/use-computed-effect';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useEvents } from 'app/(game)/hooks/use-events';
import { getBuildingDataForLevel, getBuildingFieldByBuildingFieldId } from 'app/(game)/utils/building';
import { Icon } from 'app/components/icon';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { formatTime } from 'app/utils/time';
import type React from 'react';
import { Trans } from '@lingui/react/macro';

type BuildingFieldTooltipProps = {
  buildingFieldId: BuildingField['id'];
};

export const BuildingFieldTooltip: React.FC<BuildingFieldTooltipProps> = ({ buildingFieldId }) => {
  const { currentVillage } = useCurrentVillage();
  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId);
  const { total: buildingDuration } = useComputedEffect('buildingDuration');
  const { currentVillageBuildingEvents } = useEvents();

  if (!buildingField) {
    return <Trans>Building site</Trans>;
  }

  const { buildingId, level } = buildingField;

  const sameBuildingConstructionEvents = currentVillageBuildingEvents.filter(({ buildingFieldId: eventBuildingFieldId, building }) => {
    return building.id === buildingId && eventBuildingFieldId === buildingFieldId;
  });

  const isCurrentlyUpgradingThisBuilding = sameBuildingConstructionEvents.length > 0;

  const upgradingToLevel = level + sameBuildingConstructionEvents.length;

  const { nextLevelBuildingDuration, nextLevelResourceCost, isMaxLevel, building } = getBuildingDataForLevel(buildingId, upgradingToLevel);

  const formattedTime = formatTime(buildingDuration * nextLevelBuildingDuration);

  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold"><Trans>{building.name.message} - level {level}</Trans></span>
      {isMaxLevel && <span><Trans>{building.name.message} is fully upgraded</Trans></span>}
      {!isMaxLevel && (
        <>
          {isCurrentlyUpgradingThisBuilding && (
            <span className="text-orange-500"><Trans>Currently upgrading to level {upgradingToLevel}</Trans></span>
          )}
          <span className="text-gray-300"><Trans>Cost for upgrading building to level {upgradingToLevel + 1}:</Trans></span>
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
