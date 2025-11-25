import type { ApiHandler } from 'app/interfaces/api';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import {
  eventsCacheKey,
  preferencesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { isBuildingLevelUpEvent } from 'app/(game)/guards/event-guards';
import { scheduleNextEvent } from 'app/(game)/api/utils/event-resolvers';

export const getPreferences: ApiHandler<Preferences> = async (queryClient) => {
  return queryClient.getQueryData<Preferences>([preferencesCacheKey])!;
};

type UpdatePreferenceBody = {
  value: Preferences[keyof Preferences];
};

export const updatePreference: ApiHandler<
  void,
  'preferenceName',
  UpdatePreferenceBody
> = async (queryClient, args) => {
  const { body, params } = args;

  const { preferenceName } = params;
  const { value } = body;

  queryClient.setQueryData<Preferences>(
    [preferencesCacheKey],
    (prevPreferences) => {
      return {
        ...prevPreferences!,
        [preferenceName]: value,
      };
    },
  );

  if (preferenceName === 'isDeveloperModeEnabled' && value === true) {
    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], (events) => {
      for (const event of events!) {
        if (isBuildingLevelUpEvent(event)) {
          event.startsAt = Date.now();
          event.duration = 0;
        }
      }

      scheduleNextEvent(queryClient);

      return events;
    });
  }
};
