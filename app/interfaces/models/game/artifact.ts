import type { Effect } from 'app/interfaces/models/game/effect';

type MilitaryArtifactId =
  `MILITARY_${'TROOP_TRAVEL_SPEED' | 'TROOP_CARRYING_CAPACITY' | 'TROOP_TRAINING_REDUCTION' | 'TROOP_WHEAT_CONSUMPTION_REDUCTION'}`;
type CivilArtifactId =
  `CIVIL_${'BUILD_TIME_REDUCTION' | 'OASIS_PRODUCTION_BONUS' | 'RESOURCE_PRODUCTION_BONUS' | 'ENABLE_GREAT_BUILDINGS'}`;

type ArtifactId = MilitaryArtifactId | CivilArtifactId;

export type Artifact = {
  id: ArtifactId;
  effects: Effect[];
};
