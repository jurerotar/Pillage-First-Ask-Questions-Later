import React, { useMemo } from 'react';
import { useContextSelector } from 'use-context-selector';
import { VillageContext } from 'providers/game/village-context';
import { BuildingInformationModalContent } from 'components/modal-content/game/building-information-modal-content';
import { ModalContext } from 'providers/global/modal-context';
import { Building } from 'interfaces/models/game/building';
import { Resource, Resources } from 'interfaces/models/game/resource';
import { arrayTupleToObject } from 'utils/common';
import _buildings from 'assets/buildings.json';
import { BuildingFieldId, ResourceFieldId } from 'interfaces/models/game/village';

const buildings = _buildings as Building[];

enum BuildingUpgradeIconBackgroundGradients {
  MAX_LEVEL = 'linear-gradient(to top,#0d648e,#b1e4ff 100%)',
  NOT_ENOUGH_STORAGE_SPACE = 'linear-gradient(to top,#606060,#c8c8c8 100%)',
  NOT_ENOUGH_RESOURCES = 'linear-gradient(to top,#988b42,#fdf15f 100%)',
  UPGRADE_AVAILABLE = 'linear-gradient(to top,#7da100,#c7e94f 100%)',
}

type BuildingFieldProps = {
  buildingFieldId: ResourceFieldId | BuildingFieldId;
  buildingId: Building['id'];
  buildingLevel: number;
  className?: string;
};

export const BuildingField: React.FC<BuildingFieldProps> = (props) => {
  const {
    buildingFieldId,
    buildingId,
    buildingLevel,
    className = ''
  } = props;

  const calculatedResources = useContextSelector(VillageContext, (v) => v.calculatedResources);
  const storageCapacity = useContextSelector(VillageContext, (v) => v.storageCapacity);
  const openModal = useContextSelector(ModalContext, (v) => v.openModal);

  const building = useMemo<Building>(() => {
    return buildings.find((build: Building) => build.id === buildingId)!;
  }, [buildingId]);

  const nextLevelResourceCost = useMemo<Resources>(() => {
    const resources = ['wood', 'clay', 'iron', 'wheat'] as Resource[];
    const costPerResource = resources.map((resource: Resource) => building[resource][buildingLevel]);
    return arrayTupleToObject<Resource[], number[]>(resources, costPerResource) as Resources;
  }, [building, buildingLevel]);

  const isMaxLevel: boolean = buildingLevel === building.maxLevel;

  const hasEnoughStorageSpace = useMemo<boolean>(() => {
    return Object.keys(calculatedResources)
      .every((resource) => calculatedResources[resource as Resource] <= storageCapacity[resource as Resource]);
  }, [storageCapacity, isMaxLevel, nextLevelResourceCost]);

  const canUpgradeToNextLevel = useMemo<boolean>(() => {
    if (isMaxLevel) {
      return false;
    }
    return Object.keys(calculatedResources)
      .every((resource) => calculatedResources[resource as Resource] >= nextLevelResourceCost[resource as Resource]);
  }, [calculatedResources, isMaxLevel, nextLevelResourceCost]);

  const buildingIconGradient = useMemo<string>(() => {
    if (isMaxLevel) {
      return BuildingUpgradeIconBackgroundGradients.MAX_LEVEL;
    }
    if (!hasEnoughStorageSpace) {
      return BuildingUpgradeIconBackgroundGradients.NOT_ENOUGH_STORAGE_SPACE;
    }
    if (canUpgradeToNextLevel) {
      return BuildingUpgradeIconBackgroundGradients.UPGRADE_AVAILABLE;
    }
    return BuildingUpgradeIconBackgroundGradients.NOT_ENOUGH_RESOURCES;
  }, [isMaxLevel, hasEnoughStorageSpace, canUpgradeToNextLevel]);

  return (
    <button
      type="button"
      onClick={() => openModal((
        <BuildingInformationModalContent
          buildingFieldId={buildingFieldId}
          buildingId={buildingId}
          buildingLevel={buildingLevel}
          canUpgrade={canUpgradeToNextLevel}
        />
      ))}
      className={className}
    >
      <span className="relative">
        <span
          className="absolute-centering absolute h-[26px] w-[26px] rounded-full"
          style={{
            backgroundImage: buildingIconGradient
          }}
        >
          <span className="absolute-centering absolute flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-sm leading-none text-gray-700">
            {buildingLevel}
          </span>
        </span>
      </span>
    </button>
  );
};
