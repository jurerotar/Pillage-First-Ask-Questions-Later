import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IoReturnUpForwardOutline } from 'react-icons/io5';
import { TbMapPinDown } from 'react-icons/tb';
import { useSearchParams } from 'react-router';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { Troop } from '@pillage-first/types/models/troop';
import { usePlayerVillages } from 'app/(game)/(village-slug)/(players)/(...player-slug)/hooks/use-player-villages.ts';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { RelocateTroopsModal } from 'app/(game)/(village-slug)/components/send-troops/components/relocate-troops-modal';
import { ReturnReinforcementsModal } from 'app/(game)/(village-slug)/components/send-troops/components/return-reinforcements-modal';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination.ts';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe.ts';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops.ts';
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
import { formatTroopAmount } from '../../utils/format-troop-amount.ts';

type ReinforcementDialogData = {
  tileId: number;
};

export const RallyPointReinforcementsTab = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tribe = useTribe();
  const { currentVillage } = useCurrentVillage();
  const { playerVillages } = usePlayerVillages(currentVillage.playerId);
  const { villageTroops } = useVillageTroops();
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

  const reinforcements = useMemo(() => {
    const villagesByTileId = new Map(
      playerVillages.map((village) => [village.tileId, village] as const),
    );
    const troopsBySource = new Map<Troop['source'], Troop[]>();

    for (const troop of villageTroops) {
      if (troop.source === currentVillage.tileId) {
        continue;
      }

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
  }, [currentVillage.tileId, playerVillages, tribe, villageTroops]);

  const page = Number.parseInt(
    searchParams.get('reinforcements-page') ?? '1',
    10,
  );
  const pagination = usePagination(reinforcements, 20, page);

  const handlePageChange = (newPage: number | ((prev: number) => number)) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const nextPage = typeof newPage === 'function' ? newPage(page) : newPage;
      next.set('reinforcements-page', nextPage.toString());
      return next;
    });
  };

  const selectedReturnSourceReinforcements = returnModalArgs.current?.tileId
    ? (reinforcements.find(
        ({ sourceTileId }) => sourceTileId === returnModalArgs.current?.tileId,
      ) ?? null)
    : null;

  const selectedRelocateSourceReinforcements = relocateModalArgs.current?.tileId
    ? (reinforcements.find(
        ({ sourceTileId }) =>
          sourceTileId === relocateModalArgs.current?.tileId,
      ) ?? null)
    : null;

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Reinforcements')}</Text>
        <Text>
          {t(
            'These are reinforcements from other villages currently stationed here under your protection.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        {reinforcements.length === 0 ? (
          <Text>{t('No reinforcements stationed in this village.')}</Text>
        ) : (
          <>
            {pagination.currentPageItems.map(
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
                          onClick={() =>
                            openReturnModal({ tileId: sourceTileId })
                          }
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
                          onClick={() =>
                            openRelocateModal({ tileId: sourceTileId })
                          }
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
          </>
        )}
      </SectionContent>

      {selectedReturnSourceReinforcements && (
        <ReturnReinforcementsModal
          isOpen={isReturnModalOpen}
          onClose={closeReturnModal}
          title={t('Return reinforcements')}
          tribe={selectedReturnSourceReinforcements.tribe}
          tileId={selectedReturnSourceReinforcements.sourceTileId}
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
