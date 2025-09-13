import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { preferencesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useTranslation } from 'react-i18next';
import type { AvailableLocale } from 'app/interfaces/models/locale';
import { loadAppTranslations } from 'app/localization/loaders/app';
import { z } from 'zod';

type UpdatePreferenceArgs = {
  preferenceName: keyof Preferences;
  value: Preferences[keyof Preferences];
};

const _getPreferencesSchema = z.strictObject({
  color_scheme: z.enum(['light', 'dark']),
  locale: z.enum(['en-US'] satisfies AvailableLocale[]),
  timeOfDay: z.enum(['day', 'night'] satisfies Preferences['timeOfDay'][]),
  skinVariant: z.enum(['default'] satisfies Preferences['skinVariant'][]),
  isAccessibilityModeEnabled: z.number(),
  isReducedMotionModeEnabled: z.number(),
  shouldShowBuildingNames: z.number(),
  isAutomaticNavigationAfterBuildingLevelChangeEnabled: z.number(),
  isDeveloperModeEnabled: z.number(),
  shouldShowNotificationsOnBuildingUpgradeCompletion: z.number(),
  shouldShowNotificationsOnUnitUpgradeCompletion: z.number(),
  shouldShowNotificationsOnAcademyResearchCompletion: z.number(),
});

export const usePreferences = () => {
  const { fetcher } = use(ApiContext);
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();

  const { data: preferences } = useSuspenseQuery<Preferences>({
    queryKey: [preferencesCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Preferences>('/me/preferences');
      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const { mutate: updatePreference } = useMutation<
    void,
    Error,
    UpdatePreferenceArgs
  >({
    mutationFn: async ({ preferenceName, value }) => {
      await fetcher<Preferences>(`/me/preferences/${preferenceName}`, {
        method: 'PATCH',
        body: {
          value,
        },
      });
    },
    onSuccess: async (_, { preferenceName, value }) => {
      await queryClient.invalidateQueries({ queryKey: [preferencesCacheKey] });
      if (preferenceName === 'locale') {
        const locale = value as AvailableLocale;

        await loadAppTranslations(locale);
        await i18n.changeLanguage(locale);
      }
    },
  });

  return {
    preferences,
    updatePreference,
  };
};
