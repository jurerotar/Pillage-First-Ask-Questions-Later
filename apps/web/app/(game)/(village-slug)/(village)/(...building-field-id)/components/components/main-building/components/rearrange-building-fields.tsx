import { clsx } from 'clsx';
import { type DragEvent, use, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useRearrangeBuildingFields } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/hooks/use-rearrange-building-fields';
import buildingFieldStyles from 'app/(game)/(village-slug)/(village)/components/building-field.module.scss';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { Text } from 'app/components/text';

type RearrangeableBuildingFieldId = BuildingField['id'];
type BuildingFieldSlots = Record<
  RearrangeableBuildingFieldId,
  Building['id'] | null
>;

const villageViewBuildingFieldIds = Array.from(
  { length: 22 },
  (_, index) => index + 19,
);
const lockedBuildingFieldIds = new Set<BuildingField['id']>([39, 40]);

const getBuildingFieldSlots = (
  buildingFields: BuildingField[],
): BuildingFieldSlots => {
  return Object.fromEntries(
    villageViewBuildingFieldIds.map((buildingFieldId) => {
      const buildingField = buildingFields.find(
        ({ id }) => id === buildingFieldId,
      );

      return [buildingFieldId, buildingField?.buildingId ?? null];
    }),
  ) as BuildingFieldSlots;
};

const isLockedBuildingField = (buildingFieldId: BuildingField['id']) => {
  return lockedBuildingFieldIds.has(buildingFieldId);
};

