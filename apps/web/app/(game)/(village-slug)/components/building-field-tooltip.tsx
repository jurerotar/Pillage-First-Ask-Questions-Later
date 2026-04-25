import { useTranslation } from 'react-i18next';
import { getBuildingDataForLevel } from '@pillage-first/game-assets/utils/buildings';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { Icon } from 'app/components/icon';
import { formatTime } from 'app/utils/time';

type BuildingFieldTooltipProps = {
  buildingField: BuildingField;
};

export const BuildingFieldTooltip = ({
  buildingField,
}: BuildingFieldTooltipProps) => {
  const { buildingId, id: buildingFieldId, level } = buildingField;

  const { t } = useTranslation();
  const { total: buildingDuration } = useComputedEffect('buildingDuration');
  const { virtualLevel, isUpgrading, isDowngrading } =
    useBuildingVirtualLevel(buildingFieldId);

  const upgradingToLevel = virtualLevel;

  const { nextLevelBuildingDuration, nextLevelResourceCost, isMaxLevel } =
    getBuildingDataForLevel(buildingId, upgradingToLevel);

  const title = `${t(`BUILDINGS.${buildingId}.NAME`)} - ${t('level {{level}}', { level })}`;
  const formattedTime = formatTime(
    buildingDuration * nextLevelBuildingDuration,
  );

  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold">{title}</span>
      {isMaxLevel && (
        <span>
          {t('{{building}} is fully upgraded', {
            building: t(`BUILDINGS.${buildingId}.NAME`),
          })}
        </span>
      )}
      {!isMaxLevel && (
        <>
          {isDowngrading && (
            <span className="text-warning">
              {t('Currently downgrading to level {{level}}', {
                level: upgradingToLevel,
              })}
            </span>
          )}
          {isUpgrading && (
            <span className="text-warning">
              {t('Currently upgrading to level {{level}}', {
                level: upgradingToLevel,
              })}
            </span>
          )}
          <span className="text-gray-300">
            {t('Cost for upgrading building to level {{level}}', {
              level: upgradingToLevel + 1,
            })}
            :
          </span>
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
