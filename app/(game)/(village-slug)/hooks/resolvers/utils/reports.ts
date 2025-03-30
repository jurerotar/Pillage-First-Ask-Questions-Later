import type { Troop } from 'app/interfaces/models/game/troop';
import type { Village } from 'app/interfaces/models/game/village';
import type { AdventureReport, BattleReport, ScoutReport, TradeReport, TroopMovementReport } from 'app/interfaces/models/game/report';
import type { Resources } from 'app/interfaces/models/game/resource';
import type { PickLiteral } from 'app/utils/typescript';
import type { TroopMovement, TroopMovementType } from 'app/interfaces/models/game/troop-movement';

type GenerateTroopMovementReportArgs = Omit<TroopMovement, 'movementType'> & {
  movementType: PickLiteral<TroopMovementType, 'reinforcement' | 'relocation'>;
};

export const generateTroopMovementReport = (args: GenerateTroopMovementReportArgs): TroopMovementReport => {
};

type GenerateBattleReportArgs = {
  attackingVillage: Village;
  defendingVillage: Village;
  attackingTroops: Troop[];
  survivingAttackingTroops: Troop[];
  defendingTroops: Troop[];
  survivingDefendingTroops: Troop[];
  attackType: 'attack' | 'raid';
  stolenResources: Resources;
};

export const generateScoutingReport = (args: GenerateBattleReportArgs): ScoutReport => {
};

export const generateBattleReport = (args: GenerateBattleReportArgs): BattleReport => {
};

export const generateTradeReport = (): TradeReport => {
};

export const generateAdventureReport = (): AdventureReport => {
};
