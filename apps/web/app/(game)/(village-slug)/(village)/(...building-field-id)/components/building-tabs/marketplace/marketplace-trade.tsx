import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GiMetalBar, GiStoneBlock, GiWoodPile } from 'react-icons/gi';
import { LuListFilter, LuWheat } from 'react-icons/lu';
import type { Resource } from '@pillage-first/types/models/resource';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Badge } from 'app/components/ui/badge';
import { Button } from 'app/components/ui/button';
import { Checkbox } from 'app/components/ui/checkbox';
import { Label } from 'app/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';

type ResourceFilterPopoverProps = {
  ariaLabel: string;
  filters: Resource[];
  idPrefix: string;
  label: string;
  onChange: (resources: Resource[]) => void;
};

type ResourceFilterCheckboxProps = {
  children: ReactNode;
  idPrefix: string;
  isChecked: boolean;
  label: string;
  onCheckedChange: (filter: Resource, isChecked: boolean) => void;
  value: Resource;
};

const ResourceFilterCheckbox = ({
  children,
  idPrefix,
  isChecked,
  label,
  onCheckedChange,
  value,
}: ResourceFilterCheckboxProps) => {
  const id = `${idPrefix}-${value}`;

  return (
    <div className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent">
      <Checkbox
        id={id}
        checked={isChecked}
        onCheckedChange={(checked) => onCheckedChange(value, checked === true)}
      />
      <Label
        className="min-w-0 flex-1 cursor-pointer justify-between gap-3"
        htmlFor={id}
      >
        <span className="truncate">{label}</span>
        <span className="text-muted-foreground grayscale">{children}</span>
      </Label>
    </div>
  );
};

const ResourceFilterPopover = ({
  ariaLabel,
  filters,
  idPrefix,
  label,
  onChange,
}: ResourceFilterPopoverProps) => {
  const { t } = useTranslation();
  const activeFilters = new Set(filters);

  const updateFilter = (filter: Resource, isChecked: boolean) => {
    onChange(
      isChecked
        ? Array.from(new Set([...filters, filter]))
        : filters.filter((value) => value !== filter),
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={ariaLabel}
          size="sm"
          variant="outline"
        >
          <LuListFilter className="size-4" />
          {label}
          <Badge variant="secondary">{filters.length}</Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-3"
      >
        <div className="grid gap-1">
          <ResourceFilterCheckbox
            idPrefix={idPrefix}
            isChecked={activeFilters.has('wood')}
            label={t('wood')}
            onCheckedChange={updateFilter}
            value="wood"
          >
            <GiWoodPile className="size-4" />
          </ResourceFilterCheckbox>
          <ResourceFilterCheckbox
            idPrefix={idPrefix}
            isChecked={activeFilters.has('clay')}
            label={t('clay')}
            onCheckedChange={updateFilter}
            value="clay"
          >
            <GiStoneBlock className="size-4" />
          </ResourceFilterCheckbox>
          <ResourceFilterCheckbox
            idPrefix={idPrefix}
            isChecked={activeFilters.has('iron')}
            label={t('iron')}
            onCheckedChange={updateFilter}
            value="iron"
          >
            <GiMetalBar className="size-4" />
          </ResourceFilterCheckbox>
          <ResourceFilterCheckbox
            idPrefix={idPrefix}
            isChecked={activeFilters.has('wheat')}
            label={t('wheat')}
            onCheckedChange={updateFilter}
            value="wheat"
          >
            <LuWheat className="size-4" />
          </ResourceFilterCheckbox>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const MarketplaceTrade = () => {
  const { t } = useTranslation();

  const [resourcesToBuy, setResourcesToBuy] = useState<Resource[]>([]);
  const [resourcesToOffer, setResourcesToOffer] = useState<Resource[]>([]);
  // TODO: Type this
  const [sortBy, setSortBy] = useState<string>('trade-ratio-ascending');

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="trade" />
        <InformationPopover ariaLabel={t('Trade')}>
          <Text>
            {t(
              "Buy resources from nearby players and filter offers to match your needs. Select the resource you're searching for by clicking its button. The same applies when choosing what you want to offer.",
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Trade')}</Text>
      </SectionContent>
      <SectionContent>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-col flex-1 gap-2">
            <Text className="font-medium">{t('Search for')}</Text>
            <ResourceFilterPopover
              ariaLabel={t('Search resource filters')}
              filters={resourcesToBuy}
              idPrefix="marketplace-search-resource-filter"
              label={t('Resources')}
              onChange={setResourcesToBuy}
            />
          </div>
          <div className="flex flex-col flex-1 gap-2">
            <Text className="font-medium">{t('Offer')}</Text>
            <ResourceFilterPopover
              ariaLabel={t('Offered resource filters')}
              filters={resourcesToOffer}
              idPrefix="marketplace-offered-resource-filter"
              label={t('Resources')}
              onChange={setResourcesToOffer}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Text className="font-medium">{t('Sort by')}</Text>
            <div className="flex sm:max-w-62.5">
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
