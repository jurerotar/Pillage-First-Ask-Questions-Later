import type { Village } from 'app/interfaces/models/game/village';
import type { Troop } from 'app/interfaces/models/game/troop';

export type ReportTag = 'read' | 'archived';

export type ReportStatus = 'no-loss' | 'some-loss' | 'full-loss';

type BaseReport = {
  id: string;
  tags: ReportTag[];
  timestamp: number;
  villageId: Village['id'];
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
  type: 'relocation' | 'reinforcements' | 'return';
  troops: Troop[];
  targetVillageId: Village['id'];
};

export type Report = BattleReport | ScoutReport | AdventureReport | TradeReport | TroopMovementReport;
