import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPen } from 'react-icons/fa6';
import { LuTrash } from 'react-icons/lu';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { CreateFarmListModal } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/farm-list/create-farm-list-modal';
import { EditFarmListModal } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/farm-list/edit-farm-list-modal';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useFarmLists } from 'app/(game)/(village-slug)/hooks/use-farm-lists';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { useDialog } from 'app/hooks/use-dialog';

export const RallyPointFarmList = () => {
  const { t } = useTranslation();
  const {
    isOpen: isCreateFarmListModalOpen,
    openModal: openCreateFarmListModalOpen,
    closeModal: closeCreateFarmListModal,
  } = useDialog();
  const {
    isOpen: isEditFarmListModalOpen,
    openModal: openEditFarmListModalOpen,
    closeModal: closeEditFarmListModal,
    modalArgs: editModalArgs,
  } = useDialog<number>();
  const { farmLists, deleteFarmList } = useFarmLists();
  const { playerVillages } = usePlayerVillageListing();

  const farmListsByVillage = useMemo(() => {
    const grouped: Record<number, typeof farmLists> = {};
    for (const list of farmLists) {
      if (!grouped[list.villageId]) {
        grouped[list.villageId] = [];
      }
      grouped[list.villageId].push(list);
    }
    return grouped;
  }, [farmLists]);

  const villagesWithLists = useMemo(() => {
    return playerVillages.filter((v) => farmListsByVillage[v.id]);
  }, [playerVillages, farmListsByVillage]);

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="farm-list" />
        <Text as="h2">{t('Farm List')}</Text>
        <Text>
          {t(
            'The Farm List allows you to manage and send multiple raids quickly and efficiently, saving time and improving resource farming. Each farm list belong to a village and holds up to 100 targets.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Text className="font-medium">
          {t('You currently have {{count}} farm lists.', {
            count: farmLists.length,
          })}
        </Text>
      </SectionContent>
      {villagesWithLists.length > 0 && (
        <SectionContent>
          {villagesWithLists.map((village) => (
            <div
              key={village.id}
              className="flex flex-col gap-2"
            >
              <Text className="font-semibold px-1">{village.name}</Text>
              <div className="flex flex-col gap-2">
                {farmListsByVillage[village.id].map((list) => (
                  <details
                    key={list.id}
                    className="group border"
                  >
                    <summary className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50 transition-colors list-none">
                      <div className="flex items-center gap-2">
                        <Text className="font-medium">{list.name}</Text>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-normal text-muted-foreground">
                          {list.targetCount}/100
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEditFarmListModalOpen(list.id);
                          }}
                        >
                          <FaPen className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteFarmList(list.id);
                          }}
                        >
                          <LuTrash className="size-4" />
                        </Button>
                      </div>
                    </summary>
                    <div className="p-2 border-t bg-muted/10">
                      <Text className="text-sm text-muted-foreground text-center">
                        {t('No targets in this farm list.')}
                      </Text>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </SectionContent>
      )}
      <SectionContent>
        <div className="flex justify-end w-full">
          <Button
            size="fit"
            onClick={() => openCreateFarmListModalOpen()}
          >
            {t('Create new list')}
          </Button>
        </div>
      </SectionContent>
      <CreateFarmListModal
        isOpen={isCreateFarmListModalOpen}
        onClose={closeCreateFarmListModal}
      />
      <EditFarmListModal
        isOpen={isEditFarmListModalOpen}
        id={editModalArgs.current!}
        onClose={closeEditFarmListModal}
      />
    </Section>
  );
};
