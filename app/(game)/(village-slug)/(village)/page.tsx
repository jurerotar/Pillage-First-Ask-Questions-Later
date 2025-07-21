import { BuildingField } from 'app/(game)/(village-slug)/(village)/components/building-field';
import { BuildingFieldTooltip } from 'app/(game)/(village-slug)/components/building-field-tooltip';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Tooltip } from 'app/components/tooltip';
import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/village';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Link } from 'react-router';
import type React from 'react';
import { useEffect } from 'react';
import layoutStyles from 'app/(game)/(village-slug)/layout.module.scss';
import { useActiveRoute } from 'app/(game)/(village-slug)/hooks/routes/use-active-route';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(village)/+types/page';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';

const resourceViewBuildingFieldIds = [...Array(18)].map(
  (_, i) => i + 1,
) as BuildingFieldType['id'][];
const villageViewBuildingFieldIds = [...Array(22)].map(
  (_, i) => i + 19,
) as BuildingFieldType['id'][];

const VillagePage: React.FC<Route.ComponentProps> = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { villagePath } = useGameNavigation();
  const { isResourcesPageOpen, isVillagePageOpen } = useActiveRoute();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

  const buildingFieldIdsToDisplay = isResourcesPageOpen
    ? resourceViewBuildingFieldIds
    : villageViewBuildingFieldIds;

  useEffect(() => {
    const className = layoutStyles['background-image--village'];
    document.body.classList.toggle(className, isVillagePageOpen);

    return () => {
      document.body.classList.remove(className);
    };
  }, [isVillagePageOpen]);

  const title = `${pathname.endsWith('resources') ? t('Resources') : t('Village')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <Tooltip
        anchorSelect="[data-building-field-id]"
        closeEvents={{
          mouseleave: true,
        }}
        hidden={!isWiderThanLg}
        render={({ activeAnchor }) => {
          const buildingFieldIdAttribute = activeAnchor?.getAttribute(
            'data-building-field-id',
          );

          if (!buildingFieldIdAttribute) {
            return null;
          }

          const buildingFieldId = Number(
            buildingFieldIdAttribute,
          ) as BuildingFieldType['id'];

          return <BuildingFieldTooltip buildingFieldId={buildingFieldId} />;
        }}
      />
      <main className="flex flex-col items-center justify-center mx-auto lg:mt-20 lg:mb-0 max-h-[calc(100dvh-12rem)] standalone:max-h-[calc(100dvh-15rem)] h-screen lg:h-auto lg:max-h-none overflow-x-hidden">
        <div className="relative aspect-[16/10] scrollbar-hidden min-w-[460px] max-w-5xl w-full">
          {buildingFieldIdsToDisplay.map((buildingFieldId) => (
            <BuildingField
              key={buildingFieldId}
              buildingFieldId={buildingFieldId}
            />
          ))}
          {isResourcesPageOpen && (
            <Link
              to={villagePath}
              className="absolute text-xs lg:size-24 lg:text-sm left-1/2 top-1/2 size-14 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500"
              aria-label={t('Village')}
            >
              Village
            </Link>
          )}
        </div>
      </main>
    </>
  );
};

export default VillagePage;
