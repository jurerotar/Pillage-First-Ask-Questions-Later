export const TRAPPER_CAGE_COST = [35, 30, 10, 20];
export const TRAPPER_CAGE_BASE_DURATION = 10 * 60 * 1000;

export const TRAPPER_CAPACITY_PER_LEVEL = [
  0, 10, 22, 35, 49, 64, 80, 97, 115, 134, 154, 175, 196, 218, 241, 265, 290,
  316, 343, 371, 400,
];

export const calculateTrapperCapacity = (level: number): number => {
  return TRAPPER_CAPACITY_PER_LEVEL[Math.max(0, Math.min(20, level))]!;
};
