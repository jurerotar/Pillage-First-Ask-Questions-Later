import { use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaLock } from 'react-icons/fa6';
import { ImHammer } from 'react-icons/im';
import { IoIosArrowRoundForward } from 'react-icons/io';
import { LuConstruction } from 'react-icons/lu';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCancelConstruction } from 'app/(game)/(village-slug)/hooks/use-cancel-construction';
import { useScheduledBuildingUpgrades } from 'app/(game)/(village-slug)/hooks/use-scheduled-building-upgrades';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import {
  CurrentVillageBuildingQueueContext,
  getBuildingUpgradeQueueEntryKey,
} from 'app/(game)/(village-slug)/providers/current-village-building-queue-context';
import { Button } from 'app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const VillageConstructionTable = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { buildingUpgradeEvents } = use(CurrentVillageBuildingQueueContext);

  const totalSlotsCount = 5;
  const availableSlotsCount = tribe === 'romans' ? 2 : 1;

  const slots = useMemo(() => {
    const emptySlotsCount = Math.max(
      0,
      totalSlotsCount - buildingUpgradeEvents.length,
    );
    const base = buildingUpgradeEvents.map((event) => ({
      type: 'building' as const,
      event,
    }));
    const empties = Array.from({ length: emptySlotsCount }, (_, i) => {
      const slotIndex = buildingUpgradeEvents.length + i;
      const isFree = slotIndex < availableSlotsCount;
      return {
        type: 'empty' as const,
        id: `empty-slot-${slotIndex}`,
        status: isFree ? 'free' : ('locked' as const),
      };
    });
    return [...base, ...empties];
  }, [buildingUpgradeEvents, availableSlotsCount]);

  const { mutate: cancelConstruction } = useCancelConstruction();
  const { cancelScheduledBuildingUpgrade } = useScheduledBuildingUpgrades();

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Building')}</TableHeaderCell>
            <TableHeaderCell>{t('Level')}</TableHeaderCell>
            <TableHeaderCell>{t('Time remaining')}</TableHeaderCell>
            <TableHeaderCell>{t('Actions')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.slice(0, totalSlotsCount).map((slot) => {
            if (slot.type === 'building') {
              const isScheduled =
                slot.event.type === 'scheduledBuildingUpgrade';

              return (
                <TableRow key={getBuildingUpgradeQueueEntryKey(slot.event)}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <LuConstruction className="text-lg text-gray-500" />
                      <b>{t(`BUILDINGS.${slot.event.buildingId}.NAME`)}</b>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {slot.event.level - 1}{' '}
                    <IoIosArrowRoundForward className="inline" />{' '}
                    {slot.event.level}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {'startsAt' in slot.event ? (
                      <Countdown
                        endsAt={slot.event.startsAt + slot.event.duration}
                      />
                    ) : (
                      t('In queue')
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => {
                        if (isScheduled) {
                          cancelScheduledBuildingUpgrade({
                            scheduledUpgradeId: slot.event.id,
                          });
                          return;
                        }

                        cancelConstruction({ eventId: slot.event.id });
                      }}
                      size="fit"
                    >
                      {t('Cancel')}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            }

            return (
              <TableRow
                key={slot.id}
                className="opacity-75"
              >
                <TableCell>
                  <span className="inline-flex items-center gap-2 text-gray-500">
                    {slot.status === 'free' ? (
                      <ImHammer className="text-base" />
                    ) : (
                      <FaLock className="text-base" />
                    )}
                    <span>{t('Empty')}</span>
                  </span>
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
