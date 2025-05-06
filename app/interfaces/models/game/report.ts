import type { Village } from 'app/interfaces/models/game/village';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

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

export type TroopMovementReport = BaseReport & GameEvent<'troopMovement'>;

export type Report = BattleReport | ScoutReport | AdventureReport | TradeReport | TroopMovementReport;
