import type { Effect } from '@pillage-first/types/models/effect';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const effectIdsSeeder = (database: DbFacade): void => {
  const effectIds: Effect['id'][] = [
    // !! wheatProduction must always remain at the top, because we use its id of 1 as a partial index in effects table !!
    'wheatProduction',
    'woodProduction',
    'clayProduction',
    'ironProduction',
    'barracksTrainingDuration',
    'greatBarracksTrainingDuration',
    'stableTrainingDuration',
    'greatStableTrainingDuration',
    'workshopTrainingDuration',
    'hospitalTrainingDuration',
    'attack',
    'defence',
    'defenceBonus',
    'infantryDefence',
    'cavalryDefence',
    'warehouseCapacity',
    'granaryCapacity',
    'unitSpeed',
    'unitSpeedAfter20Fields',
    'unitWheatConsumption',
    'unitCarryCapacity',
    'buildingDuration',
    'unitResearchDuration',
    'unitImprovementDuration',
    'merchantSpeed',
    'merchantCapacity',
    'merchantAmount',
    'crannyCapacity',
    'trapperCapacity',
    'revealedIncomingTroopsAmount',
  ];

  batchInsert(
    database,
    'effect_ids',
    ['effect'],
    effectIds.map((effect) => [effect]),
  );
};
