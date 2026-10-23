import type { CombatSimulatorTroop } from '@pillage-first/types/models/combat-simulator';

export const mapUnits = (troops: CombatSimulatorTroop[]) =>
  troops.map(({ unitId, amount }) => ({
    unitId,
    amountBefore: amount,
    amountAfter: amount,
    amountHospitalized: 0,
    amountImprisoned: 0,
  }));
