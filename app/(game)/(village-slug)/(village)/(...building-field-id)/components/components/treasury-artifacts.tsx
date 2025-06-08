import { useArtifacts } from 'app/(game)/(village-slug)/hooks/use-artifacts';
import { useWorldItems } from 'app/(game)/(village-slug)/hooks/use-world-items';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import type { ArtifactId } from 'app/interfaces/models/game/hero';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import type React from 'react';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/ui/table';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { parseCoordinatesFromTileId } from 'app/utils/map';
import { Link } from 'react-router';
import { Section, SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';

type UnoccupiedArtifactRowProps = {
  item: WorldItem;
};

const UnoccupiedArtifactRow: React.FC<UnoccupiedArtifactRowProps> = ({ item }) => {
  const { t: assetsT } = useTranslation();
  const { mapPath } = useGameNavigation();

  const coordinates = parseCoordinatesFromTileId(item.tileId);

  return (
    <TableRow>
      <TableCell>{assetsT(`ITEMS.${item.id}.TITLE`)}</TableCell>
      <TableCell>{assetsT(`ITEMS.${item.id}.DESCRIPTION`)}</TableCell>
      <TableCell>
        <Link to={`${mapPath}?x=${coordinates.x}&y=${coordinates.y}`}>
          {coordinates.x}, {coordinates.y}
        </Link>
      </TableCell>
    </TableRow>
  );
};

export const TreasuryArtifacts = () => {
  const { t: assetsT } = useTranslation();
  const { t } = useTranslation();
  const { hero } = useHero();
  const { currentVillageArtifactId, hasCurrentVillageArtifact, assignedArtifacts } = useArtifacts();
  const { worldItems } = useWorldItems();
  const { getDistanceFromCurrentVillage } = useCurrentVillage();

  const availableArtifacts = hero.inventory.filter(({ category }) => category === 'artifact');
  const hasAvailableArtifacts = availableArtifacts.length > 0;

  const unclaimedArtifactWorldItems = worldItems.filter(({ id, type }) => {
    // @ts-expect-error: TODO: Fix these type narrowing issues
    return type === 'artifact' && !assignedArtifacts.includes(id) && !availableArtifacts.includes(id);
  });

  const sortedByDistanceArtifactWorldItems = useMemo<WorldItem[]>(() => {
    return unclaimedArtifactWorldItems.toSorted((prev, next) => {
      return getDistanceFromCurrentVillage(prev.tileId) - getDistanceFromCurrentVillage(next.tileId);
    });
  }, [unclaimedArtifactWorldItems, getDistanceFromCurrentVillage]);

  const _assignArtifactToCurrentVillage = (_artifactId: ArtifactId) => {};

  const _unassignArtifactFromCurrentVillage = () => {};

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="train" />
        <Text as="h2">{t('Artifacts')}</Text>
        <Text as="p">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium ad autem distinctio nesciunt officia quas qui similique.
          Aperiam atque et excepturi fugiat labore quidem sed sit tempore totam voluptas. Iure!
        </Text>
      </SectionContent>
      <section className="flex flex-col gap-2">
        <Text as="h2">{t('Artifact in this village')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Name')}</TableHeaderCell>
              <TableHeaderCell>{t('Description')}</TableHeaderCell>
              <TableHeaderCell>{t('Actions')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {hasCurrentVillageArtifact && (
                <>
                  <TableCell>{assetsT(`ITEMS.${currentVillageArtifactId}.TITLE`)}</TableCell>
                  <TableCell>{assetsT(`ITEMS.${currentVillageArtifactId}.DESCRIPTION`)}</TableCell>
                  <TableCell>/</TableCell>
                </>
              )}
              {!hasCurrentVillageArtifact && (
                <>
                  <TableCell
                    className="text-left"
                    colSpan={hasAvailableArtifacts ? 2 : 3}
                  >
                    {hasAvailableArtifacts
                      ? t('This village does not host an artifact. Select an artifact to assign.')
                      : t('This village does not host an artifact. Capture one first from the list bellow.')}
                  </TableCell>
                  {hasAvailableArtifacts && <TableCell className="text-left">TODO</TableCell>}
                </>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2">{t('Unoccupied artifacts')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Name')}</TableHeaderCell>
              <TableHeaderCell>{t('Description')}</TableHeaderCell>
              <TableHeaderCell>{t('Coordinates')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedByDistanceArtifactWorldItems.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-left"
                  colSpan={3}
                >
                  {t('There are no more artifacts to conquer.')}
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
    </Section>
  );
};
