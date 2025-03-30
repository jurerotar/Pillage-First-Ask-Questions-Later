import type { Village } from 'app/interfaces/models/game/village';
import type { Troop } from 'app/interfaces/models/game/troop';

export type TroopMovementType = 'attack' | 'raid' | 'reinforcement' | 'relocation' | 'return';

export type TroopMovement = {
  originatingVillageId: Village['id'];
  targetVillageId: Village['id'];
  troops: Troop[];
  movementType: TroopMovementType;
};
