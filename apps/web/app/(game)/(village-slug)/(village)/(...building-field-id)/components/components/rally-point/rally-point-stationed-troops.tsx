import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IoReturnUpForwardOutline } from 'react-icons/io5';
import { TbMapPinDown } from 'react-icons/tb';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';
import { partition } from '@pillage-first/utils/array';
import { usePlayerVillages } from 'app/(game)/(village-slug)/(players)/(...player-slug)/hooks/use-player-villages';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { RelocateTroopsModal } from 'app/(game)/(village-slug)/components/send-troops/components/relocate-troops-modal';
import { ReturnReinforcementsModal } from 'app/(game)/(village-slug)/components/send-troops/components/return-reinforcements-modal';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import {
  UnitTable,
  UnitTableRow,
  UnitTableTitle,
  UnitTableUnitIcons,
  UnitTableWheatConsumption,
} from 'app/(game)/components/unit-table';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Pagination } from 'app/components/ui/pagination';
import { useDialog } from 'app/hooks/use-dialog.ts';
import { useFilters } from 'app/hooks/use-filters';

type ReinforcementDialogData = {
  sourceTileId: number;
};

const formatTroopAmount = (tribe: Tribe, troops: Troop[]) => {
  const tribeUnits = [...getUnitsByTribe(tribe), getUnitDefinition('HERO')];

  return tribeUnits.map((unitDef) => {
    const troop = troops.find((t) => t.unitId === unitDef.id);
    return troop?.amount ?? 0;
  });
};

export const RallyPointStationedTroops = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillages(currentVillage.playerId);
  const { villageTroops } = useVillageTroops();
  const { page, handlePageChange } = useFilters({
    paramName: 'page',
  });
  const {
    isOpen: isReturnModalOpen,
    openModal: openReturnModal,
    closeModal: closeReturnModal,
    modalArgs: returnModalArgs,
  } = useDialog<ReinforcementDialogData>();
  const {
    isOpen: isRelocateModalOpen,
    openModal: openRelocateModal,
    closeModal: closeRelocateModal,
    modalArgs: relocateModalArgs,
  } = useDialog<ReinforcementDialogData>();

  const [ownTroops, reinforcements] = useMemo(() => {
    return partition(
      villageTroops,
      (troop) => troop.source === currentVillage.tileId,
    );
  }, [villageTroops, currentVillage.tileId]);

  const ownTroopsAmount = useMemo(() => {
    return formatTroopAmount(tribe, ownTroops);
  }, [tribe, ownTroops]);

  const villagesByTileId = useMemo(() => {
    return new Map(
      playerVillages.map((village) => [village.tileId, village] as const),
    );
  }, [playerVillages]);

  const reinforcingTroopsBySource = useMemo(() => {
    const troopsBySource = new Map<Troop['source'], Troop[]>();

    for (const troop of reinforcements) {
      const sourceTroops = troopsBySource.get(troop.source) ?? [];
      sourceTroops.push(troop);
      troopsBySource.set(troop.source, sourceTroops);
    }

    return [...troopsBySource.entries()].map(([sourceTileId, troops]) => {
      const firstNonHeroTroop = troops.find(({ unitId }) => unitId !== 'HERO');
      const sourceTribe = firstNonHeroTroop
        ? (() => {
            const unitTribe = getUnitDefinition(firstNonHeroTroop.unitId).tribe;

            return unitTribe === 'all' ? tribe : unitTribe;
          })()
        : tribe;

      return {
        sourceTileId,
        sourceVillageName: villagesByTileId.get(sourceTileId)?.name,
        sourceCoordinates: villagesByTileId.get(sourceTileId)?.coordinates,
        tribe: sourceTribe,
        troops,
        amount: formatTroopAmount(sourceTribe, troops),
      };
    });
  }, [reinforcements, tribe, villagesByTileId]);

  const selectedReturnSourceReinforcements = returnModalArgs.current
    ?.sourceTileId
    ? (reinforcingTroopsBySource.find(
        ({ sourceTileId }) =>
          sourceTileId === returnModalArgs.current?.sourceTileId,
      ) ?? null)
    : null;

  const selectedRelocateSourceReinforcements = relocateModalArgs.current
    ?.sourceTileId
    ? (reinforcingTroopsBySource.find(
        ({ sourceTileId }) =>
          sourceTileId === relocateModalArgs.current?.sourceTileId,
      ) ?? null)
    : null;

  const pagination = usePagination(reinforcingTroopsBySource, 20, page);

  const hasReinforcements = reinforcingTroopsBySource.length > 0;

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Stationed troops')}</Text>
        <Text>
          {t(
            'Troops stationed in this village, either as deployable troops or as reinforcements.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Text as="h3">{t('Own troops')}</Text>
        <UnitTable tribe={tribe}>
          <UnitTableTitle>{t('Your troops')}</UnitTableTitle>
          <UnitTableUnitIcons />
          <UnitTableRow
            label={t('Troops')}
            amount={ownTroopsAmount}
          />
          <UnitTableWheatConsumption amount={ownTroopsAmount} />
        </UnitTable>
      </SectionContent>
      {hasReinforcements && (
        <SectionContent>
          <Text as="h3">{t('Reinforcements')}</Text>
          {reinforcingTroopsBySource.map(
            ({
              sourceTileId,
              sourceVillageName,
              sourceCoordinates,
              tribe,
              amount,
            }) => (
              <UnitTable
                key={sourceTileId}
                tribe={tribe}
              >
                <UnitTableTitle>
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      {t('Reinforcements from {{villageName}}', {
                        villageName: sourceVillageName,
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!sourceCoordinates}
                        data-tooltip-id="general-tooltip"
                        data-tooltip-content={t('Return reinforcements')}
                        onClick={() => openReturnModal({ sourceTileId })}
                      >
                        <IoReturnUpForwardOutline className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        data-tooltip-id="general-tooltip"
                        data-tooltip-content={t(
                          'Convert reinforcements to relocated troops',
                        )}
                        onClick={() => openRelocateModal({ sourceTileId })}
                      >
                        <TbMapPinDown className="size-4" />
                      </Button>
                    </div>
                  </div>
                </UnitTableTitle>
                <UnitTableUnitIcons />
                <UnitTableRow
                  label={t('Troops')}
                  amount={amount}
                />
                <UnitTableWheatConsumption amount={amount} />
              </UnitTable>
            ),
          )}
          <div className="flex w-full justify-end">
            <Pagination
              {...pagination}
              setPage={handlePageChange}
            />
          </div>
        </SectionContent>
      )}

      {selectedReturnSourceReinforcements && (
        <ReturnReinforcementsModal
          isOpen={isReturnModalOpen}
          onClose={closeReturnModal}
          title={t('Return reinforcements')}
          tribe={selectedReturnSourceReinforcements.tribe}
          sourceTileId={selectedReturnSourceReinforcements.sourceTileId}
          troops={selectedReturnSourceReinforcements.troops}
        />
      )}

      {selectedRelocateSourceReinforcements && (
        <RelocateTroopsModal
          isOpen={isRelocateModalOpen}
          onClose={closeRelocateModal}
          title={t('Convert reinforcements to relocated troops')}
          tribe={selectedRelocateSourceReinforcements.tribe}
          sourceTileId={selectedRelocateSourceReinforcements.sourceTileId}
          troops={selectedRelocateSourceReinforcements.troops}
        />
      )}
    </Section>
  );
};
