import { Alert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';
import { useState } from 'react';
import type { HeroItem } from 'app/interfaces/models/game/hero';

export const AuctionsBuyItem = () => {
  const { t } = useTranslation();

  const [auctionFilter, setAuctionFilter] = useState<HeroItem['slot'] | ''>('');

  const onAuctionFilterChange = (filter: HeroItem['slot'] | '') => {
    setAuctionFilter(filter);
  };

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Buy items')}</Text>
        <Text>
          {t(
            'Browse and bid on hero items using silver. Find equipment or consumables that fit your needs.',
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        <Text className="font-medium">{t('Filter auction offers')}</Text>
        <ToggleGroup
          type="single"
          value={auctionFilter}
          onValueChange={onAuctionFilterChange}
          variant="outline"
          size="sm"
          className="overflow-x-scroll scrollbar-hidden"
        >
          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Head')}
            value="head"
          >
            <i className="icon icon-[gi-viking-helmet] size-4" />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Torso')}
            value="torso"
          >
            <i className="icon icon-[gi-chest-armor] size-4" />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Legs')}
            value="legs"
          >
            <i className="icon icon-[pi-pants-bold] size-4" />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Boots')}
            value="boots"
          >
            <i className="icon icon-[gi-boots] size-4" />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Right Hand')}
            value="right-hand"
          >
            <i className="icon icon-[gi-broadsword] size-4" />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Left Hand')}
            value="left-hand"
          >
            <i className="icon icon-[gi-shield] size-4" />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Consumable')}
            value="consumable"
          >
            <i className="icon icon-[gi-health-potion] size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </SectionContent>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </Section>
  );
};
