import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { useTroopSelectionForm } from '../hooks/use-troop-selection-form';
import type { BaseTroopFormValues } from '../utils/schema';
import { TroopSelectionForm } from './troop-selection-form';

type RelocateTroopsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tribe: Tribe;
  mode?: 'incoming' | 'outgoing';
  tileId: number;
  villageId?: number;
  villageName?: string;
  troops: Troop[];
};

export const RelocateTroopsModal = ({
  isOpen,
  onClose,
  title,
  tribe,
  mode = 'incoming',
  tileId,
  villageId,
  villageName,
  troops,
}: RelocateTroopsModalProps) => {
  const { t, i18n } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillageListing();
  const { relocateReinforcements, relocateSentReinforcements } =
    useVillageTroops();
  const { form, hasSelectedTroops, maxUnits, target } = useTroopSelectionForm({
    isOpen,
    tribe,
    troops,
  });

  const onSubmit = ({ units, target: formTarget }: BaseTroopFormValues) => {
    const selectedTroops = units.filter(({ selected }) => selected > 0);

    if (selectedTroops.length === 0) {
      return;
    }

    const relocatedTroopSummary = selectedTroops.map(({ unitId, selected }) => {
      const unitName = t(`UNITS.${unitId}.NAME`, { count: selected });

      return `${selected} ${unitName}`;
    });
    const formattedTroopList = new Intl.ListFormat(i18n.language, {
      style: 'long',
      type: 'conjunction',
    }).format(relocatedTroopSummary);

    if (mode === 'incoming') {
      relocateReinforcements(
        {
          sourceTileId: tileId,
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

    if (formTarget.x === undefined || formTarget.y === undefined) {
      return;
    }

    const targetVillage = playerVillages.find(
      (village) =>
        village.coordinates.x === formTarget.x &&
        village.coordinates.y === formTarget.y,
    );

    if (!targetVillage) {
      return;
    }

    relocateSentReinforcements(
      {
        stationedTileId: tileId,
        targetTileId: targetVillage.tileId,
        troops: selectedTroops.map(({ unitId, selected }) => ({
          unitId,
          amount: selected,
        })),
      },
      {
        onSuccess: () => {
          toast(
            t(
              '{{troops}} are now moving from {{sourceVillage}} to {{targetVillage}}',
              {
                troops: formattedTroopList,
                sourceVillage: villageName,
                targetVillage: targetVillage.name,
              },
            ),
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
                  'Select the reinforcements to move out of this village and choose their next destination.',
                )}
          </DialogDescription>
        </DialogHeader>
        <TroopSelectionForm
          form={form}
          onSubmit={onSubmit}
          maxUnits={maxUnits}
          targetSelector={mode === 'outgoing' ? 'playerVillage' : null}
          excludedVillageIds={villageId ? [villageId] : []}
          formClassName="space-y-4"
          isSubmitDisabled={
            !hasSelectedTroops ||
            (mode === 'outgoing' &&
              (target.x === undefined || target.y === undefined))
          }
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
