import { useArtifacts } from 'app/(game)/hooks/use-artifacts';
import { useWorldItems } from 'app/(game)/hooks/use-world-items';
import { useHero } from 'app/(game)/hooks/use-hero';
import type { ArtifactId } from 'app/interfaces/models/game/hero';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import type React from 'react';
import { use, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/tables/table';
import { useGameNavigation } from 'app/(game)/hooks/routes/use-game-navigation';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { LinkWithState } from 'app/components/link-with-state';
import { parseCoordinatesFromTileId } from 'app/utils/map-tile';

type UnoccupiedArtifactRowProps = {
  item: WorldItem;
};

const UnoccupiedArtifactRow: React.FC<UnoccupiedArtifactRowProps> = ({ item }) => {
  const { t } = useTranslation();
  const { mapPath } = useGameNavigation();

  const coordinates = parseCoordinatesFromTileId(item.tileId);

  return (
    <TableRow>
      <TableCell>{t(`ITEMS.${item.id}.TITLE`)}</TableCell>
      <TableCell>{t(`ITEMS.${item.id}.DESCRIPTION`)}</TableCell>
      <TableCell>
        <LinkWithState to={`${mapPath}?x=${coordinates.x}&y=${coordinates.y}`}>
          {coordinates.x}, {coordinates.y}
        </LinkWithState>
      </TableCell>
    </TableRow>
  );
};

export const TreasuryArtifacts = () => {
  const { t } = useTranslation();
  const { t: treasuryT } = useTranslation('translation', {
    keyPrefix: 'APP.GAME.BUILDING_FIELD.BUILDING_DETAILS.TAB_PANELS.TREASURY',
  });
  const { hero } = useHero();
  const { currentVillageArtifactId, hasCurrentVillageArtifact, assignedArtifacts } = useArtifacts();
  const { worldItems } = useWorldItems();
  const { distanceFromCurrentVillage } = use(CurrentVillageContext);

  const availableArtifacts = hero.inventory.filter(({ category }) => category === 'artifact');
  const hasAvailableArtifacts = availableArtifacts.length > 0;

  const unclaimedArtifactWorldItems = worldItems.filter(({ id, type }) => {
    // @ts-expect-error: TODO: Fix these type narrowing issues
    return type === 'artifact' && !assignedArtifacts.includes(id) && !availableArtifacts.includes(id);
  });

  const sortedByDistanceArtifactWorldItems = useMemo<WorldItem[]>(() => {
    return unclaimedArtifactWorldItems.toSorted((prev, next) => {
      return distanceFromCurrentVillage(prev.tileId) - distanceFromCurrentVillage(next.tileId);
    });
  }, [unclaimedArtifactWorldItems, distanceFromCurrentVillage]);

  const _assignArtifactToCurrentVillage = (_artifactId: ArtifactId) => {};

  const _unassignArtifactFromCurrentVillage = () => {};

  return (
    <article className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <Text as="h2">{treasuryT('VILLAGE_ARTIFACT.TITLE')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{treasuryT('VILLAGE_ARTIFACT.TABLE.ARTIFACT_NAME')}</TableHeaderCell>
              <TableHeaderCell>{treasuryT('VILLAGE_ARTIFACT.TABLE.ARTIFACT_DESCRIPTION')}</TableHeaderCell>
              <TableHeaderCell>{treasuryT('VILLAGE_ARTIFACT.TABLE.ACTIONS')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {hasCurrentVillageArtifact && (
                <>
                  <TableCell>{t(`ITEMS.${currentVillageArtifactId}.TITLE`)}</TableCell>
                  <TableCell>{t(`ITEMS.${currentVillageArtifactId}.DESCRIPTION`)}</TableCell>
                  <TableCell>/</TableCell>
                </>
              )}
              {!hasCurrentVillageArtifact && (
                <>
                  <TableCell
                    className="text-left"
                    colSpan={hasAvailableArtifacts ? 2 : 3}
                  >
                    {treasuryT(
                      hasAvailableArtifacts
                        ? 'VILLAGE_ARTIFACT.TABLE.NO_ARTIFACT_ASSIGN_AVAILABLE'
                        : 'VILLAGE_ARTIFACT.TABLE.NO_ARTIFACT_ASSIGN_UNAVAILABLE',
                    )}
                  </TableCell>
                  {hasAvailableArtifacts && <TableCell className="text-left">TODO</TableCell>}
                </>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2">{treasuryT('UNOCCUPIED_ARTIFACTS.TITLE')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{treasuryT('UNOCCUPIED_ARTIFACTS.TABLE.ARTIFACT_NAME')}</TableHeaderCell>
              <TableHeaderCell>{treasuryT('UNOCCUPIED_ARTIFACTS.TABLE.ARTIFACT_DESCRIPTION')}</TableHeaderCell>
              <TableHeaderCell>{treasuryT('UNOCCUPIED_ARTIFACTS.TABLE.ARTIFACT_COORDINATES')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedByDistanceArtifactWorldItems.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-left"
                  colSpan={3}
                >
                  {t('UNOCCUPIED_ARTIFACTS.TABLE.NO_ARTIFACTS_AVAILABLE')}
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