export const RearrangeBuildingFields = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { preferences } = usePreferences();
  const { buildingEvents } = use(CurrentVillageBuildingQueueContext);
  const { rearrangeBuildingFieldsAsync, isRearrangingBuildingFields } =
    useRearrangeBuildingFields();

  const initialBuildingFieldSlots = useMemo(
    () => getBuildingFieldSlots(currentVillage.buildingFields),
    [currentVillage.buildingFields],
  );
  const [buildingFieldSlots, setBuildingFieldSlots] =
    useState<BuildingFieldSlots>(initialBuildingFieldSlots);
  const [draggedBuildingFieldId, setDraggedBuildingFieldId] = useState<
    BuildingField['id'] | null
  >(null);
  const [dragOverBuildingFieldId, setDragOverBuildingFieldId] = useState<
    BuildingField['id'] | null
  >(null);
  const [selectedBuildingFieldId, setSelectedBuildingFieldId] = useState<
    BuildingField['id'] | null
  >(null);

  useEffect(() => {
    setBuildingFieldSlots(initialBuildingFieldSlots);
    setSelectedBuildingFieldId(null);
  }, [initialBuildingFieldSlots]);

  const persistBuildingFieldSlots = async (slots: BuildingFieldSlots) => {
    await rearrangeBuildingFieldsAsync(
      villageViewBuildingFieldIds.map((buildingFieldId) => ({
        buildingFieldId,
        buildingId: slots[buildingFieldId],
      })),
    );
  };

  const moveBuildingField = async (
    sourceBuildingFieldId: BuildingField['id'],
    targetBuildingFieldId: BuildingField['id'],
  ) => {
    if (
      sourceBuildingFieldId === targetBuildingFieldId ||
      isLockedBuildingField(sourceBuildingFieldId) ||
      isLockedBuildingField(targetBuildingFieldId) ||
      buildingFieldSlots[sourceBuildingFieldId] === null
    ) {
      return;
    }

    const nextBuildingFieldSlots = {
      ...buildingFieldSlots,
      [sourceBuildingFieldId]: buildingFieldSlots[targetBuildingFieldId],
      [targetBuildingFieldId]: buildingFieldSlots[sourceBuildingFieldId],
    };

    setBuildingFieldSlots(nextBuildingFieldSlots);
    setSelectedBuildingFieldId(null);

    try {
      await persistBuildingFieldSlots(nextBuildingFieldSlots);
    } catch {
      setBuildingFieldSlots(buildingFieldSlots);
    }
  };

  const handleBuildingFieldClick = async (
    buildingFieldId: BuildingField['id'],
  ) => {
    if (isLockedBuildingField(buildingFieldId) || isRearrangingBuildingFields) {
      return;
    }

    if (selectedBuildingFieldId === null) {
      if (buildingFieldSlots[buildingFieldId] !== null) {
        setSelectedBuildingFieldId(buildingFieldId);
      }
      return;
    }

    if (selectedBuildingFieldId === buildingFieldId) {
      setSelectedBuildingFieldId(null);
      return;
    }

    await moveBuildingField(selectedBuildingFieldId, buildingFieldId);
  };

  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    buildingFieldId: BuildingField['id'],
  ) => {
    if (
      isLockedBuildingField(buildingFieldId) ||
      buildingFieldSlots[buildingFieldId] === null
    ) {
      event.preventDefault();
      return;
    }

    setDraggedBuildingFieldId(buildingFieldId);
    setSelectedBuildingFieldId(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(buildingFieldId));
  };

  const handleDragOver = (
    event: DragEvent<HTMLButtonElement>,
    buildingFieldId: BuildingField['id'],
  ) => {
    if (
      isLockedBuildingField(buildingFieldId) ||
      draggedBuildingFieldId === null
    ) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverBuildingFieldId(buildingFieldId);
  };

  const handleDrop = async (
    event: DragEvent<HTMLButtonElement>,
    targetBuildingFieldId: BuildingField['id'],
  ) => {
    event.preventDefault();

    const sourceBuildingFieldId =
      draggedBuildingFieldId ??
      Number(event.dataTransfer.getData('text/plain'));

    setDraggedBuildingFieldId(null);
    setDragOverBuildingFieldId(null);

    if (
      !sourceBuildingFieldId ||
      sourceBuildingFieldId === targetBuildingFieldId ||
      isLockedBuildingField(sourceBuildingFieldId) ||
      isLockedBuildingField(targetBuildingFieldId)
    ) {
      return;
    }

    await moveBuildingField(sourceBuildingFieldId, targetBuildingFieldId);
  };

  const handleDragEnd = () => {
    setDraggedBuildingFieldId(null);
    setDragOverBuildingFieldId(null);
  };

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Rearrange buildings')}</Text>
        <Text>
          {t('Drag buildings between available village building sites.')}
        </Text>
      </SectionContent>
      <SectionContent>
        <div className="relative aspect-16/10 w-full max-w-full lg:max-w-5xl overflow-hidden">
          {villageViewBuildingFieldIds.map((buildingFieldId) => {
            const buildingId = buildingFieldSlots[buildingFieldId];
            const isLocked = isLockedBuildingField(buildingFieldId);
            const isDragged = draggedBuildingFieldId === buildingFieldId;
            const isDragOver = dragOverBuildingFieldId === buildingFieldId;
            const isSelected = selectedBuildingFieldId === buildingFieldId;
            const positioningStyles =
              buildingFieldStyles[`building-field--${buildingFieldId}`];
            const currentBuildingFieldBuildingEvent = buildingEvents.find(
              ({ buildingFieldId: eventBuildingFieldId }) =>
                eventBuildingFieldId === buildingFieldId,
            );
            const hasEvent = !!currentBuildingFieldBuildingEvent;

            return (
              <div
                key={buildingFieldId}
                className={clsx(
                  positioningStyles,
                  'absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center',
                )}
              >
                <button
                  type="button"
                  draggable={
                    buildingId !== null &&
                    !isLocked &&
                    !isRearrangingBuildingFields
                  }
                  onDragStart={(event) =>
                    handleDragStart(event, buildingFieldId)
                  }
                  onDragOver={(event) => handleDragOver(event, buildingFieldId)}
                  onDragLeave={() => setDragOverBuildingFieldId(null)}
                  onDrop={(event) => handleDrop(event, buildingFieldId)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleBuildingFieldClick(buildingFieldId)}
                  data-building-field-id={buildingFieldId}
                  aria-label={
                    buildingId
                      ? t(`BUILDINGS.${buildingId}.NAME`)
                      : t('Building site')
                  }
                  aria-disabled={isLocked || isRearrangingBuildingFields}
                  aria-pressed={isSelected}
                  style={
                    buildingId === null
                      ? {
                          clipPath: 'ellipse(50% 50% at 50% 50%)',
                        }
                      : undefined
                  }
                  className={clsx(
                    'touch-manipulation',
                    buildingId
                      ? 'relative size-10 lg:size-16 rounded-full select-none focus:outline-hidden focus:ring-2 focus:ring-black/80 dark:focus:ring-ring border border-black/10 dark:border-border'
                      : 'w-12 lg:w-20 h-8 lg:h-12 bg-green-900/50 hover:bg-green-800/70 cursor-pointer',
                    buildingId !== null &&
                      !isLocked &&
                      !isRearrangingBuildingFields &&
                      'cursor-grab active:cursor-grabbing',
                    isLocked && 'cursor-not-allowed opacity-70',
                    isDragged && 'opacity-40',
                    (isDragOver || isSelected) && 'ring-2 ring-ring bg-accent',
                  )}
                >
                  {buildingId && preferences.shouldShowBuildingNames && (
                    <span className="inline-flex flex-col lg:flex-row text-center text-3xs md:text-2xs px-0.5 md:px-1 z-10 bg-background border border-border rounded-xs whitespace-nowrap absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[calc(50%+20px)] lg:top-[calc(50%+25px)]">
                      {hasEvent && (
                        <Countdown
                          endsAt={
                            currentBuildingFieldBuildingEvent.startsAt +
                            currentBuildingFieldBuildingEvent.duration
                          }
                        />
                      )}
                      {!hasEvent && t(`BUILDINGS.${buildingId}.NAME`)}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </SectionContent>
    </Section>
  );
};
