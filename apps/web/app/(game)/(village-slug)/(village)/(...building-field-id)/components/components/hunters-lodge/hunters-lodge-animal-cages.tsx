import { use } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  ANIMAL_CAGE_BASE_DURATION,
  ANIMAL_CAGE_COST,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import { calculateMaxUnits } from '@pillage-first/game-assets/utils/units';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useHasEnoughResources } from 'app/(game)/(village-slug)/hooks/current-village/use-has-enough-resources';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { CurrentVillageStateContext } from 'app/(game)/(village-slug)/providers/current-village-state-provider';
import { currentVillageCacheKey } from 'app/(game)/constants/query-keys';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Button } from 'app/components/ui/button';
import { Input } from 'app/components/ui/input';
import { Slider } from 'app/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { formatTime } from 'app/utils/time';

const AnimalCageProductionQueue = () => {
  const { t } = useTranslation();
  const { eventsByType } = useEventsByType('animalCageProduction');

  return (
    <div className="scrollbar-hidden overflow-x-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Item')}</TableHeaderCell>
            <TableHeaderCell>{t('Amount')}</TableHeaderCell>
            <TableHeaderCell>{t('Ready in')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eventsByType.length > 0 &&
            eventsByType.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <span className="inline-flex gap-2 items-center">
                    <Icon
                      className="size-5"
                      type="trapperCapacity"
                    />
                    {t('ITEMS.ANIMAL_CAGE.NAME', {
                      count: event.cageAmount,
                    })}
                  </span>
                </TableCell>
                <TableCell>{formatNumber(event.cageAmount)}</TableCell>
                <TableCell>
                  <Countdown endsAt={event.resolvesAt} />
                </TableCell>
              </TableRow>
            ))}
          {eventsByType.length === 0 && (
            <TableRow>
              <TableCell colSpan={3}>
                <Text>{t('No animal cages are currently being built')}</Text>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export const HuntersLodgeAnimalCages = () => {
  const { t } = useTranslation();
  const currentResources = use(CurrentVillageStateContext);
  const { serverSpeed } = useServer();
  const { createEvent } = useCreateEvent('animalCageProduction');
  const { developerSettings } = useDeveloperSettings();
  const { isFreeUnitTrainingEnabled, isInstantUnitTrainingEnabled } =
    developerSettings;

  const form = useForm({ defaultValues: { amount: 0 } });
  const { register, handleSubmit, setValue, watch } = form;
  const amount = watch('amount');

  const individualCageCost = isFreeUnitTrainingEnabled
    ? [0, 0, 0, 0]
    : ANIMAL_CAGE_COST;
  const maxCages = isFreeUnitTrainingEnabled
    ? 1000
    : calculateMaxUnits(currentResources, individualCageCost);
  const totalCost = individualCageCost.map((cost) => cost * amount);
  const { errorBag } = useHasEnoughResources(totalCost);
  const durationPerCage = isInstantUnitTrainingEnabled
    ? 0
    : ANIMAL_CAGE_BASE_DURATION / serverSpeed;
  const totalDuration = durationPerCage * amount;

  const onSubmit = ({ amount }: { amount: number }) => {
    form.reset();

    createEvent({
      cageAmount: amount,
      cachesToClearImmediately: [[currentVillageCacheKey]],
    });
  };

  const buttonLabel = (() => {
    if (errorBag.length > 0 || maxCages === 0) {
      return t('Not enough resources');
    }
    if (amount === 0) {
      return t('Select the amount of animal cages to build');
    }

    return t('Build {{count}} {{item}}', {
      count: amount,
      item: t('ITEMS.ANIMAL_CAGE.NAME', { count: amount }),
    });
  })();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="animal-cages" />
        <Text as="h2">{t('Animal cages')}</Text>
        <Text>
          {t(
            'Animal cages are used by your Hero to capture animals from oasis. A full batch is delivered to your hero inventory when production finishes.',
          )}
        </Text>
        <Alert variant="warning">
          {t(
            'Hero inventory is not yet implemented. You will not be able to use your cages until then.',
          )}
        </Alert>
      </SectionContent>
      <SectionContent>
        <AnimalCageProductionQueue />
      </SectionContent>
      <SectionContent>
        <article className="flex flex-col gap-2 p-2 border border-border">
          <section>
            <div className="inline-flex gap-2 items-center font-semibold">
              <Icon
                className="size-6"
                type="trapperCapacity"
              />
              <Text as="h2">{t('ITEMS.ANIMAL_CAGE.NAME', { count: 2 })}</Text>
            </div>
            <Text>
              {t(
                'A reinforced cage designed for capturing and transporting wild animals.',
              )}
            </Text>
          </section>
          <section className="flex flex-col gap-2 pt-2 border-t border-border">
            <Text as="h3">{t('Cost and production duration')}</Text>
            <div className="flex gap-2 items-start justify-start flex-wrap">
              <Resources resources={individualCageCost} />
              <div className="flex gap-1 items-center">
                <Icon
                  className="size-5"
                  type="trapperCapacity"
                />
                {formatTime(durationPerCage)}
              </div>
            </div>
          </section>
          <section className="pt-2 flex flex-col gap-2 border-t border-border">
            <Text as="h3">{t('Build cages')}</Text>
            <div className="flex items-start gap-2 justify-start flex-wrap">
              <Resources resources={totalCost} />
              <div className="flex gap-1 items-center">
                <Icon
                  className="size-5"
                  type="trapperCapacity"
                />
                {formatTime(totalDuration)}
              </div>
            </div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <Slider
                  min={0}
                  max={maxCages}
                  value={[amount]}
                  disabled={maxCages === 0}
                  onValueChange={([val]) => setValue('amount', val)}
                />
                <div className="flex w-30">
                  <Input
                    type="number"
                    min={0}
                    max={maxCages}
                    {...register('amount', { valueAsNumber: true })}
                    value={amount}
                    disabled={maxCages === 0}
                    onChange={(e) => setValue('amount', Number(e.target.value))}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="fit"
                  className="px-1.5 py-1 h-full"
                  disabled={maxCages === 0}
                  onClick={() => setValue('amount', maxCages)}
                >
                  ({maxCages})
                </Button>
              </div>
              <Button
                size="fit"
                type="submit"
                disabled={maxCages === 0 || amount === 0 || amount > maxCages}
              >
                {buttonLabel}
              </Button>
            </form>
            <ErrorBag errorBag={errorBag} />
          </section>
        </article>
      </SectionContent>
    </Section>
  );
};
