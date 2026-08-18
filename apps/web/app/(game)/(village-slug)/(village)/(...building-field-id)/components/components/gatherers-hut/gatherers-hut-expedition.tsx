import { zodResolver } from '@hookform/resolvers/zod';
import { use, useEffect, useMemo } from 'react';
import { type Resolver, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  calculateGatherersHutGatheringDuration,
  calculateGatherersHutGatheringResources,
  calculateGatherersHutPartySize,
} from '@pillage-first/game-assets/utils/gatherers-hut';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Troop } from '@pillage-first/types/models/troop';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import {
  TroopConfirmationContent,
  TroopConfirmationFooter,
  TroopConfirmationHeader,
  TroopConfirmationUnitTable,
} from 'app/(game)/(village-slug)/components/send-troops/components/confirmation-modal';
import { UnitSelector } from 'app/(game)/(village-slug)/components/send-troops/components/unit-selector';
import { unitSelectionSchema } from 'app/(game)/(village-slug)/components/send-troops/utils/schema';
import { createUnitSelections } from 'app/(game)/(village-slug)/components/send-troops/utils/troop-form';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useGatherersHutExpeditions } from 'app/(game)/(village-slug)/hooks/use-gatherers-hut-expeditions';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { InformationPopover } from 'app/(game)/components/information-popover';
import {
  currentVillageCacheKey,
  villageTroopsCacheKey,
} from 'app/(game)/constants/query-keys';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Dialog, DialogContent } from 'app/components/ui/dialog';
import { Form } from 'app/components/ui/form';
import { Separator } from 'app/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { useDialog } from 'app/hooks/use-dialog';
import { getFormErrorBag } from 'app/utils/forms';
import { formatTime } from 'app/utils/time';

type GatheringExpeditionFormValues = {
  units: z.infer<typeof unitSelectionSchema>[];
};

type GatheringExpeditionConfirmationData = GatheringExpeditionFormValues & {
  duration: number;
  troops: Troop[];
  troopAmount: number;
  expectedResources: number[];
};

const getSelectedTroopAmount = (
  units: GatheringExpeditionFormValues['units'],
) => {
  let amount = 0;

  for (const unit of units) {
    amount += unit.selected;
  }

  return amount;
};

type ActiveGatheringPartyTableProps = {
  events: GameEvent<'gatherersHutGatheringTrip'>[];
};

const ActiveGatheringPartyTable = ({
  events,
}: ActiveGatheringPartyTableProps) => {
  const { t } = useTranslation();

  return (
    <div className="scrollbar-hidden overflow-x-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Party')}</TableHeaderCell>
            <TableHeaderCell>{t('Expected resources')}</TableHeaderCell>
            <TableHeaderCell>{t('Returns in')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            let troopAmount = 0;
            const troopsByUnitId = new Map<Troop['unitId'], number>();

            for (const troop of event.troops) {
              troopAmount += troop.amount;
              troopsByUnitId.set(
                troop.unitId,
                (troopsByUnitId.get(troop.unitId) ?? 0) + troop.amount,
              );
            }

            return (
              <TableRow key={event.id}>
                <TableCell>{formatNumber(troopAmount)}</TableCell>
                <TableCell>
                  <span className="inline-flex gap-2">
                    <Resources
                      resources={calculateGatherersHutGatheringResources(
                        troopAmount,
                      )}
                    />
                  </span>
                </TableCell>
                <TableCell>
                  <Countdown endsAt={event.resolvesAt} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

type GatheringExpeditionConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: GatheringExpeditionConfirmationData;
};

const GatheringExpeditionConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  formData,
}: GatheringExpeditionConfirmationModalProps) => {
  const { t } = useTranslation();
  const tribe = useTribe();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-[425px]">
        <TroopConfirmationContent
          onBack={onClose}
          onConfirm={onConfirm}
          formData={formData}
          title={t('Gathering expedition')}
          tribe={tribe}
          backLabel={t('Back')}
        >
          <TroopConfirmationHeader />

          <div className="space-y-3">
            <TroopConfirmationUnitTable />

            <Separator orientation="horizontal" />

            <div className="space-y-2 dark:border-border">
              <div className="flex justify-between gap-4">
                <Text className="text-muted-foreground">
                  {t('Party size')}:
                </Text>
                <Text className="font-medium">
                  {formatNumber(formData.troopAmount)}
                </Text>
              </div>
              <div className="flex justify-between gap-4">
                <Text className="text-muted-foreground">{t('Duration')}:</Text>
                <Text className="font-medium">
                  {formatTime(formData.duration)}
                </Text>
              </div>
              <div className="flex items-center justify-between gap-4">
                <Text className="text-muted-foreground">
                  {t('Expected resources')}:
                </Text>
                <div className="flex gap-2">
                  <Resources resources={formData.expectedResources} />
                </div>
              </div>
            </div>
          </div>

          <TroopConfirmationFooter />
        </TroopConfirmationContent>
      </DialogContent>
    </Dialog>
  );
};

