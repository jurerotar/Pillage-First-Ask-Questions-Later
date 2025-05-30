import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/ui/table';
import { useOasis } from 'app/(game)/(village-slug)/hooks/use-oasis';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Icon } from 'app/components/icon';
import clsx from 'clsx';
import type { OccupiedOasisTile } from 'app/interfaces/models/game/tile';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { Link } from 'react-router';
import {
  BuildingSection,
  BuildingSectionContent,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/components/building-layout';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { parseCoordinatesFromTileId } from 'app/utils/map-tile';

type OccupiedOasisRowProps = {
  occupiedOasis: OccupiedOasisTile | undefined;
  heroMansionLevel: number;
};

const OccupiedOasisRow: React.FC<OccupiedOasisRowProps> = ({ occupiedOasis, heroMansionLevel }) => {
  const { t } = useTranslation();
  const { mapPath } = useGameNavigation();

  const hasOccupiedOasis = !!occupiedOasis;

  if (hasOccupiedOasis) {
    const { x, y } = parseCoordinatesFromTileId(occupiedOasis.id);

    return (
      <TableRow>
        <TableCell>
          <Link to={`${mapPath}?x=${x}&y=${y}`}>
            {x}, {y}
          </Link>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {occupiedOasis.ORB.map(({ resource, bonus }, index) => (
            <span
              className={clsx('inline-flex gap-1', index > 0 && 'ml-2')}
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
        <TableCell>/</TableCell>
      </TableRow>
    );
  }

  // TODO: Maybe show a different text depending on whether player already has 10/15/20 Hero's mansion
  return (
    <TableRow>
      <TableCell
        className="text-left"
        colSpan={3}
      >
        <Text>{t("Next oasis available at Hero's mansion level {{heroMansionLevel}}", { heroMansionLevel })}</Text>
      </TableCell>
    </TableRow>
  );
};

export const HerosMansionOasis = () => {
  const { t } = useTranslation();
  const { mapPath } = useGameNavigation();
  const { oasisOccupiedByCurrentVillage, occupiableOasisInRange } = useOasis();

  const [firstOccupiedOasis, secondOccupiedOasis, thirdOccupiedOasis] = oasisOccupiedByCurrentVillage;

  return (
    <BuildingSection>
      <BuildingSectionContent>
        <Text as="h2">{t('Oasis management')}</Text>
        <Text as="p">
          {t(
            "A village can occupy an oasis if it attacks the oasis and subdues all the animals that are present. The attack must also include a hero, who must survive the attack. The oasis will only be captured if there is a level 10, 15 or 20 hero's mansion built in the attacking village, and can still conquer an oasis (1 on level 10, 2 on level 15 and 3 on level 20).",
          )}
        </Text>
      </BuildingSectionContent>
      <Tabs>
        <TabList>
          <Tab>{t('Occupied oasis')}</Tab>
          <Tab>{t('Oasis within reach')}</Tab>
        </TabList>
        <TabPanel>
          <BuildingSectionContent>
            <Text as="h2">{t('Occupied oasis')}</Text>
            <div className="overflow-x-scroll scrollbar-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>{t('Coordinates')}</TableHeaderCell>
                    <TableHeaderCell>{t('Resources')}</TableHeaderCell>
                    <TableHeaderCell>{t('Actions')}</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <OccupiedOasisRow
                    occupiedOasis={firstOccupiedOasis}
                    heroMansionLevel={10}
                  />
                  <OccupiedOasisRow
                    occupiedOasis={secondOccupiedOasis}
                    heroMansionLevel={15}
                  />
                  <OccupiedOasisRow
                    occupiedOasis={thirdOccupiedOasis}
                    heroMansionLevel={20}
                  />
                </TableBody>
              </Table>
            </div>
          </BuildingSectionContent>
        </TabPanel>
        <TabPanel>
          <BuildingSectionContent>
            <Text as="h2">{t('Oasis within reach')}</Text>
            <div className="overflow-x-scroll scrollbar-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>{t('Owner')}</TableHeaderCell>
                    <TableHeaderCell>{t('Coordinates')}</TableHeaderCell>
                    <TableHeaderCell>{t('Resources')}</TableHeaderCell>
                    <TableHeaderCell>{t('Actions')}</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {occupiableOasisInRange.map((tile) => {
                    const { x, y } = parseCoordinatesFromTileId(tile.id);
                    return (
                      <TableRow key={tile.id}>
                        <TableCell>/</TableCell>
                        <TableCell>
                          <Link to={`${mapPath}?x=${x}&y=${y}`}>
                            {x}, {y}
                          </Link>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {tile.ORB.map(({ resource, bonus }, index) => (
                            <span
                              className={clsx('inline-flex gap-1', index > 0 && 'ml-2')}
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
                        <TableCell>/</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </BuildingSectionContent>
        </TabPanel>
      </Tabs>
    </BuildingSection>
  );
};
