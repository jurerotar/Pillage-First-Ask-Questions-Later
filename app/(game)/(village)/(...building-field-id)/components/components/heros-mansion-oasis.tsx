import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/tables/table';
import { useOasis } from 'app/(game)/hooks/use-oasis';
import { useGameNavigation } from 'app/(game)/hooks/routes/use-game-navigation';
import { Icon } from 'app/components/icon';
import clsx from 'clsx';
import type { OccupiedOasisTile } from 'app/interfaces/models/game/tile';
import type React from 'react';
import { Text } from 'app/components/text';
import { LinkWithState } from 'app/components/link-with-state';
import { Trans } from '@lingui/react/macro';

type OccupiedOasisRowProps = {
  occupiedOasis: OccupiedOasisTile | undefined;
  heroMansionLevel: number;
};

const OccupiedOasisRow: React.FC<OccupiedOasisRowProps> = ({ occupiedOasis, heroMansionLevel }) => {
  const { mapPath } = useGameNavigation();

  const hasOccupiedOasis = !!occupiedOasis;

  if (hasOccupiedOasis) {
    const {
      coordinates: { x, y },
      oasisResourceBonus,
    } = occupiedOasis;

    return (
      <TableRow>
        <TableCell>
          <LinkWithState to={`${mapPath}?x=${x}&y=${y}`}>
            {x}, {y}
          </LinkWithState>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {oasisResourceBonus.map(({ resource, bonus }, index) => (
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
        <Text>
          <Trans>Next oasis will be occupiable at level {heroMansionLevel}.</Trans>
        </Text>
      </TableCell>
    </TableRow>
  );
};

export const HerosMansionOasis = () => {
  const { mapPath } = useGameNavigation();
  const { oasisOccupiedByCurrentVillage, oasisTilesInRange } = useOasis();

  const [firstOccupiedOasis, secondOccupiedOasis, thirdOccupiedOasis] = oasisOccupiedByCurrentVillage;

  return (
    <article className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <Text as="h2">
          <Trans>Occupied oasis</Trans>
        </Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Trans>Coordinates</Trans>
              </TableHeaderCell>
              <TableHeaderCell>
                <Trans>Resources</Trans>
              </TableHeaderCell>
              <TableHeaderCell>
                <Trans>Actions</Trans>
              </TableHeaderCell>
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
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2">
          <Trans>Oasis within reach</Trans>
        </Text>
        <div className="overflow-x-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>
                  <Trans>Owner</Trans>
                </TableHeaderCell>
                <TableHeaderCell>
                  <Trans>Coordinates</Trans>
                </TableHeaderCell>
                <TableHeaderCell>
                  <Trans>Resources</Trans>
                </TableHeaderCell>
                <TableHeaderCell>
                  <Trans>Actions</Trans>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oasisTilesInRange.map((tile) => (
                <TableRow key={tile.id}>
                  <TableCell>/</TableCell>
                  <TableCell>
                    <LinkWithState to={`${mapPath}?x=${tile.coordinates.x}&y=${tile.coordinates.y}`}>
                      {tile.coordinates.x}, {tile.coordinates.y}
                    </LinkWithState>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {tile.oasisResourceBonus.map(({ resource, bonus }, index) => (
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
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </article>
  );
};