export const GatherersHutExpedition = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { currentVillage } = useCurrentVillage();
  const { server, serverSpeed } = useServer();
  const { developerSettings } = useDeveloperSettings();
  const { completed } = useGatherersHutExpeditions();
  const { buildingField } = use(BuildingFieldContext);
  const { getDeployableTroops } = useVillageTroops();
  const { eventsByType } = useEventsByType('gatherersHutGatheringTrip');
  const { createEvent: createGatheringTrip } = useCreateEvent(
    'gatherersHutGatheringTrip',
  );
  const {
    isOpen: isConfirmationStepOpen,
    openModal: openConfirmationStep,
    closeModal: closeConfirmationStep,
    modalArgs: confirmationData,
  } = useDialog<GatheringExpeditionConfirmationData>();

  const level = buildingField?.level ?? 0;
  const maxPartySize = calculateGatherersHutPartySize(level);
  const isGatheringExpeditionActive = eventsByType.length > 0;
  const deployableTroops = useMemo(() => {
    return getDeployableTroops().filter(({ unitId }) => unitId !== 'HERO');
  }, [getDeployableTroops]);

  const initialUnits = useMemo(() => {
    return createUnitSelections({
      tribe,
      troops: deployableTroops,
    });
  }, [deployableTroops, tribe]);

  const formSchema = useMemo(() => {
    return z
      .strictObject({
        units: z.array(unitSelectionSchema),
      })
      .refine((data) => data.units.some(({ selected }) => selected > 0), {
        message: 'At least 1 troop must be selected',
        path: ['units'],
      })
      .refine(
        (data) =>
          data.units.every(({ selected, available }) => selected <= available),
        {
          message: 'Selected units cannot exceed available count',
          path: ['units'],
        },
      )
      .refine((data) => getSelectedTroopAmount(data.units) <= maxPartySize, {
        message: 'Selected units cannot exceed maximum party size',
        path: ['units'],
      })
      .refine(
        (data) =>
          data.units.every(({ selected, unitId }) => {
            return selected === 0 || unitId !== 'HERO';
          }),
        {
          message: 'Gathering expeditions cannot include the hero',
          path: ['units'],
        },
      );
  }, [maxPartySize]);

  const form = useForm<
    GatheringExpeditionFormValues,
    unknown,
    GatheringExpeditionFormValues
  >({
    resolver: zodResolver(formSchema) as Resolver<
      GatheringExpeditionFormValues,
      unknown,
      GatheringExpeditionFormValues
    >,
    defaultValues: {
      units: initialUnits,
    },
  });

  useEffect(() => {
    form.reset({ units: initialUnits });
  }, [form, initialUnits]);

  const units = useWatch({
    control: form.control,
    name: 'units',
  });

  const selectedTroopAmount = getSelectedTroopAmount(units ?? []);
  const expectedResources =
    calculateGatherersHutGatheringResources(selectedTroopAmount);
  const isSubmitDisabled =
    isGatheringExpeditionActive ||
    selectedTroopAmount <= 0 ||
    selectedTroopAmount > maxPartySize;

  const errorBag = [
    ...getFormErrorBag(form.formState.errors),
    ...(isGatheringExpeditionActive
      ? [t('A gathering party is already active')]
      : []),
  ];

  const getGatheringDuration = () => {
    if (developerSettings.isInstantUnitTravelEnabled) {
      return 0;
    }

    return Math.ceil(
      calculateGatherersHutGatheringDuration(
        server.seed,
        serverSpeed,
        currentVillage.id,
        completed,
      ),
    );
  };

  const getSelectedTroops = (data: GatheringExpeditionFormValues): Troop[] => {
    const selectedTroops: Troop[] = [];

    for (const { unitId, selected } of data.units) {
      if (selected > 0 && unitId !== 'HERO') {
        selectedTroops.push({
          unitId,
          amount: selected,
          tileId: currentVillage.tileId,
          sourceTileId: currentVillage.tileId,
        });
      }
    }

    return selectedTroops;
  };

  const handleSubmit = (data: GatheringExpeditionFormValues) => {
    const troops = getSelectedTroops(data);
    const troopAmount = getSelectedTroopAmount(data.units);
    const duration = getGatheringDuration();

    openConfirmationStep({
      ...data,
      duration,
      troops,
      troopAmount,
      expectedResources: calculateGatherersHutGatheringResources(troopAmount),
    });
  };

  const handleConfirm = () => {
    const data = confirmationData.current;

    if (!data) {
      return;
    }

    createGatheringTrip(
      {
        troops: data.troops,
        cachesToClearImmediately: [
          [currentVillageCacheKey],
          [villageTroopsCacheKey, currentVillage.id],
        ],
      },
      {
        onSuccess: () => {
          form.reset({ units: initialUnits });
          closeConfirmationStep();
        },
      },
    );
  };

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="gathering-expedition" />
        <InformationPopover ariaLabel={t('Gathering expedition')}>
          <Text>
            {t(
              "Send idle troops from this village to gather resources. The Gatherer's Hut level controls how many troops can join the expedition.",
            )}
            <br />
            {completed === 0
              ? t(
                  'This village has not completed any gathering expeditions yet.',
                )
              : t(
                  'This village has already completed {{count}} gathering expeditions.',
                  {
                    count: completed,
                  },
                )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Gathering expedition')}</Text>
      </SectionContent>
      <SectionContent>
        <div className="flex flex-col gap-6">
          {isGatheringExpeditionActive && (
            <ActiveGatheringPartyTable events={eventsByType} />
          )}

          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <fieldset
                className="space-y-6"
                disabled={isGatheringExpeditionActive}
              >
                <UnitSelector
                  disabledUnitTiers={['hero']}
                  maxTotalUnits={maxPartySize}
                />

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <Text className="text-sm text-muted-foreground">
                      {t('Party size')}: {formatNumber(selectedTroopAmount)} /{' '}
                      {formatNumber(maxPartySize)}
                    </Text>
                    <div className="flex items-center gap-2">
                      <Text className="text-sm text-muted-foreground">
                        {t('Expected resources')}:
                      </Text>
                      <Resources resources={expectedResources} />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitDisabled}
                  >
                    {t('Start')}
                  </Button>
                </div>
              </fieldset>

              <ErrorBag errorBag={errorBag} />
            </form>
          </Form>

          {confirmationData.current ? (
            <GatheringExpeditionConfirmationModal
              isOpen={isConfirmationStepOpen}
              onClose={closeConfirmationStep}
              onConfirm={handleConfirm}
              formData={confirmationData.current}
            />
          ) : null}
        </div>
      </SectionContent>
    </Section>
  );
};
