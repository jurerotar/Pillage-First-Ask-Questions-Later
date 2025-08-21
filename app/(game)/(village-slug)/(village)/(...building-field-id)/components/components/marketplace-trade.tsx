import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { Text } from 'app/components/text';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';
import { useState } from 'react';
import type { Resource } from 'app/interfaces/models/game/resource';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';

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
            'Buy resources from nearby players and filter offers to match your needs. Select the resource you’re searching for by clicking its button. The same applies when choosing what you want to offer.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-col flex-1 gap-2">
            <Text className="font-medium">{t('Search for')}</Text>
            <ToggleGroup
              type="single"
              value={resourceToBuy}
              onValueChange={onResourceToBuyChange}
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
                <i className="icon icon-[gi-wood-pile] size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades offering {{resource}}',
                  { resource: t('clay') },
                )}
                value="raid"
              >
                <i className="icon icon-[gi-stone-block] size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades offering {{resource}}',
                  { resource: t('iron') },
                )}
                value="defence"
              >
                <i className="icon icon-[gi-metal-bar] size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades offering {{resource}}',
                  { resource: t('wheat') },
                )}
                value="scout-attack"
              >
                <i className="icon icon-[lu-wheat] size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-col flex-1 gap-2">
            <Text className="font-medium">{t('Offer')}</Text>
            <ToggleGroup
              type="single"
              value={resourceToOffer}
              onValueChange={onResourceToOfferChange}
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
                <i className="icon icon-[gi-wood-pile] size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades buying {{resource}}',
                  { resource: t('clay') },
                )}
                value="raid"
              >
                <i className="icon icon-[gi-stone-block] size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades buying {{resource}}',
                  { resource: t('iron') },
                )}
                value="defence"
              >
                <i className="icon icon-[gi-metal-bar] size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t(
                  'Show only trades buying {{resource}}',
                  { resource: t('wheat') },
                )}
                value="scout-attack"
              >
                <i className="icon icon-[lu-wheat] size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-2">
            <Text className="font-medium">{t('Sort by')}</Text>
            <div className="flex sm:max-w-[250px]">
              <Select
                onValueChange={(value) => setSortBy(value)}
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
