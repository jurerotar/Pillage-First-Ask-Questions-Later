import { BuildingField } from 'interfaces/models/game/village';
import React from 'react';
import { getBuildingDataForLevel, getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/common';
import { useTranslation } from 'react-i18next';
import { Icon } from 'app/components/icon';
import { Resources } from 'app/[game]/components/resources';
import { formatTime } from 'app/utils/time';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';

type BuildingFieldTooltipProps = {
  buildingFieldId: BuildingField['id'];
};

export const BuildingFieldTooltip: React.FC<BuildingFieldTooltipProps> = ({ buildingFieldId }) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId);

  if (!buildingField) {
    return t('APP.GAME.VILLAGE.BUILDING_FIELD.EMPTY');
  }

  const { level, buildingId } = buildingField;
  const { nextLevelBuildingDuration, nextLevelResourceCost, isMaxLevel } = getBuildingDataForLevel(buildingId, level);

  const title = `${t(`BUILDINGS.${buildingId}.NAME`)} ${t('GENERAL.LEVEL', { level }).toLowerCase()}`;
  const formattedTime = formatTime(nextLevelBuildingDuration * 1000);

  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold">{title}</span>
      {isMaxLevel && <span>{t('APP.GAME.VILLAGE.BUILDING_FIELD.MAX_LEVEL')}</span>}
      {!isMaxLevel && (
        <>
          <span className="text-gray-300">{t('APP.GAME.VILLAGE.BUILDING_FIELD.NEXT_LEVEL_COST', { level: level + 1 })}</span>
          <Resources resources={nextLevelResourceCost} />
          <span className="flex gap-1">
            <Icon type="buildingDuration" />
            {formattedTime}
          </span>
        </>
      )}
    </div>
  );
};
