import { use } from 'react';
import { useTranslation } from 'react-i18next';
import {
  calculateHuntersLodgeHuntCost,
  calculateHuntersLodgeHuntDuration,
  getHunterLodgeCatchableAnimals,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { currentVillageCacheKey } from 'app/(game)/constants/query-keys';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { formatTime } from 'app/utils/time';

// TODO: These aren't localized
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

type HuntingPartyTierTableProps = {
  level: number;
  onStartHunt: (partyLevel: number) => void;
};

const HuntingPartyTierTable = ({
  level,
  onStartHunt,
}: HuntingPartyTierTableProps) => {
  const { t } = useTranslation();
  const { serverSpeed } = useServer();
  const { developerSettings } = useDeveloperSettings();
  const { isFreeHuntingPartiesEnabled, isInstantUnitTravelEnabled } =
    developerSettings;
  const eligibleParties = huntingPartyTiers.filter(
    (party) => party.level <= level,
  );

  return (
    <div className="scrollbar-hidden overflow-x-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t('Party')}</TableHeaderCell>
            <TableHeaderCell>{t('Animals')}</TableHeaderCell>
            <TableHeaderCell>{t('Cost')}</TableHeaderCell>
            <TableHeaderCell>{t('Duration')}</TableHeaderCell>
            <TableHeaderCell>{t('Action')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eligibleParties.map((party) => {
            const cost = isFreeHuntingPartiesEnabled
              ? [0, 0, 0, 0]
              : calculateHuntersLodgeHuntCost(party.level);
            const duration = isInstantUnitTravelEnabled
              ? 0
              : calculateHuntersLodgeHuntDuration(party.level, serverSpeed);

            return (
              <TableRow key={party.level}>
                <TableCell>{t(party.name)}</TableCell>
                <TableCell>
                  <EligibleAnimals level={party.level} />
                </TableCell>
                <TableCell>
                  <span className="inline-flex gap-2">
                    <Resources resources={cost} />
                  </span>
                </TableCell>
                <TableCell>{formatTime(duration)}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => onStartHunt(party.level)}
                    size="fit"
                  >
                    {t('Start')}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

type ActiveHuntingPartyTableProps = {
  events: GameEvent<'huntersLodgeHunt'>[];
};

const ActiveHuntingPartyTable = ({ events }: ActiveHuntingPartyTableProps) => {
  const { t } = useTranslation();
  const { developerSettings } = useDeveloperSettings();
  const { isFreeHuntingPartiesEnabled } = developerSettings;

  return (
    <div className="scrollbar-hidden overflow-x-scroll">
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
          {events.map((event) => {
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
        </TableBody>
      </Table>
    </div>
  );
};

export const HuntersLodgeHuntingParty = () => {
  const { t } = useTranslation();
  const { buildingField } = use(BuildingFieldContext);
  const { eventsByType } = useEventsByType('huntersLodgeHunt');
  const { createEvent: createHuntersLodgeHunt } =
    useCreateEvent('huntersLodgeHunt');

  const level = buildingField?.level ?? 0;
  const isHuntingPartyActive = eventsByType.length > 0;

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="hunting-party" />
        <Text as="h2">{t('Hunting party')}</Text>
        <Text>
          {t(
            "Hunters periodically set out from your village. A successful hunt captures one eligible animal and brings it back to this village. By upgrading Hunter's Lodge, you can start capturing stronger animals.",
          )}
        </Text>
      </SectionContent>
      <SectionContent>
        {isHuntingPartyActive && (
          <ActiveHuntingPartyTable events={eventsByType} />
        )}
        {!isHuntingPartyActive && (
          <HuntingPartyTierTable
            level={level}
            onStartHunt={(huntingPartyLevel) => {
              createHuntersLodgeHunt({
                huntingPartyLevel,
                cachesToClearImmediately: [[currentVillageCacheKey]],
              });
            }}
          />
        )}
      </SectionContent>
    </Section>
  );
};
