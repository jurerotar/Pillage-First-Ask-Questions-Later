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
import { Alert } from 'app/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';

export const MarketplaceTrade = () => {
  const { t } = useTranslation();

  const [resourceToBuy, setResourceToBuy] = useState<Resource | ''>('');
  const [resourceToOffer, setResourceToOffer] = useState<Resource | ''>('');
  // TODO: Type this
  const [sortBy, setSortBy] = useState<string>('trade-ratio-ascending');

  const onResourceToBuyChange = (resource: Resource) => {
    setResourceToBuy(resource);
  };

  const onResourceToOfferChange = (resource: Resource) => {
    setResourceToOffer(resource);
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
              value={[resourceToBuy]}
              onValueChange={(val: any[]) => onResourceToBuyChange(val[0])}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades offering {{resource}}',
                  { resource: t('wood') },
                )}
                value="attack"
              >
                <GiWoodPile className="size-4" />
              </ToggleGroupItem>

              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades offering {{resource}}',
                  { resource: t('clay') },
                )}
                value="raid"
              >
                <GiStoneBlock className="size-4" />
              </ToggleGroupItem>

              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades offering {{resource}}',
                  { resource: t('iron') },
                )}
                value="defence"
              >
                <GiMetalBar className="size-4" />
              </ToggleGroupItem>

              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades offering {{resource}}',
                  { resource: t('wheat') },
                )}
                value="scout-attack"
              >
                <LuWheat className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-col flex-1 gap-2">
            <Text className="font-medium">{t('Offer')}</Text>
            <ToggleGroup
              value={[resourceToOffer]}
              onValueChange={(val: any[]) => onResourceToOfferChange(val[0])}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades buying {{resource}}',
                  { resource: t('wood') },
                )}
                value="attack"
              >
                <GiWoodPile className="size-4" />
              </ToggleGroupItem>

              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades buying {{resource}}',
                  { resource: t('clay') },
                )}
                value="raid"
              >
                <GiStoneBlock className="size-4" />
              </ToggleGroupItem>

              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades buying {{resource}}',
                  { resource: t('iron') },
                )}
                value="defence"
              >
                <GiMetalBar className="size-4" />
              </ToggleGroupItem>

              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades buying {{resource}}',
                  { resource: t('wheat') },
                )}
                value="scout-attack"
              >
                <LuWheat className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-2">
            <Text className="font-medium">{t('Sort by')}</Text>
            <div className="flex sm:max-w-62.5">
              <Select
                onValueChange={(value: any) => setSortBy(value)}
                value={sortBy}
              >
                <SelectTrigger
                  className="w-full"
                  title={t('Sort trade offers')}
                  aria-label={t('Sort trade offers')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trade-ratio-ascending">
                    {t('Trade ratio - ascending')}
                  </SelectItem>
                  <SelectItem value="trade-ratio-descending">
                    {t('Trade ratio - descending')}
                  </SelectItem>
                  <SelectItem value="offered-amount-ascending">
                    {t('Offered amount - ascending')}
                  </SelectItem>
                  <SelectItem value="offered-amount-descending">
                    {t('Offered amount - descending')}
                  </SelectItem>
                  <SelectItem value="requested-amount-ascending">
                    {t('Requested amount - ascending')}
                  </SelectItem>
                  <SelectItem value="requested-amount-descending">
                    {t('Requested amount - descending')}
                  </SelectItem>
                  <SelectItem value="travel-time-ascending">
                    {t('Travel time - ascending')}
                  </SelectItem>
                  <SelectItem value="travel-time-descending">
                    {t('Travel time - descending')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </SectionContent>
      <SectionContent>
        <Alert variant="warning">
          {t('This page is still under development')}
        </Alert>
      </SectionContent>
    </Section>
  );
};
