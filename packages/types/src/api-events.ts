import type { Building } from './models/building';
import type { BuildingField } from './models/building-field';
import type { GameEvent, GameEventType } from './models/game-event';
import type { Tile } from './models/tile';
import type { Village } from './models/village';

type EventKey =
  | 'event:database-initialization-success'
  | 'event:database-initialization-error'
  | 'event:success'
  | 'event:error'
  | 'event:created'
  | 'scheduled-building-construction:cancelled';

export type ApiNotificationEvent = {
  eventKey: EventKey;
};

export type DatabaseInitializationErrorEvent = {
  eventKey: EventKey;
  error: Error;
};

export type ControllerErrorEvent = {
  eventKey: EventKey;
  error: Error;
};

export type EventApiNotificationEvent<
  T extends GameEventType | undefined = undefined,
> = GameEvent<T> & {
  eventKey: EventKey;
  affectedVillageIds: (Village['id'] | null)[];
  affectedTileIds: Tile['id'][];
};

export type ScheduledBuildingConstructionCancellationReason =
  | 'missing-resources'
  | 'missing-requirements';

export type ScheduledBuildingConstructionCancelledNotificationEvent = {
  eventKey: 'scheduled-building-construction:cancelled';
  villageId: Village['id'];
  buildingId: Building['id'];
  buildingFieldId: BuildingField['id'];
  level: number;
  reason: ScheduledBuildingConstructionCancellationReason;
};
