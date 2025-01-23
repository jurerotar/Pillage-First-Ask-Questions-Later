import type { Artifact } from 'app/interfaces/models/game/artifact';

export const artifacts: Artifact[] = [
  {
    id: 'MILITARY_TROOP_TRAVEL_SPEED',
    effects: [
      {
        id: 'unitSpeed',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'MILITARY_TROOP_CARRYING_CAPACITY',
    effects: [
      {
        id: 'unitCarryCapacity',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'MILITARY_TROOP_TRAINING_REDUCTION',
    effects: [
      {
        id: 'barracksTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'greatBarracksTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'stableTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'greatStableTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'workshopTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'hospitalTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'MILITARY_TROOP_WHEAT_CONSUMPTION_REDUCTION',
    effects: [
      {
        id: 'unitWheatConsumptionReduction',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'CIVIL_BUILD_TIME_REDUCTION',
    effects: [
      {
        id: 'buildingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'CIVIL_OASIS_PRODUCTION_BONUS',
    // TODO: Figure out how to implement this. It should only target oasis bonuses. Or think of another artifact effect
    effects: [
      // {
      //   id: '',
      //   value: 0,
      //   scope: 'global',
      //   source: 'artifact',
      // }
    ],
  },
  {
    id: 'CIVIL_RESOURCE_PRODUCTION_BONUS',
    effects: [
      {
        id: 'woodProductionBonus',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'clayProductionBonus',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'ironProductionBonus',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'wheatProductionBonus',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'CIVIL_ENABLE_GREAT_BUILDINGS',
    effects: [],
  },
];
