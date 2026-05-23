import { z } from 'zod';
import type { Coordinates } from './coordinates';
import type { Player } from './player';
import type { Tile } from './tile';
import type { UnitId } from './unit';
import type { Village } from './village';

export const reportTagSchema = z.enum(['read', 'archived']);
export type ReportTag = z.infer<typeof reportTagSchema>;

export const reportTypeSchema = z.enum([
  'attack',
  'raid',
  'defence',
  'scout-attack',
  'scout-defence',
  'adventure',
  'trade',
]);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const reportOutcomeSchema = z.enum([
  'attacker-wins',
  'defender-wins',
  'draw',
]);
export type ReportOutcome = z.infer<typeof reportOutcomeSchema>;

export type ReportTroopRecord = {
  unitId: UnitId;
  amount: number;
  losses: number;
};

export type ReportParty = {
  playerId: Player['id'] | null;
  villageId: Village['id'] | null;
  villageName: string | null;
  coordinates: Coordinates;
};

export type BattleReportPayload = {
  attacker: ReportParty;
  defender: ReportParty;
  attackers: ReportTroopRecord[];
  defenders: ReportTroopRecord[];
  bonuses: {
    wallDefenceBonus: number;
    wallDefenceBase: number;
    moralBonus: number;
    oasisDefenceBonus: number;
  };
  loot?: [number, number, number, number];
};

type BaseReport = {
  id: number;
  type: ReportType;
  timestamp: number;
  villageId: Village['id'];
  defenderTileId: Tile['id'];
  outcome: ReportOutcome;
  tags: ReportTag[];
};

export type AttackReport = BaseReport & {
  type: 'attack' | 'defence' | 'raid';
  payload: BattleReportPayload;
};

export type Report = AttackReport;
