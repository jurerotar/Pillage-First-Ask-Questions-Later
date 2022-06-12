import React, { useMemo } from 'react';
import { Building, BuildingEffect } from 'interfaces/models/game/building';
import { partialArraySum, snakeToCamelCase } from 'utils/common';
import Tooltip from 'components/common/tooltip';
import { useTranslation } from 'react-i18next';
import Icon from 'components/common/icon';

type BuildingEffectsProps = {
  building: Building;
  level: number;
};

type CompiledBuildingEffect = {
  type: BuildingEffect['effectId'];
  totalAmountToCurrentLevel: number;
  nextLevelAmount: number;
};

const BuildingEffects: React.FC<BuildingEffectsProps> = (props): JSX.Element => {
  const {
    building,
    level
  } = props;

  const { t } = useTranslation();

  const isMaxLevel: boolean = level === building.maxLevel;

  // Every building has crop consumption and culture points effects, so these can be hardcoded and the rest we get from building info
  // Level 0 resource field produces 3 resources per hour
  const effectsToDisplay = useMemo<CompiledBuildingEffect[]>(() => {
    return [
      {
        type: 'cropConsumption',
        totalAmountToCurrentLevel: partialArraySum(building.cropConsumption, level),
        nextLevelAmount: isMaxLevel ? 0 : building.cropConsumption[level]
      },
      {
        type: 'culturePointsProduction',
        totalAmountToCurrentLevel: partialArraySum(building.culturePointsProduction, level),
        nextLevelAmount: isMaxLevel ? 0 : building.culturePointsProduction[level]
      },
      ...(building?.effects ?? []).map((buildingEffect: BuildingEffect) => {
        return {
          type: buildingEffect.effectId,
          totalAmountToCurrentLevel: (['woodProduction', 'clayProduction', 'ironProduction', 'wheatProduction'].includes(buildingEffect.effectId) ? 3 : 0) + partialArraySum(buildingEffect.valuesPerLevel, level),
          nextLevelAmount: isMaxLevel ? 0 : buildingEffect.valuesPerLevel[level]
        };
      })
    ];
  }, [building, level]);

  return (
    <>
      {effectsToDisplay.map((buildingEffect: CompiledBuildingEffect) => (
        <Tooltip
          key={buildingEffect.type}
          tooltipContent={t(`GAME.EFFECTS.${snakeToCamelCase(buildingEffect.type).toUpperCase()}.TITLE`)}
        >
          <span className="inline-flex text-sm sm:text-base gap-1 sm:gap-2 items-center scrollbar-hidden overflow-x-scroll">
            <Icon type={buildingEffect.type} />
            <span className="inline-flex gap-1 font-semibold">
              {buildingEffect.totalAmountToCurrentLevel}{buildingEffect.type.includes('Bonus') && '%'}
              {!isMaxLevel && (
                <span className="text-green-600">
                  (+{buildingEffect.nextLevelAmount}{buildingEffect.type.includes('Bonus') && '%'})
                </span>
              )}
            </span>
          </span>
        </Tooltip>
      ))}
    </>
  );
};

export default BuildingEffects;
