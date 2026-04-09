import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateTravelDuration } from '@pillage-first/utils/game/troop-movement-duration';
import { calculateDistanceBetweenPoints } from '@pillage-first/utils/math';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import {
  UnitTable,
  UnitTableHeader,
  UnitTableRow,
} from 'app/(game)/components/unit-table';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Separator } from 'app/components/ui/separator';
import { formatTime } from 'app/utils/time';
import type { BaseTroopFormValues } from '../utils/schema';
import { ArrivalTime } from './arrival-time';

type TroopMovementConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: BaseTroopFormValues;
  title: string;
};

export const TroopMovementConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  formData,
  title,
}: TroopMovementConfirmationModalProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const tribe = useTribe();
  const { effects } = useEffects();

  const selectedTroops = useMemo(() => {
    return formData.units.filter((u) => u.selected > 0);
  }, [formData.units]);

  const travelDuration = useMemo(() => {
    return calculateTravelDuration({
      originVillageId: currentVillage.id,
      originCoordinates: currentVillage.coordinates,
      targetCoordinates: {
        x: formData.target.x,
        y: formData.target.y,
      },
      troops: selectedTroops.map((t) => ({
        unitId: t.unitId,
        amount: t.selected,
        tileId: currentVillage.tileId,
        source: currentVillage.tileId,
      })),
      effects,
    });
  }, [currentVillage, formData.target, selectedTroops, effects]);

  const distance = useMemo(() => {
    return calculateDistanceBetweenPoints(currentVillage.coordinates, {
      x: formData.target.x,
      y: formData.target.y,
    });
  }, [currentVillage.coordinates, formData.target]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex flex-col gap-4">
            <UnitTable tribe={tribe}>
              <UnitTableHeader />
              <UnitTableRow
                amount={formData.units.map(({ selected }) => selected)}
              />
            </UnitTable>
          </div>

          <Separator orientation="horizontal" />

          <div className="space-y-2 dark:border-border">
            <div className="flex justify-between">
              <Text className="text-muted-foreground">{t('Target')}:</Text>
              <Text className="font-medium">
                ({formData.target.x}|{formData.target.y})
              </Text>
            </div>
            <div className="flex justify-between">
              <Text className="text-muted-foreground">{t('Distance')}:</Text>
              <Text className="font-medium">
                {distance.toFixed(1)} {t('tiles')}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text className="text-muted-foreground">
                {t('Travel duration')}:
              </Text>
              <Text className="font-medium">{formatTime(travelDuration)}</Text>
            </div>
            <div className="flex justify-between">
              <Text className="text-muted-foreground">
                {t('Arrival time')}:
              </Text>
              <ArrivalTime travelDuration={travelDuration} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            {t('Cancel')}
          </Button>
          <Button onClick={onConfirm}>{t('Confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
