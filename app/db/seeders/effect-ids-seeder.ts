import type { Seeder } from 'app/interfaces/db';
import { batchInsert } from 'app/db/utils/batch-insert';
import type { Effect } from 'app/interfaces/models/game/effect';

export const effectIdsSeeder: Seeder = (database): void => {
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
