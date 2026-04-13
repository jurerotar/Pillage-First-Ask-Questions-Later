import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { useTroopMovementFilters } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/hooks/use-troop-movement-filters';
import { TroopMovementFilters } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/troop-movement-filters';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { useVillageTroopMovements } from 'app/(game)/(village-slug)/hooks/use-village-troop-movements';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Pagination } from 'app/components/ui/pagination';

export const RallyPointTroopMovements = () => {
  const { t } = useTranslation();
  const { troopMovements } = useVillageTroopMovements();
  const {
    filters: troopMovementFilters,
    onFiltersChange: onTroopMovementFiltersChange,
    page,
    handlePageChange,
  } = useTroopMovementFilters();

  const pagination = usePagination(troopMovements, 20, page);

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="troop-movements" />
        <Text as="h2">{t('Troop movements')}</Text>
        <Text>
          {t(
            'This is a view of troop movements related to this village. You may toggle different types through filters below.',
          )}
        </Text>
      </SectionContent>
      <TroopMovementFilters
        troopMovementFilters={troopMovementFilters}
        onChange={onTroopMovementFiltersChange}
      />
      <SectionContent>
        <Alert variant="warning">
          {t('This page is still under development')}
        </Alert>
      </SectionContent>
      <SectionContent>
        <div className="flex w-full justify-end">
          <Pagination
            {...pagination}
            setPage={handlePageChange}
          />
        </div>
      </SectionContent>
    </Section>
  );
};
