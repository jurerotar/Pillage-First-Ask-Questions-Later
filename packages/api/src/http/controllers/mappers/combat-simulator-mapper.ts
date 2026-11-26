import type { CombatTroop } from '@pillage-first/types/models/combat';

export const mapUnits = (troops: CombatTroop[]) =>
  troops.map(({ unitId, amount }) => ({
    unitId,
    amountBefore: amount,
    amountAfter: amount,
    amountHospitalized: 0,
    amountImprisoned: 0,
    amountBandaged: 0,
    amountConsumed: 0,
  }));
