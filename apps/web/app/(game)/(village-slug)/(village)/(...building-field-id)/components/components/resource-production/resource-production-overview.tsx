import { use } from 'react';
import { useTranslation } from 'react-i18next';
import type { Building } from '@pillage-first/types/models/building';
import type { ResourceProductionEffectId } from '@pillage-first/types/models/effect';
import { ProductionOverview } from 'app/(game)/(village-slug)/(production-overview)/components/production-overview';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';

const productionEffectIdByBuildingId = new Map<
  Building['id'],
  ResourceProductionEffectId
>([
  ['WOODCUTTER', 'woodProduction'],
  ['CLAY_PIT', 'clayProduction'],
  ['IRON_MINE', 'ironProduction'],
  ['WHEAT_FIELD', 'wheatProduction'],
]);

export const ResourceProductionOverview = () => {
  const { t } = useTranslation();
  const { buildingField } = use(BuildingFieldContext);
  const effectId = productionEffectIdByBuildingId.get(
    buildingField!.buildingId,
  )!;

  return (
    <>
      <Section>
        <SectionContent>
          <Bookmark tab="production-overview" />
          <InformationPopover ariaLabel={t('Production overview')}>
            <Text>
              {t(
                'Review how base production, bonuses, oasis effects, hero bonuses and artifacts contribute to each resource.',
              )}
            </Text>
          </InformationPopover>
          <Text as="h2">{t('Production overview')}</Text>
        </SectionContent>
        <SectionContent>
          <ProductionOverview effectId={effectId} />
        </SectionContent>
      </Section>
    </>
  );
};
