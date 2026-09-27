import { clsx } from 'clsx';
import { use, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  calculateHuntersLodgeHuntCost,
  calculateHuntersLodgeHuntDuration,
  getHunterLodgeCatchableAnimals,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { formatNumber } from '@pillage-first/utils/format';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/bookmark';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useDeveloperSettings } from 'app/(game)/(village-slug)/hooks/use-developer-settings';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { CurrentVillageLiveResourcesContext } from 'app/(game)/(village-slug)/providers/current-village-live-resources-context';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { currentVillageCacheKey } from 'app/(game)/constants/query-keys';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';
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

type WheatCostProps = {
  amount: number;
  availableAmount?: number;
};

const WheatCost = ({ amount, availableAmount }: WheatCostProps) => {
  const isMissing = availableAmount !== undefined && amount > availableAmount;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1',
        isMissing && 'text-destructive',
      )}
    >
      <Icon
        type="wheat"
        className="size-5"
      />
      {formatNumber(amount)}
    </span>
  );
};

type HuntingPartyTierTableProps = {
  level: number;
  selectedPartyLevel: number | null;
  onSelectPartyLevel: (partyLevel: number) => void;
};

const HuntingPartyTierTable = ({
  level,
  selectedPartyLevel,
  onSelectPartyLevel,
}: HuntingPartyTierTableProps) => {
  const { t } = useTranslation();
  const { serverSpeed } = useServer();
  const currentResources = use(CurrentVillageLiveResourcesContext);
  const { developerSettings } = useDeveloperSettings();
  const { isFreeHuntingPartiesEnabled, isInstantUnitTravelEnabled } =
    developerSettings;
  const eligibleParties = huntingPartyTiers.filter(
    (party) => party.level <= level,
  );

  return (
    <OverflowContainer>
      <RadioGroup
        value={selectedPartyLevel?.toString()}
        onValueChange={(value) => onSelectPartyLevel(Number(value))}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell className="w-10">
                <span className="sr-only">{t('Selection')}</span>
              </TableHeaderCell>
              <TableHeaderCell>{t('Party')}</TableHeaderCell>
              <TableHeaderCell>{t('Animals')}</TableHeaderCell>
              <TableHeaderCell>{t('Cost')}</TableHeaderCell>
              <TableHeaderCell>{t('Duration')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eligibleParties.map((party) => {
              const wheatCost = isFreeHuntingPartiesEnabled
                ? 0
                : calculateHuntersLodgeHuntCost(party.level)[3];
              const duration = isInstantUnitTravelEnabled
                ? 0
                : calculateHuntersLodgeHuntDuration(party.level, serverSpeed);
              const isSelected = selectedPartyLevel === party.level;
              const radioValue = party.level.toString();

              return (
                <TableRow
                  key={party.level}
                  aria-selected={isSelected}
                  className={clsx(
                    'cursor-pointer',
                    isSelected && 'bg-muted hover:bg-muted',
                  )}
                  onClick={() => onSelectPartyLevel(party.level)}
                >
                  <TableCell>
                    <RadioGroupItem
                      value={radioValue}
                      aria-label={t('{{partyName}} hunting party', {
                        partyName: t(party.name),
                      })}
                    />
                  </TableCell>
                  <TableCell>{t(party.name)}</TableCell>
                  <TableCell>
                    <EligibleAnimals level={party.level} />
                  </TableCell>
                  <TableCell>
                    <WheatCost
                      amount={wheatCost}
                      availableAmount={currentResources.wheat}
                    />
                  </TableCell>
                  <TableCell>{formatTime(duration)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </RadioGroup>
    </OverflowContainer>
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
                  <WheatCost
                    amount={
                      isFreeHuntingPartiesEnabled
                        ? 0
                        : calculateHuntersLodgeHuntCost(
                            event.huntingPartyLevel,
                          )[3]
                    }
                  />
                </TableCell>
                <TableCell>
                  <Countdown endsAt={event.resolvesAt} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </OverflowContainer>
  );
};

export const HuntersLodgeHuntingParty = () => {
  const { t } = useTranslation();
  const { buildingField } = use(BuildingFieldContext);
  const { eventsByType } = useEventsByType('huntersLodgeHunt');
  const { createEvent: createHuntersLodgeHunt } =
    useCreateEvent('huntersLodgeHunt');
  const [selectedPartyLevel, setSelectedPartyLevel] = useState<number | null>(
    null,
  );

  const level = buildingField?.level ?? 0;
  const isHuntingPartyActive = eventsByType.length > 0;

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="hunting-party" />
        <InformationPopover ariaLabel={t('Hunting party')}>
          <Text>
            {t(
              "Hunters periodically set out from your village. A successful hunt captures one eligible animal and brings it back to this village. By upgrading Hunter's Lodge, you can start capturing stronger animals.",
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Hunting party')}</Text>
      </SectionContent>
      <SectionContent>
        {isHuntingPartyActive && (
          <ActiveHuntingPartyTable events={eventsByType} />
        )}
        {!isHuntingPartyActive && (
          <div className="flex flex-col gap-3">
            <HuntingPartyTierTable
              level={level}
              selectedPartyLevel={selectedPartyLevel}
              onSelectPartyLevel={setSelectedPartyLevel}
            />
            <Button
              disabled={selectedPartyLevel == null}
              size="fit"
              className="self-end"
              onClick={() => {
                if (selectedPartyLevel == null) {
                  return;
                }

                createHuntersLodgeHunt({
                  huntingPartyLevel: selectedPartyLevel,
                  cachesToClearImmediately: [[currentVillageCacheKey]],
                });
              }}
            >
              {t('Start')}
            </Button>
          </div>
        )}
      </SectionContent>
    </Section>
  );
};
