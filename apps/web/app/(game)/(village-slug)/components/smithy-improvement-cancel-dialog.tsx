import { t } from 'i18next';
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
import { useCancelUnitImprovement } from '../hooks/use-cancel-unit-improvement-event';
import { useEventsByType } from '../hooks/use-events-by-type';
import { Countdown } from './countdown';

type SmithyImprovementCancelDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
};

export const SmithyImprovementCancelDialog = ({
  isOpen,
  onOpenChange,
  eventId,
}: SmithyImprovementCancelDialogProps) => {
  const { eventsByType: allUnitImprovementEvents } =
    useEventsByType('unitImprovement');

  const mainEventToBeCancelled = allUnitImprovementEvents.find(
    (upgradeEvent) => upgradeEvent.id === eventId,
  );
  const allEventsToBeCancelled = allUnitImprovementEvents.filter(
    (upgradeEvent) =>
      upgradeEvent.type === mainEventToBeCancelled?.type &&
      upgradeEvent.level >= mainEventToBeCancelled?.level,
  );

  const { mutate: cancelUnitImprovement } = useCancelUnitImprovement();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Cancel unit improvement')}</DialogTitle>
          <DialogDescription>
            {t('Following upgrades will be canceled.')}
          </DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Unit')}</TableHeaderCell>
              <TableHeaderCell>{t('Level')}</TableHeaderCell>
              <TableHeaderCell>{t('Remaining time')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allEventsToBeCancelled.map((improvementEventToBeCancelled) => {
              return (
                <TableRow key={improvementEventToBeCancelled.id}>
                  <TableCell>
                    {t(`UNITS.${improvementEventToBeCancelled.unitId}.NAME`, {
                      count: 1,
                    })}
                  </TableCell>
                  <TableCell>{improvementEventToBeCancelled.level}</TableCell>
                  <TableCell>
                    <Countdown
                      endsAt={
                        improvementEventToBeCancelled.startsAt +
                        improvementEventToBeCancelled.duration
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={() => {
              cancelUnitImprovement({ eventId: eventId });
              onOpenChange(false);
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
