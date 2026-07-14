import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { ITooltip as ReactTooltipProps } from 'react-tooltip';
import type { BuildingField as BuildingFieldType } from '@pillage-first/types/models/building-field';
import {
  type ResourceFieldComposition,
  resourceFieldCompositionSchema,
} from '@pillage-first/types/models/resource-field-composition';
import { parseResourcesFromRFC } from '@pillage-first/utils/map';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(village)/+types/page';
import { BuildingField } from 'app/(game)/(village-slug)/(village)/components/building-field';
import { VillageMapContext } from 'app/(game)/(village-slug)/(village)/providers/village-map-context';
import { BuildingFieldTooltip } from 'app/(game)/(village-slug)/components/building-field-tooltip';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useBookmarks } from 'app/(game)/(village-slug)/hooks/use-bookmarks';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import layoutStyles from 'app/(game)/(village-slug)/layout.module.scss';
import { PageContents } from 'app/components/page-contents';
import { Tooltip } from 'app/components/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';

const resourceViewBuildingFieldIds = Array.from(
  { length: 18 },
  (_, i) => i + 1,
);
const villageViewBuildingFieldIds = Array.from(
  { length: 22 },
  (_, i) => i + 19,
);
const resourceFieldCompositions = resourceFieldCompositionSchema.options;

const VillagePage = (props: Route.ComponentProps) => {
  const { params, matches } = props;

  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const { currentVillage } = useCurrentVillage();
  const { bookmarks } = useBookmarks();
  const { preferences } = usePreferences();
  const [
    selectedResourceFieldComposition,
    setSelectedResourceFieldComposition,
  ] = useState<{
    villageId: number;
    value: ResourceFieldComposition;
  }>({
    villageId: currentVillage.id,
    value: currentVillage.resourceFieldComposition,
  });
  const buildingFieldById = useMemo(
    () =>
      new Map<BuildingFieldType['id'], BuildingFieldType>(
        currentVillage.buildingFields.map((buildingField) => [
          buildingField.id,
          buildingField,
        ]),
      ),
    [currentVillage.buildingFields],
  );

  const isResourcesPageOpen = matches.some(
    (match) => match?.id === 'resources-page',
  );
  const isVillagePageOpen = matches.some(
    (match) => match?.id === 'village-page',
  );

  const renderTooltip = useCallback(
    ({
      activeAnchor,
    }: Parameters<NonNullable<ReactTooltipProps['render']>>[0]) => {
      const id = activeAnchor?.getAttribute('data-building-field-id');
      if (!id) {
        return null;
      }

      const buildingFieldId = Number(id);
      const buildingField = buildingFieldById.get(buildingFieldId);

      if (!buildingField) {
        return t('Building site');
      }

      return <BuildingFieldTooltip buildingField={buildingField} />;
    },
    [buildingFieldById, t],
  );

  useEffect(() => {
    const className = layoutStyles['background-image--village'];
    document.body.classList.toggle(className, isVillagePageOpen);

    return () => {
      document.body.classList.remove(className);
    };
  }, [isVillagePageOpen]);
  const title = `${isResourcesPageOpen ? t('Resources') : t('Village')} | Pillage First! - ${serverSlug} - ${villageSlug}`;
  const buildingFieldIds = isResourcesPageOpen
    ? resourceViewBuildingFieldIds
    : villageViewBuildingFieldIds;
  const resourceFieldComposition =
    selectedResourceFieldComposition.villageId === currentVillage.id
      ? selectedResourceFieldComposition.value
      : currentVillage.resourceFieldComposition;

  const villageMapContextValue = useMemo(
    () => ({
      bookmarks,
      currentVillage,
      isWiderThanLg,
      resourceFieldComposition,
      shouldShowBuildingNames: preferences.shouldShowBuildingNames,
    }),
    [
      bookmarks,
      currentVillage,
      isWiderThanLg,
      preferences.shouldShowBuildingNames,
      resourceFieldComposition,
    ],
  );

  return (
    <PageContents>
      <title>{title}</title>
      <Tooltip
        anchorSelect="[data-building-field-id]"
        closeEvents={{
          mouseleave: true,
        }}
        hidden={!isWiderThanLg}
        render={renderTooltip}
      />
      <main className="flex flex-col items-center justify-center mx-auto lg:mt-20 lg:mb-0 max-h-[calc(100dvh-12rem)] standalone:max-h-[calc(100dvh-15rem)] h-screen lg:h-auto lg:max-h-none overflow-x-hidden">
        <div className="z-10 mb-4 flex w-full max-w-5xl justify-center px-4">
          <div className="flex flex-col gap-2 text-sm font-medium">
            <span id="resource-field-composition-label">
              {t('Resource field composition')}
            </span>
            <Select
              value={resourceFieldComposition}
              onValueChange={(value) => {
                setSelectedResourceFieldComposition({
                  villageId: currentVillage.id,
                  value: value as ResourceFieldComposition,
                });
              }}
            >
              <SelectTrigger
                aria-labelledby="resource-field-composition-label"
                className="w-52 bg-background/90 backdrop-blur"
              >
                <SelectValue placeholder={t('Select resource composition')} />
              </SelectTrigger>
              <SelectContent>
                {resourceFieldCompositions.map((rfc) => (
                  <SelectItem
                    key={rfc}
                    value={rfc}
                  >
                    <Resources
                      iconClassName="size-4"
                      resources={parseResourcesFromRFC(rfc)}
                    />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <VillageMapContext value={villageMapContextValue}>
          <div className="relative aspect-16/10 scrollbar-hidden min-w-[460px] max-w-5xl w-full">
            {buildingFieldIds.map((buildingFieldId) => (
              <BuildingField
                buildingField={buildingFieldById.get(buildingFieldId) ?? null}
                buildingFieldId={buildingFieldId}
                key={buildingFieldId}
              />
            ))}
            {isResourcesPageOpen && (
              <Link
                to="../village"
                className="absolute text-xs lg:size-24 lg:text-sm left-1/2 top-1/2 size-14 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-500"
                aria-label={t('Village')}
              >
                Village
              </Link>
            )}
          </div>
        </VillageMapContext>
      </main>
    </PageContents>
  );
};

export default VillagePage;
