import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { IoIosArrowRoundForward } from 'react-icons/io';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCancelDemolition } from 'app/(game)/(village-slug)/hooks/use-cancel-demolition';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider.tsx';
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

export const MainBuildingDemolitionTable = () => {
  const { t } = useTranslation();
  const {
    isOpen: isCancelDemolitionDialogOpen,
    toggleModal: toggleCancelDemolitionDialog,
    openModal,
    closeModal,
    modalArgs,
  } = useDialog<{ eventId: number }>();
  const { buildingDowngradeEvents } = use(CurrentVillageBuildingQueueContext);
  const { mutate: cancelDemolition } = useCancelDemolition();

  const hasDemolitionEvents = buildingDowngradeEvents.length > 0;
  const eventIdToBeCancelled = modalArgs.current?.eventId;

  const onDemolitionCancel = (eventId: number) => {
    openModal({ eventId });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Building')}</TableHeaderCell>
            <TableHeaderCell>{t('Level')}</TableHeaderCell>
            <TableHeaderCell>{t('Duration')}</TableHeaderCell>
            <TableHeaderCell>{t('Actions')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hasDemolitionEvents &&
            buildingDowngradeEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{t(`BUILDINGS.${event.buildingId}.NAME`)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {event.previousLevel}{' '}
                  <IoIosArrowRoundForward className="inline" /> {event.level}
                </TableCell>
                <TableCell>
                  <Countdown endsAt={event.startsAt + event.duration} />
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => onDemolitionCancel(event.id)}
                    size="fit"
                  >
                    {t('Cancel')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          {!hasDemolitionEvents && (
            <TableRow>
              <TableCell colSpan={4}>
                {t('No demolition is currently taking place')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {eventIdToBeCancelled && (
        <Dialog
          open={isCancelDemolitionDialogOpen}
          onOpenChange={toggleCancelDemolitionDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Cancel demolition')}</DialogTitle>
              <DialogDescription>
                {t('Are you sure you want to cancel this demolition?')}
              </DialogDescription>
            </DialogHeader>
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
                  cancelDemolition();
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
