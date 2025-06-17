import type {
  AdventureReport,
  BattleReport,
  Report,
  ScoutReport,
  TradeReport,
  TroopMovementReport,
} from 'app/interfaces/models/game/report';

type ReportOmitter<T extends Report> = Omit<T, 'id' | 'tags' | 'timestamp'>;

type ReportFactoryArgs =
  | ReportOmitter<BattleReport>
  | ReportOmitter<AdventureReport>
  | ReportOmitter<TradeReport>
  | ReportOmitter<ScoutReport>
  | ReportOmitter<TroopMovementReport>;

export function reportFactory(args: ReportOmitter<BattleReport>): BattleReport;
export function reportFactory(
  args: ReportOmitter<AdventureReport>,
): AdventureReport;
export function reportFactory(args: ReportOmitter<TradeReport>): TradeReport;
export function reportFactory(args: ReportOmitter<ScoutReport>): ScoutReport;
export function reportFactory(
  args: ReportOmitter<TroopMovementReport>,
): TroopMovementReport;

export function reportFactory(args: ReportFactoryArgs): Report {
  return {
    id: crypto.randomUUID(),
    tags: [],
    timestamp: Date.now(),
    ...args,
  };
}
