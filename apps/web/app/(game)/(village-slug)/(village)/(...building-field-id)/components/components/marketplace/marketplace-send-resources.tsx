import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GiMetalBar, GiStoneBlock, GiWoodPile } from 'react-icons/gi';
import { LuWheat } from 'react-icons/lu';
import type { Resource } from '@pillage-first/types/models/resource';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';

export const MarketplaceSendResources = () => {
  const { t } = useTranslation();

  const [resourceToSend, setResourceToSend] = useState<Resource>('wood');

  const onResourceToSendChange = (resource: Resource) => {
    setResourceToSend(resource);
  };

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="trade" />
        <Text as="h2">{t('Trade')}</Text>
        <Text>
          {t(
            "Buy resources from nearby players and filter offers to match your needs. Select the resource you're searching for by clicking its button. The same applies when choosing what you want to offer.",
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-col flex-1 gap-2">
            <Text className="font-medium">{t('Search for')}</Text>
            <ToggleGroup
              type="single"
              value={resourceToSend}
              onValueChange={onResourceToSendChange}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t('Send {{resource}}', {
                  resource: t('wood'),
                })}
                value="wood"
              >
                <GiWoodPile className="size-4" />
              </ToggleGroupItem>

              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t('Send {{resource}}', {
                  resource: t('clay'),
                })}
                value="clay"
              >
                <GiStoneBlock className="size-4" />
              </ToggleGroupItem>

              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t('Send {{resource}}', {
                  resource: t('iron'),
                })}
                value="iron"
              >
                <GiMetalBar className="size-4" />
              </ToggleGroupItem>

              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t('Send {{resource}}', {
                  resource: t('wheat'),
                })}
                value="wheat"
              >
                <LuWheat className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </SectionContent>
    </Section>
  );
};
