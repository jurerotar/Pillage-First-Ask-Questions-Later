import { BuildingField } from 'app/(game)/(village-slug)/(village)/components/building-field';
import { BuildingFieldTooltip } from 'app/(game)/(village-slug)/components/building-field-tooltip';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Tooltip } from 'app/components/tooltip';
import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/village';
import { useTranslation } from 'react-i18next';
import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';
import { useEffect } from 'react';
import layoutStyles from 'app/(game)/(village-slug)/layout.module.scss';
import { t } from 'i18next';
import { useActiveRoute } from 'app/(game)/(village-slug)/hooks/routes/use-active-route';

export const meta: MetaFunction = ({ location, params }) => {
  const { serverSlug, villageSlug } = params;
  const { pathname } = location;

  return [
    {
      title: `${pathname.endsWith('resources') ? t('Resources') : t('Village')} | Pillage First! - ${serverSlug} - ${villageSlug}`,
    },
  ];
};

const resourceViewBuildingFieldIds = [...Array(18)].map(
  (_, i) => i + 1,
) as BuildingFieldType['id'][];
const villageViewBuildingFieldIds = [...Array(22)].map(
  (_, i) => i + 19,
) as BuildingFieldType['id'][];

const VillagePage = () => {
  const { t } = useTranslation();
  const { villagePath } = useGameNavigation();
  const { isResourcesPageOpen, isVillagePageOpen } = useActiveRoute();

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

  return (
    <>
      <Tooltip
        anchorSelect="[data-building-field-id]"
        closeEvents={{
          mouseleave: true,
        }}
        offset={40}
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
