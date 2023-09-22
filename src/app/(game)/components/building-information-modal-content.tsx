import React, { useMemo } from 'react';
import { Building } from 'interfaces/models/game/building';
import _buildings from 'assets/buildings.json';
import { useTranslation } from 'react-i18next';
import { Paragraph } from 'components/paragraph';
import { SectionHeading } from 'components/section-heading';
import { arrayTupleToObject, formatTime } from 'utils/common';
import { Resource, Resources } from 'interfaces/models/game/resource';
import { Icon } from 'components/icon';
import { Tooltip } from 'components/tooltip';
import { Button } from 'components/buttons/button';
import { Accordion } from 'components/accordion';
import {
  BuildingUpgradeInformationTable
} from 'components/tables/building-upgrade-information-table';
import { useContextSelector } from 'use-context-selector';

import { BuildingFieldId, ResourceFieldId } from 'interfaces/models/game/village';
import { VillageContext } from 'providers/game/village-context';
import { BuildingEffectsModalContent } from './building-effects-modal-content';

const buildings = _buildings as Building[];

type BuildingInformationProps = {
  buildingFieldId: ResourceFieldId | BuildingFieldId;
  buildingId: Building['id'];
  buildingLevel: number;
  canUpgrade: boolean;
};

export const BuildingInformationModalContent: React.FC<BuildingInformationProps> = (props) => {
  const {
    buildingFieldId,
    buildingId,
    buildingLevel,
    canUpgrade
  } = props;

  const { t } = useTranslation();

  const createResourceUpgradeEvent = useContextSelector(GameContext, (v) => v.createResourceUpgradeEvent);
  const selectedVillage = useContextSelector(VillageContext, (v) => v.selectedVillage);

  const building = useMemo<Building>(() => {
    return buildings.find((build: Building) => build.id === buildingId)!;
  }, [buildingId]);

  const nextLevelResourceCost = useMemo<Resources>(() => {
    const resources = ['wood', 'clay', 'iron', 'wheat'] as Resource[];
    const costPerResource = resources.map((resource: Resource) => {
      return building[resource][buildingLevel];
    });
    return arrayTupleToObject<Resource[], number[]>(resources, costPerResource) as Resources;
  }, [building, buildingLevel]);

  const isMaxLevel: boolean = buildingLevel === building.maxLevel;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading>
        {t(`GAME.BUILDINGS.${buildingId}.NAME`)} - {t('GENERAL.LEVEL')} {buildingLevel}
      </SectionHeading>
      {/* Building description */}
      <Accordion summary={t('GENERAL.DESCRIPTION')}>
        <Paragraph>
          {t(`GAME.BUILDINGS.${buildingId}.DESCRIPTION`)}
        </Paragraph>
      </Accordion>
      {/* Building upgrade information */}
      <div className="flex flex-col rounded-md border border-green-300 bg-green-50 p-2">
        {isMaxLevel ? (
          <div className="flex flex-col justify-between sm:flex-row">
            <span className="">
              {`${t(`GAME.BUILDINGS.${buildingId}.NAME`)} ${t('GENERAL.BUILDING.BUILDING_MAX_LEVEL')}`}
            </span>
            <div className="inline-flex gap-3">
              <BuildingEffectsModalContent
                building={building}
                level={buildingLevel}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Resource cost */}
            <div className="flex justify-center gap-4 pb-4 pt-2">
              {Object.keys(nextLevelResourceCost)
                .map((resource: string | Resource) => (
                  <Tooltip
                    key={resource}
                    tooltipContent={t(`GENERAL.RESOURCES.${resource.toUpperCase()}`)}
                  >
                    <span className="flex items-center gap-1">
                      <Icon
                        key={resource}
                        type={`${resource as Resource}Production`}
                      />
                      <span className="">
                        {nextLevelResourceCost[resource as Resource]}
                      </span>
                    </span>
                  </Tooltip>
                ))}
            </div>
            <div className="flex justify-center gap-4 border-y border-dashed border-gray-300 py-4">
              <BuildingEffectsModalContent
                building={building}
                level={buildingLevel}
              />
            </div>
            <div className="flex items-center justify-center pt-4">
              <div className="flex items-center gap-4">
                {/* Building upgrade button */}
                <Button
                  variant="confirm"
                  size="sm"
                  disabled={!canUpgrade}
                  onClick={() => createResourceUpgradeEvent(
                    selectedVillage?.id,
                    buildingFieldId,
                    buildingLevel + 1,
                    building.buildingDuration[buildingLevel]
                  )}
                >
                  {t('GENERAL.BUILDING.UPGRADE_TO')} {buildingLevel + 1}
                </Button>
                <Tooltip tooltipContent="GAME.EFFECTS.DURATION.TITLE">
                  <span className="inline-flex items-center gap-2">
                    <Icon type="buildingDuration" />
                    {formatTime(building?.buildingDuration[buildingLevel])}
                  </span>
                </Tooltip>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Building upgrade table */}
      <div className="flex flex-col gap-2">
        <SectionHeading>
          {t('GENERAL.BUILDING_UPGRADE_TABLE')}
        </SectionHeading>
        <BuildingUpgradeInformationTable
          building={building}
          level={buildingLevel}
        />
      </div>

    </div>
  );
};
