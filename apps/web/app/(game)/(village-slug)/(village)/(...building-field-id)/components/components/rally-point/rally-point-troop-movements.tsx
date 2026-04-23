import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Troop } from '@pillage-first/types/models/troop';
import { partition } from '@pillage-first/utils/array';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { useTroopMovementFilters } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/hooks/use-troop-movement-filters';
import { TroopMovementFilters } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/troop-movement-filters';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination.ts';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useVillageTroopMovements } from 'app/(game)/(village-slug)/hooks/use-village-troop-movements';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import {
  UnitTable,
  UnitTableRow,
  UnitTableTitle,
  UnitTableUnitIcons,
  UnitTableWheatConsumption,
} from 'app/(game)/components/unit-table';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Pagination } from 'app/components/ui/pagination.tsx';

const formatTroopAmount = (tribe: Tribe, troops: Troop[]) => {
  const tribeUnits = [...getUnitsByTribe(tribe), getUnitDefinition('HERO')];

  return tribeUnits.map((unitDef) => {
    const troop = troops.find((t) => t.unitId === unitDef.id);
    return troop?.amount ?? 0;
  });
};

export const RallyPointTroopMovements = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { currentVillage } = useCurrentVillage();
  const { villageTroops } = useVillageTroops();
  const { troopMovements } = useVillageTroopMovements();
  const {
    filters: troopMovementFilters,
    onFiltersChange: onTroopMovementFiltersChange,
    page,
    handlePageChange,
  } = useTroopMovementFilters();

  const pagination = usePagination(troopMovements, 20, page);

  const [ownTroops, reinforcements] = useMemo(() => {
    return partition(
      villageTroops,
      (troop) => troop.source === currentVillage.tileId,
    );
  }, [villageTroops, currentVillage.tileId]);

  const ownTroopsAmount = useMemo(() => {
    return formatTroopAmount(tribe, ownTroops);
  }, [tribe, ownTroops]);

  const reinforcingTroopsByTribe = useMemo(() => {
    const reinforcingTribes = [
      ...new Set(
        reinforcements.map(({ unitId }) => {
          if (unitId === 'HERO') {
            return tribe;
          }

          const unit = getUnitDefinition(unitId);
          return unit.tribe;
        }),
      ),
    ] as Tribe[];

    const acc = new Map<Tribe, number[]>();

    for (const reinforcingTribe of reinforcingTribes) {
      const troopsByTribe = reinforcements.filter((troop) => {
        const { tribe } = getUnitDefinition(troop.unitId);
        return tribe === reinforcingTribe;
      });

      const tribeUnits = [
        ...getUnitsByTribe(reinforcingTribe),
        getUnitDefinition('HERO'),
      ];

      acc.set(
        reinforcingTribe,
        tribeUnits.map((unitDef) => {
          const troop = troopsByTribe.find((t) => t.unitId === unitDef.id);
          return troop?.amount ?? 0;
        }),
      );
    }

    return acc;
  }, [reinforcements, tribe]);

  const hasReinforcements = reinforcingTroopsByTribe.size > 0;

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

      <SectionContent>
        <TroopMovementFilters
          troopMovementFilters={troopMovementFilters}
          onChange={onTroopMovementFiltersChange}
        />
        <Alert variant="warning">
          {t('This page is still under development')}
        </Alert>
        <div className="flex w-full justify-end">
          <Pagination
            {...pagination}
            setPage={handlePageChange}
          />
        </div>
      </SectionContent>
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
          {[...reinforcingTroopsByTribe.entries()].map(
            ([unitTribe, amounts]) => (
              <UnitTable
                key={unitTribe}
                tribe={unitTribe}
              >
                <UnitTableTitle>
                  {t('Reinforcements from {{tribe}}', {
                    tribe: t(`TRIBES.${unitTribe.toUpperCase()}`),
                  })}
                </UnitTableTitle>
                <UnitTableUnitIcons />
                <UnitTableRow
                  label={t('Troops')}
                  amount={amounts}
                />
                <UnitTableWheatConsumption amount={amounts} />
              </UnitTable>
            ),
          )}
        </SectionContent>
      )}
    </Section>
  );
};
