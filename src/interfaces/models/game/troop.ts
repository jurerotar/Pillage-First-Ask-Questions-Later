import { Unit } from 'interfaces/models/game/unit';
import { Village } from 'interfaces/models/game/village';
import { WithServerId } from 'interfaces/models/game/server';

export type Troop = WithServerId<{
  unitId: Unit['id'];
  amount: number;
  villageId: Village['id'];
}>;
