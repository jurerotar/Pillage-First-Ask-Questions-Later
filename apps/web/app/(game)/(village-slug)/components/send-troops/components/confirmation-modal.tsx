import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { calculateTravelDuration } from '@pillage-first/utils/game/troop-movement-duration';
import {
  calculateDistanceBetweenTiles,
  tileIdToCoordinates,
} from '@pillage-first/utils/map';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import {
  UnitTable,
  UnitTableRow,
  UnitTableUnitIcons,
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
  tribe: Tribe;
  originTileId?: number;
  backLabel?: string;
  hideMovementDetails?: boolean;
};

type TroopMovementConfirmationContentProps = {
  onBack: () => void;
  onConfirm: () => void;
  formData: BaseTroopFormValues;
  title: string;
  tribe: Tribe;
  originTileId?: number;
  backLabel?: string;
  hideMovementDetails?: boolean;
};

export const TroopMovementConfirmationContent = ({
  onBack,
  onConfirm,
  formData,
  title,
  tribe,
  originTileId,
  backLabel,
  hideMovementDetails = false,
}: TroopMovementConfirmationContentProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { effects } = useEffects();
  const { mapSize } = useServer();

  const resolvedOriginTileId = originTileId ?? currentVillage.tileId;

  const selectedTroops = useMemo(() => {
    return formData.units.filter((u) => u.selected > 0);
  }, [formData.units]);

  const travelDuration = useMemo(() => {
    return calculateTravelDuration({
      originVillageId: currentVillage.id,
      originTileId: resolvedOriginTileId,
      targetTileId: formData.target.tileId,
      mapSize,
      troops: selectedTroops.map((t) => ({
        unitId: t.unitId,
        amount: t.selected,
        tileId: currentVillage.tileId,
        source: currentVillage.tileId,
      })),
      effects,
    });
  }, [
    currentVillage,
    formData.target.tileId,
    mapSize,
    resolvedOriginTileId,
    selectedTroops,
    effects,
  ]);

  const distance = useMemo(() => {
    return calculateDistanceBetweenTiles(
      resolvedOriginTileId,
      formData.target.tileId,
      mapSize,
    );
  }, [formData.target.tileId, mapSize, resolvedOriginTileId]);

  const targetCoordinates = useMemo(() => {
    if (formData.target.x !== undefined && formData.target.y !== undefined) {
      return {
        x: formData.target.x,
        y: formData.target.y,
      };
    }

    return tileIdToCoordinates(formData.target.tileId, mapSize);
  }, [formData.target.tileId, formData.target.x, formData.target.y, mapSize]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <div className="space-y-2">
        <div className="flex flex-col gap-4">
          <UnitTable tribe={tribe}>
            <UnitTableUnitIcons />
            <UnitTableRow
              label={t('Troops')}
              troops={formData.units.map(({ unitId, selected }) => ({
                unitId,
                amount: selected,
              }))}
            />
          </UnitTable>
        </div>

        {!hideMovementDetails && (
          <>
            <Separator orientation="horizontal" />

            <div className="space-y-2 dark:border-border">
              <div className="flex justify-between">
                <Text className="text-muted-foreground">{t('Target')}:</Text>
                <Text className="font-medium">
                  ({targetCoordinates.x}|{targetCoordinates.y})
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
                <Text className="font-medium">
                  {formatTime(travelDuration)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-muted-foreground">
                  {t('Arrival time')}:
                </Text>
                <ArrivalTime travelDuration={travelDuration} />
              </div>
            </div>
          </>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onBack}
        >
          {backLabel ?? t('Cancel')}
        </Button>
        <Button onClick={onConfirm}>{t('Confirm')}</Button>
      </DialogFooter>
    </>
  );
};

export const TroopMovementConfirmationModal = ({
  isOpen,
  onClose,
  ...props
}: TroopMovementConfirmationModalProps) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-[425px]">
        <TroopMovementConfirmationContent
          onBack={onClose}
          {...props}
        />
      </DialogContent>
    </Dialog>
  );
};
