export type ReportTag = 'read' | 'archived' | 'deleted';

export type ReportStatus = 'no-loss' | 'some-loss' | 'full-loss';

type BaseReport = {
  id: number;
  tags: ReportTag[];
  timestamp: Date;
};

export type BattleReport = BaseReport & {
  type: 'attack' | 'defence';
  status: ReportStatus;
};

export type ScoutReport = BaseReport & {
  type: 'scout-attack' | 'scout-defence';
  status: ReportStatus;
};

export type AdventureReport = BaseReport & {
  type: 'adventure';
};

export type TradeReport = BaseReport & {
  type: 'trade';
};

export type TroopMovementReport = BaseReport & {
  type: 'troop-movement';
};

export type Report = BattleReport | ScoutReport | AdventureReport | TradeReport | TroopMovementReport;
