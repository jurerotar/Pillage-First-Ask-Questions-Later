import { useTranslation } from 'react-i18next';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { useDialog } from 'app/hooks/use-dialog';
import { useCancelUnitImprovement } from '../hooks/use-cancel-unit-improvement-event';

export const SmithyImprovementTable = () => {
  const { t } = useTranslation();
  const {
    isOpen: isCancelImprovementDialogOpen,
    toggleModal: toggleCancelImprovementDialog,
    openModal,
    closeModal,
    modalArgs,
  } = useDialog<{ eventId: number }>();
  const { mutate: cancelUnitImprovement } = useCancelUnitImprovement();
  const { currentVillage } = useCurrentVillage();
  const { eventsByType: unitImprovementEvents } =
    useEventsByType('unitImprovement');

  const currentVillageUnitImprovementEvents = unitImprovementEvents.filter(
    ({ villageId }) => currentVillage.id === villageId,
  );
  const hasOngoingCurrentVillageImprovementEvents =
    currentVillageUnitImprovementEvents.length > 0;

  const onImprovementCancel = (upgradeEventId: number) => {
    openModal({ eventId: upgradeEventId });
  };

  const eventIdToBeCancelled = modalArgs.current?.eventId;

  const mainEventToBeCancelled = unitImprovementEvents.find(
    (upgradeEvent) => upgradeEvent.id === eventIdToBeCancelled,
  );
  const allEventsToBeCancelled = unitImprovementEvents.filter(
    (upgradeEvent) =>
      upgradeEvent.type === mainEventToBeCancelled?.type &&
      upgradeEvent.level >= mainEventToBeCancelled?.level,
  );

  const errorBag = allEventsToBeCancelled.map((improvementEventToBeCancelled) =>
    t('{{unitName}} level {{previousLevel}} to level {{level}}.', {
      unitName: t(`UNITS.${improvementEventToBeCancelled.unitId}.NAME`, {
        count: 1,
      }),
      previousLevel: improvementEventToBeCancelled.level - 1,
      level: improvementEventToBeCancelled.level,
    }),
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Unit')}</TableHeaderCell>
            <TableHeaderCell>{t('Level')}</TableHeaderCell>
            <TableHeaderCell>{t('Remaining time')}</TableHeaderCell>
            <TableHeaderCell>{t('Actions')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hasOngoingCurrentVillageImprovementEvents &&
            currentVillageUnitImprovementEvents.map((improvementEvent) => {
              return (
                <TableRow key={improvementEvent.id}>
                  <TableCell>
                    {t(`UNITS.${improvementEvent.unitId}.NAME`, {
                      count: 1,
                    })}
                  </TableCell>
                  <TableCell>{improvementEvent.level}</TableCell>
                  <TableCell>
                    <Countdown
                      endsAt={
                        improvementEvent.startsAt + improvementEvent.duration
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => onImprovementCancel(improvementEvent.id)}
                      size="fit"
                    >
                      {t('Cancel')}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          {!hasOngoingCurrentVillageImprovementEvents && (
            <TableRow>
              <TableCell colSpan={4}>
                {t(
                  'No improvements are currently taking place in this village',
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {eventIdToBeCancelled && (
        <Dialog
          open={isCancelImprovementDialogOpen}
          onOpenChange={toggleCancelImprovementDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('Cancel unit improvement')}</DialogTitle>
              <DialogDescription>
                {t('Following upgrades will be canceled.')}
              </DialogDescription>
            </DialogHeader>
            <ErrorBag errorBag={errorBag} />
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={closeModal}
              >
                {t('Cancel')}
              </Button>
              <Button
                onClick={() => {
                  cancelUnitImprovement({ eventId: eventIdToBeCancelled });
                  closeModal();
                }}
              >
                {t('Confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
