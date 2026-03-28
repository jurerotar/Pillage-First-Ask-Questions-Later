import { useTranslation } from 'react-i18next';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { useHeroAdventures } from 'app/(game)/(village-slug)/hooks/use-hero-adventures';

export const useAdventuresActionsErrorBag = () => {
  const { t } = useTranslation();
  const { available } = useHeroAdventures();
  const { isHeroAlive, isHeroHome } = useHero();

  const errorBag: string[] = [];

  if (available === 0) {
    errorBag.push(t('You have no available adventure points.'));
  }

  if (!isHeroAlive) {
    errorBag.push(
      t(
        'Your hero is dead. You need to revive your hero before beginning an adventure.',
      ),
    );
  }

  if (!isHeroHome && isHeroAlive) {
    errorBag.push(t('Your hero is currently travelling.'));
  }

  return {
    errorBag,
  };
};
