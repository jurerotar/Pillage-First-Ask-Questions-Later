import type { Village } from './village';

export type ReportTag = 'read' | 'archived';

export type ReportType =
  | 'attack'
  | 'raid'
  | 'defence'
  | 'scout-attack'
  | 'scout-defence'
  | 'adventure'
  | 'trade';

type BaseReport = {
  id: string;
  tags: ReportTag[];
  timestamp: number;
  villageId: Village['id'];
};

export type Report = BaseReport;
