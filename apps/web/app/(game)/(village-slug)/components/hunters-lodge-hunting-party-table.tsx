import { useTranslation } from 'react-i18next';
import {
  calculateHuntersLodgeHuntCost,
  getHunterLodgeCatchableAnimals,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import { OverflowContainer } from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const huntingPartyTiers = [
  { level: 1, name: 'Small' },
  { level: 2, name: 'Medium' },
  { level: 3, name: 'Large' },
  { level: 4, name: 'Great' },
  { level: 5, name: 'Grand' },
];

type EligibleAnimalsProps = {
  level: number;
};

const EligibleAnimals = ({ level }: EligibleAnimalsProps) => {
  return (
    <div className="grid grid-cols-4 gap-y-2 justify-center">
      {getHunterLodgeCatchableAnimals(level).map((unitId) => (
        <Icon
          key={unitId}
          className="size-5"
          type={unitIdToUnitIconMapper(unitId)}
        />
      ))}
    </div>
  );
};

export const HuntersLodgeHuntingPartyTable = () => {
  const { t } = useTranslation();
  const { eventsByType: huntingPartyEvents } =
    useEventsByType('huntersLodgeHunt');
  const { developerSettings } = useDeveloperSettings();
  const { isFreeHuntingPartiesEnabled } = developerSettings;

  return (
    <OverflowContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Party')}</TableHeaderCell>
            <TableHeaderCell>{t('Animals')}</TableHeaderCell>
            <TableHeaderCell>{t('Cost')}</TableHeaderCell>
            <TableHeaderCell>{t('Returns in')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {huntingPartyEvents.map((event) => {
            const party = huntingPartyTiers.find(
              ({ level }) => level === event.huntingPartyLevel,
            );

            return (
              <TableRow key={event.id}>
                <TableCell>{t(party?.name ?? 'Hunting party')}</TableCell>
                <TableCell>
                  <EligibleAnimals level={event.huntingPartyLevel} />
                </TableCell>
                <TableCell>
                  <span className="inline-flex gap-2">
                    <Resources
                      resources={
                        isFreeHuntingPartiesEnabled
                          ? [0, 0, 0, 0]
                          : calculateHuntersLodgeHuntCost(
                              event.huntingPartyLevel,
                            )
                      }
                    />
                  </span>
                </TableCell>
                <TableCell>
                  <Countdown endsAt={event.resolvesAt} />
                </TableCell>
              </TableRow>
            );
          })}
          {huntingPartyEvents.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                {t('No hunting parties are currently active')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </OverflowContainer>
  );
};
