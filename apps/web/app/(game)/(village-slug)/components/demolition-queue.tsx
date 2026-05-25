import { type PropsWithChildren, use } from 'react';
import { useTranslation } from 'react-i18next';
import { GiDemolish } from 'react-icons/gi';
import { IoIosArrowRoundForward } from 'react-icons/io';
import { MdCancel } from 'react-icons/md';
import { type PlacesType, Tooltip } from 'react-tooltip';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useCancelDemolition } from 'app/(game)/(village-slug)/hooks/use-cancel-demolition';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { useDialog } from 'app/hooks/use-dialog';

type DemolitionQueueItemProps = {
  buildingEvent: BuildingEvent;
  tooltipPosition: PlacesType;
};

const DemolitionQueueItem = ({
  buildingEvent,
  tooltipPosition,
}: PropsWithChildren<DemolitionQueueItemProps>) => {
  const { t } = useTranslation();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const { mutate: cancelDemolition } = useCancelDemolition();
  const {
    isOpen: isCancelDemolitionDialogOpen,
    openModal,
    closeModal,
  } = useDialog();

  const tooltipId = `demolition-tooltip-${buildingEvent.id}`;
  const tooltipKey = isWiderThanLg
    ? 'is-wider-than-lg'
    : 'is-not-wider-than-lg';

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        className="flex flex-col relative cursor-pointer"
      >
        <GiDemolish className="text-2xl lg:text-3xl text-muted-foreground bg-background px-2.5 pb-4 pt-1 box-content border border-border rounded-xs transition-colors" />
        <Countdown
          className="absolute bottom-0 left-0 text-2xs w-full leading-none bg-background border border-border text-center transition-colors"
          endsAt={buildingEvent.startsAt + buildingEvent.duration}
        />
      </div>

      <Tooltip
        key={tooltipKey}
        id={tooltipId}
        clickable
        className="z-20! rounded-xs! px-2! py-1! bg-background! w-fit! text-foreground! border border-border transition-colors"
        classNameArrow="border-r border-b border-border"
        place={tooltipPosition}
        {...(isWiderThanLg && {
          isOpen: true,
        })}
        {...(!isWiderThanLg && {
          openOnClick: true,
          place: 'top-start',
        })}
      >
        <div className="flex flex-col gap-2">
          <div className="flex md:hidden border-b border-border pb-1 text-sm">
            <b>{t('Demolition')}</b>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center">
              <GiDemolish className="text-xl lg:text-2xl text-muted-foreground box-content transition-colors" />
            </div>
            <div className="flex flex-col px-2 border-x border-border">
              <span className="inline-flex gap-1 whitespace-nowrap">
                <b>{t(`BUILDINGS.${buildingEvent.buildingId}.NAME`)}</b>
                <span className="inline-flex items-center text-sm">
                  ({buildingEvent.previousLevel} <IoIosArrowRoundForward />{' '}
                  {buildingEvent.level})
                </span>
              </span>
              <span className="text-sm">
                <Countdown
                  endsAt={buildingEvent.startsAt + buildingEvent.duration}
                />
              </span>
            </div>
            <div className="flex items-center">
              <button
                aria-label={t('Cancel demolition')}
                onClick={openModal}
                type="button"
              >
                <MdCancel className="text-xl lg:text-2xl text-red-400 box-content" />
              </button>
            </div>
          </div>
        </div>
      </Tooltip>

      <Dialog
        open={isCancelDemolitionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
          } else {
            openModal();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Cancel demolition')}</DialogTitle>
            <DialogDescription>
              {t('Are you sure you want to cancel this demolition?')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={closeModal}
            >
              {t('Cancel')}
            </Button>
            <Button
              onClick={() => {
                cancelDemolition();
                closeModal();
              }}
            >
              {t('Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const DemolitionQueueContent = () => {
  const { buildingDowngradeEvents } = use(CurrentVillageBuildingQueueContext);

  if (buildingDowngradeEvents.length === 0) {
    return null;
  }

  return (
    <ul className="flex lg:flex-col gap-1 bg-background/80 p-1 shadow-xs border-border rounded-l-none rounded-xs items-center transition-all">
      {buildingDowngradeEvents.map((event) => (
        <li key={event.id}>
          <DemolitionQueueItem
            tooltipPosition="right-start"
            buildingEvent={event}
          />
        </li>
      ))}
    </ul>
  );
};

export const DemolitionQueue = () => {
  return <DemolitionQueueContent />;
};
