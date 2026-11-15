import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import { TroopMovementFilters } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/rally-point/components/troop-movement-filters';
import { TroopMovementTable } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/rally-point/components/troop-movement-table';
import { useTroopMovementFilters } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/rally-point/hooks/use-troop-movement-filters';
import { getTroopMovementFilterCategory } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/rally-point/utils/get-troop-movement-filter-category';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { useVillageTroopMovements } from 'app/(game)/(village-slug)/hooks/use-village-troop-movements';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Pagination } from 'app/components/ui/pagination';

export const RallyPointTroopMovements = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { troopMovements } = useVillageTroopMovements();
  const {
    filters: troopMovementFilters,
    onFiltersChange: onTroopMovementFiltersChange,
    page,
    handlePageChange,
  } = useTroopMovementFilters();

  const filteredTroopMovements = useMemo(() => {
    const activeFilters = new Set(troopMovementFilters);

    return troopMovements.filter((movement) =>
      activeFilters.has(
        getTroopMovementFilterCategory(movement, currentVillage.tileId),
      ),
    );
  }, [currentVillage.tileId, troopMovementFilters, troopMovements]);

  const pagination = usePagination(filteredTroopMovements, 20, page);

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="troop-movements" />
        <InformationPopover ariaLabel={t('Troop movements')}>
          <Text>
            {t(
              'This is a view of troop movements related to this village. You may toggle different types through filters below.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Troop movements')}</Text>
      </SectionContent>
      <SectionContent>
        <TroopMovementFilters
          troopMovementFilters={troopMovementFilters}
          onChange={onTroopMovementFiltersChange}
        />
        {filteredTroopMovements.length === 0 ? (
          <Text>{t('There are currently no troop movements.')}</Text>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {pagination.currentPageItems.map((movement) => (
                <TroopMovementTable
                  key={movement.id}
                  movement={movement}
                />
              ))}
            </div>
            <div className="flex w-full justify-end">
              <Pagination
                {...pagination}
                setPage={handlePageChange}
              />
            </div>
          </>
        )}
      </SectionContent>
    </Section>
  );
};
