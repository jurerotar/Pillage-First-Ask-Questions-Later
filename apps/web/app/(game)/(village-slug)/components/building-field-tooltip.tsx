import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { getBuildingDataForLevel } from '@pillage-first/game-assets/utils/buildings';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useBuildingVirtualLevel } from 'app/(game)/(village-slug)/(village)/hooks/use-building-virtual-level';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useBuildingConstructionErrorBag } from 'app/(game)/(village-slug)/hooks/use-building-construction-error-bag';
import { useComputedEffect } from 'app/(game)/(village-slug)/hooks/use-computed-effect';
import { CurrentVillageLiveResourcesContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';
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
  const currentResources = use(CurrentVillageLiveResourcesContext);
  const { canUpgrade, errorBag } = useBuildingConstructionErrorBag(
    buildingId,
    virtualLevel,
    buildingFieldId,
  );

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
          <div className="flex gap-2">
            <Resources
              resources={nextLevelResourceCost}
              availableResources={currentResources}
            />
          </div>
          <span className="flex gap-1">
            <Icon
              type="buildingDuration"
              className="size-4"
            />
            {formattedTime}
          </span>
          {!canUpgrade && <ErrorBag errorBag={errorBag} />}
        </>
      )}
    </div>
  );
};
