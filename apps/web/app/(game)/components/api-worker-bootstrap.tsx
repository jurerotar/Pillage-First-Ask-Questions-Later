import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { type PropsWithChildren, use } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ApiContext } from 'app/(game)/providers/api-provider.tsx';
import { Text } from 'app/components/text.tsx';
import { Button } from 'app/components/ui/button.tsx';

const vacationModeSchema = z.strictObject({
  isVacationModeEnabled: z.boolean(),
});

export const ApiWorkerBootstrap = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  const { fetcher } = use(ApiContext);

  const { data: isVacationModeEnabled, refetch } = useSuspenseQuery({
    queryKey: ['vacation-mode-status'],
    queryFn: async () => {
      const { data } = await fetcher('/events/vacation');

      const { isVacationModeEnabled } = vacationModeSchema.parse(data);
      return isVacationModeEnabled;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const { mutate: disableVacationMode, isPending: isDisablingVacationMode } =
    useMutation({
      mutationFn: async () => {
        await fetcher('/events/vacation', {
          method: 'DELETE',
        });
      },
      onSuccess: async () => {
        await refetch();
      },
    });

  if (isVacationModeEnabled) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-background! p-4">
        <div className="rounded-md border border-border bg-card p-4 flex flex-col gap-3 max-w-xl w-full">
          <Text>
            {t(
              'This game world is currently paused by vacation mode. Disable it to resume gameplay.',
            )}
          </Text>
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              disabled={isDisablingVacationMode}
              onClick={() => {
                disableVacationMode();
              }}
            >
              {t('Disable vacation mode')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
