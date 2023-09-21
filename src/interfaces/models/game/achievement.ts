import { WithServerId } from 'interfaces/models/game/server';

export type Achievement = WithServerId<{
  id: number;
  isCompleted: boolean;
}>;
