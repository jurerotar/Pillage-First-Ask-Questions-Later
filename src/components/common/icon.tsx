import React from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faClock,
  faDrumSteelpan,
  faLandmark,
  faRoadSpikes,
  faTree,
  faTrowelBricks,
  faUserPlus,
  faWheatAwn,
  faBan,
  faBuildingShield,
  faShield
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type AvailableIconTypes =
  | 'wood'
  | 'clay'
  | 'iron'
  | 'wheat'
  | 'cropConsumption'
  | 'culturePointsProduction'
  | 'trapperCapacity'
  | 'buildingDuration'
  | 'woodProduction'
  | 'clayProduction'
  | 'ironProduction'
  | 'wheatProduction'
  | 'totalResourceCost'
  | 'villageDefenceValue'
  | 'villageDefenceBonus';

/**
 *   TODO: Implement following icons
 *   'barracksTrainingDuration'
 *   | 'greatBarracksTrainingDuration'
 *   | 'stableTrainingDuration'
 *   | 'greatStableTrainingDuration'
 *   | 'workshopTrainingDuration'
 *   | 'hospitalTrainingDuration'
 *   | 'unitSpeedBonus'
 *   | 'unitSpeedAfter20TilesBonus'
 *   | 'amountOfUncoveredAttackingUnits'
 *   | 'amountOfUnlockedUnitResearchLevels'

 *   | 'buildingDurabilityBonus'
 *   | 'woodProductionBonus'
 *   | 'clayProductionBonus'
 *   | 'ironProductionBonus'
 *   | 'wheatProductionBonus'
 *   | 'oasisProductionBonus'
 *   | 'woodOasisProductionBonus'
 *   | 'clayOasisProductionBonus'
 *   | 'ironOasisProductionBonus'
 *   | 'wheatOasisProductionBonus'
 *   | 'oasisExpansionSlot'
 *   | 'culturePointsProductionBonus'
 *   | 'crannyCapacity'
 *   | 'crannyCapacityBonus'
 *   | 'breweryAttackBonus'
 *   | 'embassyCapacity'
 *   | 'merchantAmount'
 *   | 'merchantCapacityBonus'
 *   | 'granaryCapacity'
 *   | 'warehouseCapacity';
 */

type IconProps = {
  type: AvailableIconTypes;
  fixedWidth?: boolean;
  className?: string;
};

type IconProperties = {
  icon: IconDefinition,
  color: string;
};

const typeToIconMap: { [key in Partial<AvailableIconTypes>]: IconProperties } = {
  wood: {
    icon: faTree,
    color: 'text-green-600'
  },
  clay: {
    icon: faTrowelBricks,
    color: 'text-red-300'
  },
  iron: {
    icon: faDrumSteelpan,
    color: 'text-gray-300'
  },
  wheat: {
    icon: faWheatAwn,
    color: 'text-yellow-300'
  },
  cropConsumption: {
    icon: faUserPlus,
    color: 'text-gray-800'
  },
  culturePointsProduction: {
    icon: faLandmark,
    color: 'text-stone-500'
  },
  buildingDuration: {
    icon: faClock,
    color: 'text-gray-300'
  },
  woodProduction: {
    icon: faTree,
    color: 'text-green-600'
  },
  clayProduction: {
    icon: faTrowelBricks,
    color: 'text-red-300'
  },
  ironProduction: {
    icon: faDrumSteelpan,
    color: 'text-gray-300'
  },
  wheatProduction: {
    icon: faWheatAwn,
    color: 'text-yellow-300'
  },
  totalResourceCost: {
    icon: faWheatAwn,
    color: 'text-yellow-300'
  },
  trapperCapacity: {
    icon: faRoadSpikes,
    color: 'text-gray-300'
  },
  villageDefenceValue: {
    icon: faBuildingShield,
    color: 'text-red-300'
  },
  villageDefenceBonus: {
    icon: faShield,
    color: 'text-gray-300'
  }
};

// TODO: Some FontAwesome will get replaced by custom icons eventually
const Icon: React.FC<IconProps> = (props): JSX.Element => {
  const {
    type,
    fixedWidth = true,
    className = ''
  } = props;

  return (
    <FontAwesomeIcon
      icon={typeToIconMap[type].icon ?? faBan}
      fixedWidth={fixedWidth}
      className={`${typeToIconMap[type].color ?? 'text-red-500'} ${className}`}
    />
  );
};

export default Icon;
