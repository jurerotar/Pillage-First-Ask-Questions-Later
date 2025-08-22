import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useOasis } from 'app/(game)/(village-slug)/hooks/use-oasis';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import type { OasisTile } from 'app/interfaces/models/game/tile';
import clsx from 'clsx';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { Button } from 'app/components/ui/button';
import type { OccupiableOasisInRangeDTO } from 'app/interfaces/dtos';
import { usePlayerTroops } from 'app/(game)/(village-slug)/hooks/use-player-troops';

type OccupiedOasisRowProps = {
  occupiedOasis: OasisTile | undefined;
  heroMansionLevel: number;
  heroMansionLevelRequirement: number;
};

const OccupiedOasisRow: React.FC<OccupiedOasisRowProps> = ({
  occupiedOasis,
  heroMansionLevel,
  heroMansionLevelRequirement,
}) => {
  const { t } = useTranslation();
  const { abandonOasis } = useOasis();

  const hasOccupiedOasis = !!occupiedOasis;

  if (hasOccupiedOasis) {
    return (
      <TableRow>
        <TableCell>
          <Text>
            {/*// TODO: Re-enable this when SQLite migration is finished */}
            {/*<Link*/}
            {/*  className="underline"*/}
            {/*  to={`${mapPath}?x=${x}&y=${y}`}*/}
            {/*>*/}
            {/*  {x}, {y}*/}
            {/*</Link>*/}/
          </Text>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {occupiedOasis.ORB.map(({ resource, bonus }, index) => (
            <span
              className={clsx(
                'inline-flex items-center gap-1',
                index > 0 && 'ml-2',
              )}
              key={resource}
            >
              <Icon
                type={resource}
                className="flex size-5"
              />
              {bonus}
            </span>
          ))}
        </TableCell>
        <TableCell>
          <Button
            size="fit"
            onClick={() => abandonOasis({ oasisId: occupiedOasis.id })}
          >
            {t('Abandon oasis')}
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell
        className="text-left"
        colSpan={3}
      >
        <Text>
          {heroMansionLevel >= heroMansionLevelRequirement
            ? t('Free oasis slot')
            : t(
                "Next oasis slot available at Hero's mansion level {{heroMansionLevelRequirement}}",
                {
                  heroMansionLevelRequirement,
                },
              )}
        </Text>
      </TableCell>
    </TableRow>
  );
};

type OccupiableOasisRowActionsProps = {
  occupiableOasisDTO: OccupiableOasisInRangeDTO;
  freeSlots: number;
};

const OccupiableOasisRowActions: React.FC<OccupiableOasisRowActionsProps> = ({
  occupiableOasisDTO,
  freeSlots,
}) => {
  const { oasis, player } = occupiableOasisDTO;

  const { t } = useTranslation();
  const { occupyOasis } = useOasis();
  const { playerTroops } = usePlayerTroops();
  const { currentVillage } = useCurrentVillage();

  const isHeroAvailable = !!playerTroops.find(
    ({ unitId, tileId, source }) =>
      unitId === 'HERO' &&
      tileId === currentVillage.tileId &&
      source === currentVillage.tileId,
  );

  const isOccupiedByPlayer = player !== null && player.id === 0;

  if (isOccupiedByPlayer) {
    return <Text>{t('You already occupy this oasis')}</Text>;
  }

  if (!isHeroAvailable) {
    return <Text>{t('Hero is not available')}</Text>;
  }

  if (freeSlots < 1) {
    return <Text>{t('No free slots available')}</Text>;
  }

  return (
    <Button
      size="fit"
      onClick={() => occupyOasis({ oasisId: oasis.id })}
    >
      {t('Occupy')}
    </Button>
  );
};

type OccupiableOasisRowProps = {
  occupiableOasisDTO: OccupiableOasisInRangeDTO;
  freeSlots: number;
};

const OccupiableOasisRow: React.FC<OccupiableOasisRowProps> = ({
  occupiableOasisDTO,
  freeSlots,
}) => {
  const { oasis, village, player } = occupiableOasisDTO;

  const { mapPath } = useGameNavigation();

  const oasisCoordinates = oasis.coordinates;
  const villageCoordinates = village === null ? null : village.coordinates;

  return (
    <TableRow key={oasis.id}>
      <TableCell>
        <Text>{player !== null ? player.name : '/'}</Text>
      </TableCell>
      <TableCell>
        <Text>
          {village !== null && (
            <Link
              className="underline"
              to={`${mapPath}?x=${villageCoordinates!.x}&y=${villageCoordinates!.y}`}
            >
              {village.name} ({villageCoordinates!.x}, {villageCoordinates!.y})
            </Link>
          )}
          {village === null && '/'}
        </Text>
      </TableCell>
      <TableCell>
        <Text>
          <Link
            className="underline"
            to={`${mapPath}?x=${oasisCoordinates.x}&y=${oasisCoordinates.y}`}
          >
            {oasisCoordinates.x}, {oasisCoordinates.y}
          </Link>
        </Text>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {oasis.ORB.map(({ resource, bonus }, index) => (
          <span
            className={clsx(
              'inline-flex items-center gap-1',
              index > 0 && 'ml-2',
            )}
            key={resource}
          >
            <Icon
              type={resource}
              className="flex size-5"
            />
            {bonus}
          </span>
        ))}
      </TableCell>
      <TableCell>
        <OccupiableOasisRowActions
          occupiableOasisDTO={occupiableOasisDTO}
          freeSlots={freeSlots}
        />
      </TableCell>
    </TableRow>
  );
};

export const HerosMansionOasis = () => {
  const { t } = useTranslation();
  const { occupiableOasisInRange } = useOasis();
  const { currentVillage } = useCurrentVillage();

  const heroMansionLevel =
    currentVillage.buildingFields.find(
      ({ buildingId }) => buildingId === 'HEROS_MANSION',
    )?.level ?? 0;

  const oasisOccupiedByCurrentVillage = occupiableOasisInRange.filter(
    ({ village }) => {
      return village?.id === currentVillage.id;
    },
  );

  const [firstOccupiedOasis, secondOccupiedOasis, thirdOccupiedOasis] =
    oasisOccupiedByCurrentVillage;

  const availableSlots = (() => {
    if (heroMansionLevel === 20) {
      return 3;
    }

    if (heroMansionLevel >= 15) {
      return 2;
    }

    if (heroMansionLevel >= 10) {
      return 1;
    }

    return 0;
  })();

  const occupiedSlots = oasisOccupiedByCurrentVillage.length;

  const freeSlots = availableSlots - occupiedSlots;

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="oasis" />
        <Text as="h2">{t('Oasis management')}</Text>
        <Text>
          {t(
            "A village can occupy an oasis if it attacks the oasis and subdues all the animals that are present. The attack must also include a hero, who must survive the attack. The oasis will only be captured if there is a level 10, 15 or 20 hero's mansion built in the attacking village, and can still have an empty oasis slot (1 on level 10, 2 on level 15 and 3 on level 20).",
          )}
        </Text>
      </SectionContent>
      <Tabs>
        <TabList>
          <Tab>
            <Text>{t('Occupied oasis')}</Text>
          </Tab>
          <Tab>
            <Text>{t('Oasis within reach')}</Text>
          </Tab>
        </TabList>
        <TabPanel>
          <SectionContent>
            <Text as="h2">{t('Occupied oasis')}</Text>
            <Text>
              {t(
                'Occupied oasis provide a resource production bonus of either 25% or 50% to one or multiple resources. If you choose to abandon an oasis, the abandoned oasis will start to regenerate animals.',
              )}
            </Text>
            <div className="overflow-x-scroll scrollbar-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>
                      <Text>{t('Coordinates')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Resources')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Actions')}</Text>
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <OccupiedOasisRow
                    occupiedOasis={firstOccupiedOasis?.oasis}
                    heroMansionLevel={heroMansionLevel}
                    heroMansionLevelRequirement={10}
                  />
                  <OccupiedOasisRow
                    occupiedOasis={secondOccupiedOasis?.oasis}
                    heroMansionLevel={heroMansionLevel}
                    heroMansionLevelRequirement={15}
                  />
                  <OccupiedOasisRow
                    occupiedOasis={thirdOccupiedOasis?.oasis}
                    heroMansionLevel={heroMansionLevel}
                    heroMansionLevelRequirement={20}
                  />
                </TableBody>
              </Table>
            </div>
          </SectionContent>
        </TabPanel>
        <TabPanel>
          <SectionContent>
            <Text as="h2">{t('Oasis within reach')}</Text>
            <Text>
              {t(
                'For an oasis to be occupiable, it has to be in a radius of 3 squares around your village. To successfully occupy an oasis, you have to have an empty oasis slot available.',
              )}
            </Text>
            <div className="overflow-x-scroll scrollbar-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>
                      <Text>{t('Player')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Village')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Coordinates')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Resources')}</Text>
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Text>{t('Actions')}</Text>
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {occupiableOasisInRange.map((occupiableOasisDTO) => (
                    <OccupiableOasisRow
                      key={occupiableOasisDTO.oasis.id}
                      freeSlots={freeSlots}
                      occupiableOasisDTO={occupiableOasisDTO}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionContent>
        </TabPanel>
      </Tabs>
    </Section>
  );
};
