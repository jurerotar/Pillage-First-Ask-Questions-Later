import { Alert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';
import React, { useState } from 'react';
import type { HeroItem } from 'app/interfaces/models/game/hero';
import { Icon } from 'react-icons-sprite';
import {
  GiBoots,
  GiBroadsword,
  GiChestArmor,
  GiHealthPotion,
  GiShield,
  GiVikingHelmet,
} from 'react-icons/gi';
import { PiPantsBold } from 'react-icons/pi';

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
            <Icon
              icon={GiVikingHelmet}
              className="size-4"
            />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Torso')}
            value="torso"
          >
            <Icon
              icon={GiChestArmor}
              className="size-4"
            />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Legs')}
            value="legs"
          >
            <Icon
              icon={PiPantsBold}
              className="size-4"
            />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Boots')}
            value="boots"
          >
            <Icon
              icon={GiBoots}
              className="size-4"
            />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Right Hand')}
            value="right-hand"
          >
            <Icon
              icon={GiBroadsword}
              className="size-4"
            />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Left Hand')}
            value="left-hand"
          >
            <Icon
              icon={GiShield}
              className="size-4"
            />
          </ToggleGroupItem>

          <ToggleGroupItem
            data-tooltip-id="general-tooltip"
            data-tooltip-content={t('Consumable')}
            value="consumable"
          >
            <Icon
              icon={GiHealthPotion}
              className="size-4"
            />
          </ToggleGroupItem>
        </ToggleGroup>
      </SectionContent>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
    </Section>
  );
};
