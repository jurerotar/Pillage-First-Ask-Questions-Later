import type { Troop } from 'app/interfaces/models/game/troop';
import type { Village } from 'app/interfaces/models/game/village';
import type { OasisOccupationReport, TroopMovementReport } from 'app/interfaces/models/game/report';
import type { Resources } from 'app/interfaces/models/game/resource';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { reportFactory } from 'app/factories/report-factory';

type EventOmitter<T extends GameEvent> = Omit<T, 'id' | 'startsAt' | 'duration' | 'type'>;

type GenerateTroopMovementReportArgs = EventOmitter<GameEvent<'troopMovement'>>;

export const generateTroopMovementReport = (args: GenerateTroopMovementReportArgs): TroopMovementReport => {
  const { movementType, villageId, troops, targetId } = args;
  return reportFactory({ villageId, troops, targetId, type: movementType });
};

type GenerateOasisOccupationTroopMovementReportArgs = EventOmitter<GameEvent<'oasisOccupation'>>;

export const generateOasisOccupationTroopMovementReport = (args: GenerateOasisOccupationTroopMovementReportArgs): OasisOccupationReport => {
  const { movementType, villageId, troops, targetId } = args;
  return reportFactory({ villageId, troops, targetId, type: movementType });
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

export const generateScoutingReport = (_args: GenerateBattleReportArgs) => {};

export const generateBattleReport = (_args: GenerateBattleReportArgs) => {};

export const generateTradeReport = () => {};

export const generateAdventureReport = () => {};
