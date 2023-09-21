import { WithServerId } from 'interfaces/models/game/server';

export type Bank = WithServerId<{
  amount: number;
}>;
