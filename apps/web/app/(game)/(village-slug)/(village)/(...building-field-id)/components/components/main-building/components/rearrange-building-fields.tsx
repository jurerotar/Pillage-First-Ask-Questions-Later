import { clsx } from 'clsx';
import { type DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useRearrangeBuildingFields } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/hooks/use-rearrange-building-fields';
import buildingFieldStyles from 'app/(game)/(village-slug)/(village)/components/building-field.module.scss';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';

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

const areBuildingFieldSlotsEqual = (
  firstSlots: BuildingFieldSlots,
  secondSlots: BuildingFieldSlots,
) => {
  return villageViewBuildingFieldIds.every(
    (buildingFieldId) =>
      firstSlots[buildingFieldId] === secondSlots[buildingFieldId],
  );
};

export const RearrangeBuildingFields = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentVillage } = useCurrentVillage();
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
  const dragImageRef = useRef<HTMLElement | null>(null);

  const removeDragImage = () => {
    dragImageRef.current?.remove();
    dragImageRef.current = null;
  };

  useEffect(() => {
    setBuildingFieldSlots(initialBuildingFieldSlots);
    setSelectedBuildingFieldId(null);
  }, [initialBuildingFieldSlots]);

  useEffect(() => {
    return () => {
      dragImageRef.current?.remove();
      dragImageRef.current = null;
    };
  }, []);

  const persistBuildingFieldSlots = async (slots: BuildingFieldSlots) => {
    await rearrangeBuildingFieldsAsync(
      villageViewBuildingFieldIds.map((buildingFieldId) => ({
        buildingFieldId,
        buildingId: slots[buildingFieldId],
      })),
    );
  };

  const hasChanges = !areBuildingFieldSlotsEqual(
    initialBuildingFieldSlots,
    buildingFieldSlots,
  );

  const moveBuildingField = (
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
  };

  const handleBuildingFieldClick = (buildingFieldId: BuildingField['id']) => {
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

    moveBuildingField(selectedBuildingFieldId, buildingFieldId);
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

    removeDragImage();

    const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
    const { width, height } = event.currentTarget.getBoundingClientRect();

    dragImage.style.position = 'fixed';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    dragImage.style.width = `${width}px`;
    dragImage.style.height = `${height}px`;
    dragImage.style.pointerEvents = 'none';
    dragImage.style.opacity = '1';
    dragImage.style.transform = 'none';

    document.body.append(dragImage);
    event.dataTransfer.setDragImage(dragImage, width / 2, height / 2);
    dragImageRef.current = dragImage;
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

  const handleDrop = (
    event: DragEvent<HTMLButtonElement>,
    targetBuildingFieldId: BuildingField['id'],
  ) => {
    event.preventDefault();

    const sourceBuildingFieldId =
      draggedBuildingFieldId ??
      Number(event.dataTransfer.getData('text/plain'));

    setDraggedBuildingFieldId(null);
    setDragOverBuildingFieldId(null);
    removeDragImage();

    if (
      !sourceBuildingFieldId ||
      sourceBuildingFieldId === targetBuildingFieldId ||
      isLockedBuildingField(sourceBuildingFieldId) ||
      isLockedBuildingField(targetBuildingFieldId)
    ) {
      return;
    }

    moveBuildingField(sourceBuildingFieldId, targetBuildingFieldId);
  };

  const handleDragEnd = () => {
    setDraggedBuildingFieldId(null);
    setDragOverBuildingFieldId(null);
    removeDragImage();
  };

  const handleReset = () => {
    setBuildingFieldSlots(initialBuildingFieldSlots);
    setSelectedBuildingFieldId(null);
    setDraggedBuildingFieldId(null);
    setDragOverBuildingFieldId(null);
  };

  const handleConfirm = async () => {
    await persistBuildingFieldSlots(buildingFieldSlots);
    toast.success(t('Buildings rearranged'));
    await navigate('..', { relative: 'path' });
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
        <div className="relative aspect-16/10 w-full max-w-full lg:max-w-5xl overflow-hidden non-selectable non-selectable">
          {villageViewBuildingFieldIds.map((buildingFieldId) => {
            const buildingId = buildingFieldSlots[buildingFieldId];
            const isLocked = isLockedBuildingField(buildingFieldId);
            const isDragged = draggedBuildingFieldId === buildingFieldId;
            const isDragOver = dragOverBuildingFieldId === buildingFieldId;
            const isSelected = selectedBuildingFieldId === buildingFieldId;
            const positioningStyles =
              buildingFieldStyles[`building-field--${buildingFieldId}`];

            return (
              <div
                key={buildingFieldId}
                className={clsx(
                  positioningStyles,
                  'absolute non-selectable -translate-x-1/2 -translate-y-1/2 flex items-center justify-center',
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
                    'touch-manipulation non-selectable',
                    buildingId
                      ? 'relative size-8 lg:size-12 rounded-full focus:outline-hidden focus:ring-2 focus:ring-black/80 dark:focus:ring-ring border border-black/10 dark:border-border'
                      : 'w-8 lg:w-16 h-4 lg:h-10 bg-green-900/50 hover:bg-green-800/70 cursor-pointer',
                    buildingId !== null &&
                      !isLocked &&
                      !isRearrangingBuildingFields &&
                      'cursor-grab active:cursor-grabbing',
                    isLocked && 'cursor-not-allowed opacity-70',
                    isDragged && 'opacity-40',
                    (isDragOver || isSelected) && 'ring-2 ring-ring bg-accent',
                  )}
                >
                  {buildingId && (
                    <span className="inline-flex non-selectable flex-col lg:flex-row text-center text-3xs md:text-2xs px-0.5 md:px-1 z-10 bg-background border border-border rounded-xs whitespace-nowrap absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[calc(50%+20px)] lg:top-[calc(50%+25px)]">
                      {t(`BUILDINGS.${buildingId}.NAME`)}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-4 justify-end">
          <Button
            size="fit"
            variant="outline"
            disabled={!hasChanges || isRearrangingBuildingFields}
            onClick={handleReset}
          >
            {t('Reset')}
          </Button>
          <Button
            size="fit"
            disabled={!hasChanges || isRearrangingBuildingFields}
            onClick={handleConfirm}
          >
            {t('Confirm changes')}
          </Button>
        </div>
      </SectionContent>
    </Section>
  );
};
