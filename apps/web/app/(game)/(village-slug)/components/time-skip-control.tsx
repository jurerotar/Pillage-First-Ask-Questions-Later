import { useMutation } from '@tanstack/react-query';
import { use, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiClockClockwise } from 'react-icons/pi';
import { toast } from 'sonner';
import { useGameLayoutState } from 'app/(game)/(village-slug)/hooks/use-game-layout-state.ts';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import {
  appTimeCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { advanceCurrentTime } from 'app/(game)/utils/timer';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import { Slider } from 'app/components/ui/slider';
import { invalidateQueries } from 'app/utils/react-query.ts';

const minMinutes = 0;
const maxMinutes = 600;
const minuteStep = 15;

const clampMinutes = (minutes: number) => {
  return Math.min(maxMinutes, Math.max(minMinutes, minutes));
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

export const TimeSkipControlContent = () => {
  const { t } = useTranslation();
  const { fetcher } = use(ApiContext);
  const [minutesToSkip, setMinutesToSkip] = useState(15);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { mutate: skipTime, isPending } = useMutation({
    mutationFn: async (minutes: number) => {
      await fetcher('/events/skip-time', {
        method: 'POST',
        body: {
          duration: minutes * 60 * 1000,
        },
      });
    },
    onSuccess: async (_, minutes, _onMutateResult, context) => {
      advanceCurrentTime(minutes * 60 * 1000);

      await invalidateQueries(context, [[appTimeCacheKey], [eventsCacheKey]]);

      toast(t('Time advanced'), {
        description: t('Advanced by {{duration}}', {
          duration: formatDuration(minutes),
        }),
      });

      setIsOpen(false);
    },
  });

  return (
    <aside className="fixed left-1 bottom-40 lg:bottom-86 transition-all">
      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <PopoverTrigger asChild>
          <button
            aria-label="Time skip"
            data-tooltip-id="general-tooltip"
            data-tooltip-content="Time skip"
            className="size-10 lg:size-12 bg-background rounded-full p-1 lg:p-2 border-4 border-border hover:bg-accent inline-flex items-center justify-center"
            type="button"
          >
            <PiClockClockwise className="size-5 lg:size-6" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="top"
          className="w-60 lg:w-72"
        >
          <div className="space-y-3">
            <Text className="text-xs text-muted-foreground">
              {t('Time skip')}: {formatDuration(minutesToSkip)}
            </Text>
            <Slider
              value={[minutesToSkip]}
              min={minMinutes}
              max={maxMinutes}
              step={minuteStep}
              disabled={isPending}
              onValueChange={([value]) => {
                setMinutesToSkip(clampMinutes(value ?? minMinutes));
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending || minutesToSkip <= minMinutes}
                onClick={() => {
                  setMinutesToSkip((current) =>
                    clampMinutes(current - minuteStep),
                  );
                }}
              >
                -15m
              </Button>
              <Text className="text-sm font-medium min-w-20 text-center">
                {formatDuration(minutesToSkip)}
              </Text>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending || minutesToSkip >= maxMinutes}
                onClick={() => {
                  setMinutesToSkip((current) =>
                    clampMinutes(current + minuteStep),
                  );
                }}
              >
                +15m
              </Button>
            </div>
            <div className="flex w-full justify-end">
              <Button
                size="fit"
                disabled={minutesToSkip === 0 || isPending}
                onClick={() => {
                  skipTime(minutesToSkip);
                }}
              >
                {t('Skip')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </aside>
  );
};

export const TimeSkipControl = () => {
  const { shouldShowSidebars } = useGameLayoutState();
  const { preferences } = usePreferences();

  if (!shouldShowSidebars || !preferences.shouldShowTimeSkipButton) {
    return null;
  }

  return <TimeSkipControlContent />;
};
