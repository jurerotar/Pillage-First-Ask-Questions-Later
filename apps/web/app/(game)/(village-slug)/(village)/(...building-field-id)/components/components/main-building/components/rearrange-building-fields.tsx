import { clsx } from 'clsx';
import { type DragEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useDragImage } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/hooks/use-drag-image';
import { useRearrangeBuildingFields } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/hooks/use-rearrange-building-fields';
import {
  isSwappableBuildingField,
  villageViewBuildingFieldIds,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/utils/building-field-rearrangement';
import buildingFieldStyles from 'app/(game)/(village-slug)/(village)/components/building-field.module.scss';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';

type BuildingFieldSlot = {
  buildingId: Building['id'];
  sourceBuildingFieldId: BuildingField['id'];
} | null;
type BuildingFieldSlots = Partial<
  Record<BuildingField['id'], BuildingFieldSlot>
>;
type InteractionState = {
  draggedBuildingFieldId: BuildingField['id'] | null;
  dragOverBuildingFieldId: BuildingField['id'] | null;
  selectedBuildingFieldId: BuildingField['id'] | null;
};

const initialInteractionState: InteractionState = {
  draggedBuildingFieldId: null,
  dragOverBuildingFieldId: null,
  selectedBuildingFieldId: null,
};

const getBuildingFieldSlots = (
  buildingFields: BuildingField[],
): BuildingFieldSlots => {
  const buildingFieldsById = new Map(
    buildingFields.map((buildingField) => [buildingField.id, buildingField]),
  );

  return Object.fromEntries(
    villageViewBuildingFieldIds.map((buildingFieldId) => {
      const buildingField = buildingFieldsById.get(buildingFieldId);

      return [
        buildingFieldId,
        buildingField
          ? {
              buildingId: buildingField.buildingId,
              sourceBuildingFieldId: buildingField.id,
            }
          : null,
      ];
    }),
  ) as BuildingFieldSlots;
};

const isLockedBuildingField = (buildingFieldId: BuildingField['id']) => {
  return !isSwappableBuildingField(buildingFieldId);
};

const areBuildingFieldSlotsEqual = (
  firstSlots: BuildingFieldSlots,
  secondSlots: BuildingFieldSlots,
) => {
  return villageViewBuildingFieldIds.every(
    (buildingFieldId) =>
      firstSlots[buildingFieldId]?.buildingId ===
        secondSlots[buildingFieldId]?.buildingId &&
      firstSlots[buildingFieldId]?.sourceBuildingFieldId ===
        secondSlots[buildingFieldId]?.sourceBuildingFieldId,
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
  const [interaction, setInteraction] = useState(initialInteractionState);
  const {
    draggedBuildingFieldId,
    dragOverBuildingFieldId,
    selectedBuildingFieldId,
  } = interaction;
  const { removeDragImage, setDragImage } = useDragImage();

  useEffect(() => {
    setBuildingFieldSlots(initialBuildingFieldSlots);
    setInteraction(initialInteractionState);
  }, [initialBuildingFieldSlots]);

  const persistBuildingFieldSlots = async (slots: BuildingFieldSlots) => {
    await rearrangeBuildingFieldsAsync(
      villageViewBuildingFieldIds.map((buildingFieldId) => ({
        buildingFieldId,
        buildingId: slots[buildingFieldId]?.buildingId ?? null,
        sourceBuildingFieldId:
          slots[buildingFieldId]?.sourceBuildingFieldId ?? null,
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
      buildingFieldSlots[sourceBuildingFieldId] == null
    ) {
      return;
    }

    setBuildingFieldSlots((slots) => {
      if (slots[sourceBuildingFieldId] == null) {
        return slots;
      }

      return {
        ...slots,
        [sourceBuildingFieldId]: slots[targetBuildingFieldId] ?? null,
        [targetBuildingFieldId]: slots[sourceBuildingFieldId],
      };
    });
    setInteraction((state) => ({
      ...state,
      selectedBuildingFieldId: null,
    }));
  };

  const handleBuildingFieldClick = (buildingFieldId: BuildingField['id']) => {
    if (isLockedBuildingField(buildingFieldId) || isRearrangingBuildingFields) {
      return;
    }

    if (selectedBuildingFieldId === null) {
      if (buildingFieldSlots[buildingFieldId] !== null) {
        setInteraction((state) => ({
          ...state,
          selectedBuildingFieldId: buildingFieldId,
        }));
      }
      return;
    }

    if (selectedBuildingFieldId === buildingFieldId) {
      setInteraction((state) => ({
        ...state,
        selectedBuildingFieldId: null,
      }));
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

    setInteraction({
      draggedBuildingFieldId: buildingFieldId,
      dragOverBuildingFieldId: null,
      selectedBuildingFieldId: null,
    });
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(buildingFieldId));

    setDragImage(event.currentTarget, event.dataTransfer);
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
    setInteraction((state) => ({
      ...state,
      dragOverBuildingFieldId: buildingFieldId,
    }));
  };

  const handleDrop = (
    event: DragEvent<HTMLButtonElement>,
    targetBuildingFieldId: BuildingField['id'],
  ) => {
    event.preventDefault();

    const sourceBuildingFieldId =
      draggedBuildingFieldId ??
      Number(event.dataTransfer.getData('text/plain'));

    setInteraction((state) => ({
      ...state,
      draggedBuildingFieldId: null,
      dragOverBuildingFieldId: null,
    }));
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
    setInteraction((state) => ({
      ...state,
      draggedBuildingFieldId: null,
      dragOverBuildingFieldId: null,
    }));
    removeDragImage();
  };

  const handleReset = () => {
    setBuildingFieldSlots(initialBuildingFieldSlots);
    setInteraction(initialInteractionState);
  };

  const handleConfirm = async () => {
    try {
      await persistBuildingFieldSlots(buildingFieldSlots);
      toast.success(t('Buildings rearranged'));
      await navigate('..', { relative: 'path' });
    } catch {
      toast.error(t('Buildings could not be rearranged'));
    }
  };

  return (
    <Section>
      <SectionContent>
        <InformationPopover ariaLabel={t('Rearrange buildings')}>
          <Text>
            {t('Drag buildings between available village building sites.')}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Rearrange buildings')}</Text>
      </SectionContent>
      <SectionContent>
        <div className="relative aspect-16/10 w-full max-w-full lg:max-w-5xl overflow-hidden non-selectable">
          {villageViewBuildingFieldIds.map((buildingFieldId) => {
            const buildingId =
              buildingFieldSlots[buildingFieldId]?.buildingId ?? null;
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
                  onDragLeave={() =>
                    setInteraction((state) => ({
                      ...state,
                      dragOverBuildingFieldId: null,
                    }))
                  }
                  onDrop={(event) => handleDrop(event, buildingFieldId)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleBuildingFieldClick(buildingFieldId)}
                  data-building-field-id={buildingFieldId}
                  aria-label={
                    buildingId !== null
                      ? t(`BUILDINGS.${buildingId}.NAME`)
                      : t('Building site')
                  }
                  aria-disabled={isLocked || isRearrangingBuildingFields}
                  aria-pressed={isSelected}
                  className={clsx(
                    'touch-manipulation non-selectable',
                    buildingId !== null
                      ? 'relative size-8 lg:size-12 rounded-full focus:outline-hidden focus:ring-2 focus:ring-black/80 dark:focus:ring-ring border border-black/10 dark:border-border'
                      : 'w-8 lg:w-16 h-4 lg:h-10 [clip-path:ellipse(50%_50%_at_50%_50%)] bg-green-900/50 hover:bg-green-800/70 cursor-pointer',
                    buildingId !== null &&
                      !isLocked &&
                      !isRearrangingBuildingFields &&
                      'cursor-grab active:cursor-grabbing',
                    isLocked && 'cursor-not-allowed opacity-70',
                    isDragged && 'opacity-40',
                    (isDragOver || isSelected) && 'ring-2 ring-ring bg-accent',
                  )}
                >
                  {buildingId !== null && (
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
