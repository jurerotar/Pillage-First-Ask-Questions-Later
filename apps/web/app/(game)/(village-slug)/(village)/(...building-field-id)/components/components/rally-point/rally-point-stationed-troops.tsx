import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Pagination } from 'app/components/ui/pagination';
import { useFilters } from 'app/hooks/use-filters';

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

  const [ownTroops, reinforcements] = useMemo(() => {
    return partition(
      villageTroops,
      (troop) => troop.source === currentVillage.tileId,
    );
  }, [villageTroops, currentVillage.tileId]);

  const ownTroopsAmount = useMemo(() => {
    return formatTroopAmount(tribe, ownTroops);
  }, [tribe, ownTroops]);

  const villageNameByTileId = useMemo(() => {
    return new Map(
      playerVillages.map((village) => [village.tileId, village.name] as const),
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
        sourceVillageName: villageNameByTileId.get(sourceTileId),
        tribe: sourceTribe,
        amount: formatTroopAmount(sourceTribe, troops),
      };
    });
  }, [reinforcements, tribe, villageNameByTileId]);

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
            ({ sourceTileId, sourceVillageName, tribe, amount }) => (
              <UnitTable
                key={sourceTileId}
                tribe={tribe}
              >
                <UnitTableTitle>
                  {t('Reinforcements from {{villageName}}', {
                    villageName: sourceVillageName,
                  })}
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
    </Section>
  );
};
