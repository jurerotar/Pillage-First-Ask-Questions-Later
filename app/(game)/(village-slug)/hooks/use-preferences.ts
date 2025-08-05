import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { preferencesCacheKey } from "app/(game)/(village-slug)/constants/query-keys";
import type { Preferences } from "app/interfaces/models/game/preferences";
import { use, useEffect } from "react";
import { ApiContext } from "app/(game)/providers/api-provider";
import { syncLocaleFromPreferences } from "app/utils/locale-sync";

type UpdatePreferenceArgs = {
  preferenceName: keyof Preferences;
  value: Preferences[keyof Preferences];
};

export const usePreferences = () => {
  const { fetcher } = use(ApiContext);
  const queryClient = useQueryClient();

  const { data: preferences } = useSuspenseQuery<Preferences>({
    queryKey: [preferencesCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Preferences>("/me/preferences");
      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  // Sync locale with i18n when preferences are loaded or updated
  useEffect(() => {
    if (preferences) {
      syncLocaleFromPreferences(preferences);
    }
  }, [preferences]); // Changed from [preferences.locale] to [preferences] to run on initial load

  const { mutate: updatePreference } = useMutation<
    void,
    Error,
    UpdatePreferenceArgs
  >({
    mutationFn: async ({ preferenceName, value }) => {
      await fetcher<Preferences>(`/me/preferences/${preferenceName}`, {
        method: "PATCH",
        body: {
          value,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [preferencesCacheKey] });
    },
  });

  return {
    preferences,
    updatePreference,
  };
};
