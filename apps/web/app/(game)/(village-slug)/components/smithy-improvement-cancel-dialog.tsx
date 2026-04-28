import { t } from 'i18next';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { useCancelUnitImprovement } from '../hooks/use-cancel-unit-improvement-event';
import { useEventsByType } from '../hooks/use-events-by-type';

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
        <ErrorBag errorBag={errorBag} />
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
            {t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
