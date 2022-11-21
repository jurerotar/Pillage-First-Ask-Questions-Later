import React from 'react';
import { Building, BuildingEffect } from 'interfaces/models/game/building';
import { Tooltip } from 'components/common/tooltip';
import { Icon } from 'components/common/icon';
import { useTranslation } from 'react-i18next';
import { formatTime, snakeToCamelCase } from 'utils/common';
import { Paragraph } from 'components/common/paragraph';

type BuildingUpgradeInformationTableProps = {
  building: Building;
  level: number;
};

type DisplayedProperty = keyof Omit<Building, 'id' | 'maxLevel' | 'effects' | 'buildingRequirements'> | 'level';

export const BuildingUpgradeInformationTable: React.FC<BuildingUpgradeInformationTableProps> = (props) => {
  const {
    building,
    level
  } = props;

  const { t } = useTranslation();

  const propertiesToShow: DisplayedProperty[] = [
    'level',
    'wood',
    'clay',
    'iron',
    'wheat',
    'totalResourceCost',
    'cropConsumption',
    'culturePointsProduction',
    'buildingDuration'
  ];

  const propertyTranslationMap: { [key in DisplayedProperty]: string } = {
    level: 'GENERAL.LEVEL',
    wood: 'GENERAL.RESOURCES.WOOD',
    clay: 'GENERAL.RESOURCES.CLAY',
    iron: 'GENERAL.RESOURCES.IRON',
    wheat: 'GENERAL.RESOURCES.WHEAT',
    totalResourceCost: 'GENERAL.BUILDING.TOTAL_RESOURCE_COST',
    cropConsumption: 'GAME.EFFECTS.CROP_CONSUMPTION',
    culturePointsProduction: 'GAME.EFFECTS.CULTURE_POINTS_PRODUCTION',
    buildingDuration: 'GAME.EFFECTS.BUILDING_DURATION'
  };

  return (
    <div className="scrollbar-hidden overflow-x-scroll">
      <div className="min-w-full overflow-x-scroll rounded-md shadow-md dark:shadow-none">
        <table className="h-full w-full">
          <thead className="bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              {propertiesToShow.map((property: DisplayedProperty) => (
                <td
                  className="min-w-[70px] py-2 text-center"
                  key={property}
                >
                  {property === 'level' ? (
                    <>
                      {t('GENERAL.LEVEL')}
                    </>
                  ) : (
                    <Tooltip tooltipContent={t(propertyTranslationMap[property])}>
                      <Icon type={property} />
                    </Tooltip>
                  )}
                </td>
              ))}
              {building?.effects && building.effects.map((effect: BuildingEffect) => (
                <td
                  className="min-w-[70px] py-2 text-center"
                  key={effect.effectId}
                >
                  <Tooltip tooltipContent={t(`GAME.EFFECTS.${snakeToCamelCase(effect.effectId).toUpperCase()}`)}>
                    <Icon type={effect.effectId} />
                  </Tooltip>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(building.maxLevel).keys()].map((row: number) => (
              <tr
                className="border-b odd:bg-white even:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 odd:dark:bg-gray-800 even:dark:bg-gray-700"
                key={row}
              >
                {propertiesToShow.map((property) => (
                  <td
                    className="py-2"
                    key={property}
                  >
                    <Paragraph className="text-center">
                      {property === 'level' || property === 'buildingDuration' ? (
                        <>
                          {property === 'level' && (
                            <span className="font-semibold">
                              {row + 1}
                            </span>
                          )}
                          {property === 'buildingDuration' && (
                            formatTime(building[property][row])
                          )}
                        </>
                      ) : (
                        building[property][row]
                      )}
                    </Paragraph>
                  </td>
                ))}
                {building?.effects && building.effects.map((effect: BuildingEffect) => (
                  <td
                    className="py-2"
                    key={effect.effectId}
                  >
                    <Paragraph className="text-center">
                      {effect.valuesPerLevel[row]}
                    </Paragraph>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
