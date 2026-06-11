import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IoReturnUpForwardOutline } from 'react-icons/io5';
import { TbMapPinDown } from 'react-icons/tb';
import { useSearchParams } from 'react-router';
import { sortTroops } from '@pillage-first/game-assets/utils/troops';
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
import { useDialog } from 'app/hooks/use-dialog';

type ReinforcementDialogData = {
  tileId: number;
};

export const RallyPointSentReinforcementsTab = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tribe = useTribe();
  const { currentVillage } = useCurrentVillage();
  const { sentReinforcements } = useVillageTroops();
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

  const sentReinforcementEntries = useMemo(() => {
    return sentReinforcements.map(({ targetType, village, troops }) => ({
      targetType,
      village,
      troops,
      sortedTroops: sortTroops(tribe, troops),
    }));
  }, [sentReinforcements, tribe]);

  const page = Number.parseInt(
    searchParams.get('sent-reinforcements-page') ?? '1',
    10,
  );
  const pagination = usePagination(sentReinforcementEntries, 20, page);

  const handlePageChange = (newPage: number | ((prev: number) => number)) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const nextPage = typeof newPage === 'function' ? newPage(page) : newPage;
      next.set('sent-reinforcements-page', nextPage.toString());
      return next;
    });
  };

  const selectedReturnSentReinforcements = returnModalArgs.current?.tileId
    ? (sentReinforcements.find(
        ({ village }) => village.tileId === returnModalArgs.current?.tileId,
      ) ?? null)
    : null;

  const selectedRelocateSentReinforcements = relocateModalArgs.current?.tileId
    ? (sentReinforcements.find(
        ({ village }) => village.tileId === relocateModalArgs.current?.tileId,
      ) ?? null)
    : null;

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Sent reinforcements')}</Text>
        <Text>
          {t(
            'These are your troops currently stationed as reinforcements in other villages.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        {sentReinforcementEntries.length === 0 ? (
          <Text>
            {t('No reinforcements have been sent from this village.')}
          </Text>
        ) : (
          <>
            {pagination.currentPageItems.map(
              ({ targetType, village, sortedTroops }) => (
                <UnitTable
                  key={village.tileId}
                  tribe={tribe}
                >
                  <UnitTableTitle>
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {t('Reinforcing {{villageName}}', {
                          villageName: village.name,
                        })}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          data-tooltip-id="general-tooltip"
                          data-tooltip-content={t(
                            'Return reinforcements to this village',
                          )}
                          onClick={() =>
                            openReturnModal({ tileId: village.tileId })
                          }
                        >
                          <IoReturnUpForwardOutline className="size-4" />
                        </Button>
                        {targetType !== 'oasis' && (
                          <Button
                            variant="outline"
                            size="sm"
                            data-tooltip-id="general-tooltip"
                            data-tooltip-content={t('Relocate reinforcements')}
                            onClick={() =>
                              openRelocateModal({ tileId: village.tileId })
                            }
                          >
                            <TbMapPinDown className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </UnitTableTitle>
                  <UnitTableUnitIcons />
                  <UnitTableRow
                    label={t('Troops')}
                    troops={sortedTroops}
                  />
                  <UnitTableWheatConsumption troops={sortedTroops} />
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

      {selectedReturnSentReinforcements && (
        <ReturnReinforcementsModal
          isOpen={isReturnModalOpen}
          onClose={closeReturnModal}
          title={t('Return reinforcements to {{villageName}}', {
            villageName: currentVillage.name,
          })}
          mode="outgoing"
          tileId={selectedReturnSentReinforcements.village.tileId}
          tribe={tribe}
          troops={selectedReturnSentReinforcements.troops}
        />
      )}

      {selectedRelocateSentReinforcements && (
        <RelocateTroopsModal
          isOpen={isRelocateModalOpen}
          onClose={closeRelocateModal}
          title={t('Relocate reinforcements')}
          mode="outgoing"
          stationedVillageName={selectedRelocateSentReinforcements.village.name}
          stationedTileId={selectedRelocateSentReinforcements.village.tileId}
          tribe={tribe}
          troops={selectedRelocateSentReinforcements.troops}
        />
      )}
    </Section>
  );
};
