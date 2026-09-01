import type { ReactNode } from 'react';
import { createContext, type PropsWithChildren, use, useMemo } from 'react';
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
  UnitTableContentRow,
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
import { formatTime } from 'app/utils/time';
import type { BaseTroopFormValues, UnitSelection } from '../utils/schema';
import { ArrivalTime } from './arrival-time';

type TroopConfirmationFormData = {
  units: UnitSelection[];
};

type TroopConfirmationContextState = {
  onBack: () => void;
  onConfirm: () => void;
  formData: TroopConfirmationFormData;
  title: string;
  tribe: Tribe;
  backLabel?: string;
  isConfirmDisabled?: boolean;
  unitTableDetails?: ReactNode;
  unitTableDetailsLabel?: ReactNode;
};

const TroopConfirmationContext = createContext<TroopConfirmationContextState>(
  {} as TroopConfirmationContextState,
);

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
  details?: ReactNode;
  isConfirmDisabled?: boolean;
  unitTableDetails?: ReactNode;
  unitTableDetailsLabel?: ReactNode;
};

type TroopConfirmationContentProps = PropsWithChildren<{
  onBack: () => void;
  onConfirm: () => void;
  formData: TroopConfirmationFormData;
  title: string;
  tribe: Tribe;
  backLabel?: string;
  isConfirmDisabled?: boolean;
  unitTableDetails?: ReactNode;
  unitTableDetailsLabel?: ReactNode;
}>;

type TroopMovementConfirmationContentProps = {
  onBack: () => void;
  onConfirm: () => void;
  formData: BaseTroopFormValues;
  title: string;
  tribe: Tribe;
  originTileId?: number;
  backLabel?: string;
  hideMovementDetails?: boolean;
  details?: ReactNode;
  isConfirmDisabled?: boolean;
  unitTableDetails?: ReactNode;
  unitTableDetailsLabel?: ReactNode;
};

export const TroopConfirmationContent = ({
  onBack,
  onConfirm,
  formData,
  title,
  tribe,
  backLabel,
  isConfirmDisabled,
  unitTableDetails,
  unitTableDetailsLabel,
  children,
}: TroopConfirmationContentProps) => {
  const value = useMemo(
    () => ({
      onBack,
      onConfirm,
      formData,
      title,
      tribe,
      backLabel,
      isConfirmDisabled,
      unitTableDetails,
      unitTableDetailsLabel,
    }),
    [
      backLabel,
      formData,
      isConfirmDisabled,
      onBack,
      onConfirm,
      title,
      tribe,
      unitTableDetails,
      unitTableDetailsLabel,
    ],
  );

  return (
    <TroopConfirmationContext value={value}>
      {children}
    </TroopConfirmationContext>
  );
};

export const TroopConfirmationHeader = () => {
  const { title } = use(TroopConfirmationContext);

  return (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
  );
};

export const TroopConfirmationUnitTable = () => {
  const { t } = useTranslation();
  const { formData, tribe, unitTableDetails, unitTableDetailsLabel } = use(
    TroopConfirmationContext,
  );

  return (
    <UnitTable tribe={tribe}>
      <UnitTableUnitIcons />
      <UnitTableRow
        label={t('Troops')}
        troops={formData.units.map(({ unitId, selected }) => ({
          unitId,
          amount: selected,
        }))}
      />
      {unitTableDetails && (
        <UnitTableContentRow label={unitTableDetailsLabel ?? t('Details')}>
          {unitTableDetails}
        </UnitTableContentRow>
      )}
    </UnitTable>
  );
};

export const TroopConfirmationFooter = () => {
  const { t } = useTranslation();
  const { onBack, onConfirm, backLabel, isConfirmDisabled } = use(
    TroopConfirmationContext,
  );

  return (
    <DialogFooter>
      <Button
        variant="outline"
        onClick={onBack}
      >
        {backLabel ?? t('Cancel')}
      </Button>
      <Button
        onClick={onConfirm}
        disabled={isConfirmDisabled}
      >
        {t('Confirm')}
      </Button>
    </DialogFooter>
  );
};

type TroopConfirmationMovementDetailsProps = {
  formData: BaseTroopFormValues;
  originTileId?: number;
};

const TroopConfirmationMovementDetails = ({
  formData,
  originTileId,
}: TroopConfirmationMovementDetailsProps) => {
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
      originTileId: resolvedOriginTileId,
      targetTileId: formData.target.tileId,
      mapSize,
      troops: selectedTroops.map((t) => ({
        unitId: t.unitId,
        amount: t.selected,
        tileId: currentVillage.tileId,
        sourceTileId: currentVillage.tileId,
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
        <Text className="text-muted-foreground">{t('Travel duration')}:</Text>
        <Text className="font-medium">{formatTime(travelDuration)}</Text>
      </div>
      <div className="flex justify-between">
        <Text className="text-muted-foreground">{t('Arrival time')}:</Text>
        <ArrivalTime travelDuration={travelDuration} />
      </div>
    </div>
  );
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
  details,
  isConfirmDisabled,
  unitTableDetails,
  unitTableDetailsLabel,
}: TroopMovementConfirmationContentProps) => {
  return (
    <TroopConfirmationContent
      onBack={onBack}
      onConfirm={onConfirm}
      formData={formData}
      title={title}
      tribe={tribe}
      backLabel={backLabel}
      isConfirmDisabled={isConfirmDisabled}
      unitTableDetails={unitTableDetails}
      unitTableDetailsLabel={unitTableDetailsLabel}
    >
      <TroopConfirmationHeader />

      <div className="min-w-0 space-y-2">
        <div className="flex min-w-0 flex-col gap-4">
          <TroopConfirmationUnitTable />
        </div>

        {!hideMovementDetails && (
          <TroopConfirmationMovementDetails
            formData={formData}
            originTileId={originTileId}
          />
        )}

        {details}
      </div>

      <TroopConfirmationFooter />
    </TroopConfirmationContent>
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
