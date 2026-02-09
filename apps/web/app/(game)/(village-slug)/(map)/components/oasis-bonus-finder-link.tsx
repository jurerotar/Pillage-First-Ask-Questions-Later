import { useTranslation } from 'react-i18next';
import { PiListMagnifyingGlass } from 'react-icons/pi';
import { Link } from 'react-router';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';

export const OasisBonusFinderLink = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { coordinates } = currentVillage;

  return (
    <Link
      data-tooltip-id="general-tooltip"
      data-tooltip-content={t('Oasis bonus finder')}
      to={`../oasis-bonus-finder?x=${coordinates.x}&y=${coordinates.y}`}
    >
      <PiListMagnifyingGlass className="size-10 lg:size-12 bg-background rounded-full p-1 lg:p-2 border-4 border-border hover:bg-accent" />
    </Link>
  );
};
