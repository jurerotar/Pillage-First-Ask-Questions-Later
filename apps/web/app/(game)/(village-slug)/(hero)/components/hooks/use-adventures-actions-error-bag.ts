import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero.ts';
import { useHeroAdventures } from 'app/(game)/(village-slug)/hooks/use-hero-adventures.ts';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops.ts';

export const useAdventuresActionsErrorBag = () => {
  const { t } = useTranslation();
  const { available } = useHeroAdventures();
  const { isHeroAlive } = useHero();
  const { villageTroops } = useVillageTroops();

  const isHeroInVillage = useMemo(() => {
    return villageTroops.some(({ unitId }) => unitId === 'HERO');
  }, [villageTroops]);

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

  if (!isHeroInVillage && isHeroAlive) {
    errorBag.push(t('Your hero is currently travelling.'));
  }

  return {
    errorBag,
  };
};
