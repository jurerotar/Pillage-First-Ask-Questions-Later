import { useArtifacts } from 'app/(game)/hooks/use-artifacts';
import { useWorldItems } from 'app/(game)/hooks/use-world-items';
import { useHero } from 'app/(game)/hooks/use-hero';
import type { ArtifactId } from 'app/interfaces/models/game/hero';
import { Text } from 'app/components/text';
import type React from 'react';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/tables/table';
import { useGameNavigation } from 'app/(game)/hooks/routes/use-game-navigation';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { useMap } from 'app/(game)/hooks/use-map';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useVillages } from 'app/(game)/hooks/use-villages';
import type { Village } from 'app/interfaces/models/game/village';
import { LinkWithState } from 'app/components/link-with-state';
import { Trans } from '@lingui/react/macro';
import { itemsMap } from 'app/assets/items';

type UnoccupiedArtifactRowProps = {
  item: WorldItem;
};

const UnoccupiedArtifactRow: React.FC<UnoccupiedArtifactRowProps> = ({ item }) => {
  const { mapPath } = useGameNavigation();
  const { getTileByTileId } = useMap();

  const { coordinates } = getTileByTileId(item.tileId);
  const { name } = itemsMap.get(item.id)!;

  return (
    <TableRow>
      <TableCell>
        <Trans>Burek</Trans>
      </TableCell>
      <TableCell>
        <Trans>{name.message}</Trans>
      </TableCell>
      <TableCell>
        <LinkWithState to={`${mapPath}?x=${coordinates.x}&y=${coordinates.y}`}>
          {coordinates.x}, {coordinates.y}
        </LinkWithState>
      </TableCell>
    </TableRow>
  );
};

export const TreasuryArtifacts = () => {
  const { hero } = useHero();
  const { currentVillageArtifactId, hasCurrentVillageArtifact, assignedArtifacts } = useArtifacts();
  const { worldItems } = useWorldItems();
  const { distanceFromCurrentVillage } = useCurrentVillage();
  const { villages } = useVillages();

  const currentVillageArtifact = hasCurrentVillageArtifact ? itemsMap.get(currentVillageArtifactId!) : null;

  const availableArtifacts = hero.inventory.filter(({ category }) => category === 'artifact');
  const hasAvailableArtifacts = availableArtifacts.length > 0;

  const unclaimedArtifactWorldItems = worldItems.filter(({ id, type }) => {
    // @ts-expect-error: TODO: Fix these type narrowing issues
    return type === 'artifact' && !assignedArtifacts.includes(id) && !availableArtifacts.includes(id);
  });

  const villageCoordinatesToVillagesMap = useMemo<Map<string, Village>>(() => {
    return new Map<string, Village>(
      villages.map((village) => {
        return [`${village.coordinates.x}-${village.coordinates.y}`, village];
      }),
    );
  }, [villages]);

  const sortedByDistanceArtifactWorldItems = useMemo<WorldItem[]>(() => {
    return unclaimedArtifactWorldItems.toSorted((prev, next) => {
      const { coordinates: prevCoordinates } = villageCoordinatesToVillagesMap.get(prev.tileId)!;
      const { coordinates: nextCoordinates } = villageCoordinatesToVillagesMap.get(next.tileId)!;
      return distanceFromCurrentVillage(prevCoordinates) - distanceFromCurrentVillage(nextCoordinates);
    });
  }, [villageCoordinatesToVillagesMap, unclaimedArtifactWorldItems, distanceFromCurrentVillage]);

  const _assignArtifactToCurrentVillage = (_artifactId: ArtifactId) => {};

  const _unassignArtifactFromCurrentVillage = () => {};

  return (
    <article className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <Text as="h2">
          <Trans>Artifact in this village</Trans>
        </Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Trans>Name</Trans>
              </TableHeaderCell>
              <TableHeaderCell>
                <Trans>Description</Trans>
              </TableHeaderCell>
              <TableHeaderCell>
                <Trans>Actions</Trans>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {hasCurrentVillageArtifact && (
                <>
                  <TableCell>
                    <Trans>{currentVillageArtifact?.name.message}</Trans>
                  </TableCell>
                  <TableCell>
                    <Trans>{currentVillageArtifact?.description.message}</Trans>
                  </TableCell>
                  <TableCell>/</TableCell>
                </>
              )}
              {!hasCurrentVillageArtifact && (
                <>
                  <TableCell
                    className="text-left"
                    colSpan={hasAvailableArtifacts ? 2 : 3}
                  >
                    hasAvailableArtifacts ? <Trans>This village does not host an artifact. Select an artifact to assign.</Trans> :{' '}
                    <Trans>This village does not host an artifact. Capture one first from the list bellow.</Trans>
                  </TableCell>
                  {hasAvailableArtifacts && <TableCell className="text-left">TODO</TableCell>}
                </>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2">
          <Trans>Unoccupied artifacts</Trans>
        </Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Trans>Name</Trans>
              </TableHeaderCell>
              <TableHeaderCell>
                <Trans>Description</Trans>
              </TableHeaderCell>
              <TableHeaderCell>
                <Trans>Coordinates</Trans>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedByDistanceArtifactWorldItems.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-left"
                  colSpan={3}
                >
                  <Trans>There are no more artifacts to conquer.</Trans>
                </TableCell>
              </TableRow>
            )}
            {sortedByDistanceArtifactWorldItems.length > 0 &&
              sortedByDistanceArtifactWorldItems.map((item) => (
                <UnoccupiedArtifactRow
                  key={item.tileId}
                  item={item}
                />
              ))}
          </TableBody>
        </Table>
      </section>
    </article>
  );
};
