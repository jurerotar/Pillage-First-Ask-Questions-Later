import { WithServerId } from 'interfaces/models/game/server';

export type ReportTypes = 'attack' | 'defence' | 'miscellaneous';

export type Report = WithServerId<{
  id: number;
  type: ReportTypes;
  opened: boolean;
  archived: boolean;
}>;
