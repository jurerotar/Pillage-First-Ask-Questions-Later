import { WithServerId } from 'interfaces/models/game/server';

export type ReportTypes =
  | 'attack'
  | 'defence'
  | 'miscellaneous';

export type ReportTag =
  | 'read'
  | 'archived'
  | 'deleted';

export type Report = WithServerId<{
  id: number;
  type: ReportTypes;
  tags: ReportTag[];
}>;
