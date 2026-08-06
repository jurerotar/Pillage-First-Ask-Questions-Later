import type { Building } from '@pillage-first/types/models/building';

const healingTroopTrainingBuildings = new Set<Building['id']>([
  'HOSPITAL',
  'ASCLEPEION',
]);

export const isHealingTroopTrainingBuilding = (
  buildingId: string,
): buildingId is Extract<Building['id'], 'HOSPITAL' | 'ASCLEPEION'> => {
  return healingTroopTrainingBuildings.has(buildingId as Building['id']);
};

export const isAsclepeion = (
  buildingId: string,
): buildingId is 'ASCLEPEION' => {
  return buildingId === 'ASCLEPEION';
};

export const isHospital = (buildingId: string): buildingId is 'HOSPITAL' => {
  return buildingId === 'HOSPITAL';
};
