export type ReportTypes = 'attack' | 'defence' | 'miscellaneous';

export type Report = {
  id: number;
  type: ReportTypes;
  opened: boolean;
  archived: boolean;
};
