import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { useIntl } from 'app/hooks/use-intl';
import { useTroopSelectionForm } from '../hooks/use-troop-selection-form';
import type { BaseTroopFormValues } from '../utils/schema';
import { TroopSelectionForm } from './troop-selection-form';

type RelocateTroopsModalBaseProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tribe: Tribe;
  troops: Troop[];
};

type IncomingRelocateTroopsModalProps = RelocateTroopsModalBaseProps & {
  mode?: 'incoming';
  sourceTileId: number;
};

type OutgoingRelocateTroopsModalProps = RelocateTroopsModalBaseProps & {
  mode: 'outgoing';
  stationedTileId: number;
  stationedVillageName?: string;
};

type RelocateTroopsModalProps =
  | IncomingRelocateTroopsModalProps
  | OutgoingRelocateTroopsModalProps;

export const RelocateTroopsModal = (props: RelocateTroopsModalProps) => {
  const { isOpen, onClose, title, tribe, troops } = props;
  const mode = props.mode ?? 'incoming';
  const outgoingProps =
    mode === 'outgoing' ? (props as OutgoingRelocateTroopsModalProps) : null;

  const { t } = useTranslation();
  const intl = useIntl();
  const { currentVillage } = useCurrentVillage();
  const { relocateReinforcements, relocateSentReinforcements } =
    useVillageTroops();
  const { form, hasSelectedTroops, maxUnits } = useTroopSelectionForm({
    isOpen,
    tribe,
    troops,
  });

  const onSubmit = ({ units }: BaseTroopFormValues) => {
    const selectedTroops = units.filter(({ selected }) => selected > 0);

    if (selectedTroops.length === 0) {
      return;
    }

    form.clearErrors('root');

    const relocatedTroopSummary = selectedTroops.map(({ unitId, selected }) => {
      const unitName = t(`UNITS.${unitId}.NAME`, { count: selected });

      return `${selected} ${unitName}`;
    });

    const formattedTroopList = intl.list.format(relocatedTroopSummary);

    if (mode === 'incoming') {
      const incomingProps = props as IncomingRelocateTroopsModalProps;

      relocateReinforcements(
        {
          sourceTileId: incomingProps.sourceTileId,
          troops: selectedTroops.map(({ unitId, selected }) => ({
            unitId,
            amount: selected,
          })),
        },
        {
          onSuccess: () => {
            toast(
              t("{{troops}} are now part of {{villageName}}'s garrison", {
                troops: formattedTroopList,
                villageName: currentVillage.name,
              }),
            );
            onClose();
          },
        },
      );

      return;
    }

    if (!outgoingProps) {
      return;
    }

    relocateSentReinforcements(
      {
        stationedTileId: outgoingProps.stationedTileId,
        troops: selectedTroops.map(({ unitId, selected }) => ({
          unitId,
          amount: selected,
        })),
      },
      {
        onSuccess: () => {
          toast(
            t("{{troops}} are now part of {{villageName}}'s garrison", {
              troops: formattedTroopList,
              villageName: outgoingProps.stationedVillageName,
            }),
          );
          onClose();
        },
      },
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'incoming'
              ? t(
                  'Select the reinforcements to absorb into this village. Chosen troops will become part of your local garrison.',
                )
              : t(
                  "Select the reinforcements you'd like to convert to this village's garrison.",
                )}
          </DialogDescription>
        </DialogHeader>
        <TroopSelectionForm
          form={form}
          onSubmit={onSubmit}
          maxUnits={maxUnits}
          formClassName="space-y-4"
          isSubmitDisabled={!hasSelectedTroops}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
