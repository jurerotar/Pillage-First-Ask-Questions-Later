import { useTranslation } from 'react-i18next';
import { FaBookBookmark } from 'react-icons/fa6';
import { LuAnvil, LuConstruction, LuFlag } from 'react-icons/lu';
import { TbTargetArrow } from 'react-icons/tb';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import type { HistoryEvent } from 'app/(game)/(village-slug)/hooks/use-events-history';
import { Text } from 'app/components/text';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';

type EventFiltersProps = {
  eventFilters: HistoryEvent['type'][];
  onChange: (eventFilters: HistoryEvent['type'][]) => void;
};

export const EventFilters = ({ eventFilters, onChange }: EventFiltersProps) => {
  const { t } = useTranslation();

  return (
    <SectionContent>
      <Text className="font-semibold">{t('Filter events')}</Text>
      <ToggleGroup
        type="multiple"
        value={eventFilters}
        onValueChange={onChange}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle construction events')}
          value="construction"
        >
          <LuConstruction className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle training events')}
          value="training"
        >
          <TbTargetArrow className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle improvement events')}
          value="improvement"
        >
          <LuAnvil className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle research events')}
          value="research"
        >
          <FaBookBookmark className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Toggle founding events')}
          value="founding"
        >
          <LuFlag className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </SectionContent>
  );
};
