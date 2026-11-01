import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { useHeroAdventures } from 'app/(game)/(village-slug)/hooks/use-hero-adventures';

export const useAdventuresActionsErrorBag = () => {
  const { t } = useTranslation();
  const { available } = useHeroAdventures();
  const { hero, isHeroAlive } = useHero();
  const { currentVillage } = useCurrentVillage();

  const errorBag: ReactNode[] = [];
  const movement =
    hero.status.type === 'adventure' || hero.status.type === 'travel'
      ? hero.status
      : null;

  if (movement) {
    errorBag.push(
      <span key="hero-movement">
        {movement.type === 'adventure'
          ? t('Your hero is currently on an adventure. Returns in ')
          : t('Your hero is travelling. Arrives in ')}
        <Countdown endsAt={movement.endsAt} />
      </span>,
    );
  }

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

  if (
    hero.status.type === 'reinforcing' ||
    (hero.status.type === 'stationed' &&
      (hero.status.tileId !== currentVillage.tileId ||
        hero.villageId !== currentVillage.id))
  ) {
    errorBag.push(
      t('Hero must be positioned in its home village to start adventures'),
    );
  }

  return {
    errorBag,
  };
};
