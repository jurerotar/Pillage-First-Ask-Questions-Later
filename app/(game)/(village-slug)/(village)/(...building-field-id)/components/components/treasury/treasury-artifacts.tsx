import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useArtifacts } from 'app/(game)/(village-slug)/hooks/use-artifacts';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { useWorldItems } from 'app/(game)/(village-slug)/hooks/use-world-items';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import type { ArtifactId } from 'app/interfaces/models/game/hero';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

type UnoccupiedArtifactRowProps = {
  item: WorldItem;
};

const UnoccupiedArtifactRow = ({ item }: UnoccupiedArtifactRowProps) => {
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell>{t(`ITEMS.${item.name}.NAME`)}</TableCell>
      <TableCell>{t(`ITEMS.${item.name}.DESCRIPTION`)}</TableCell>
      <TableCell>
        {/*// TODO: Re-enable this when SQLite migration is finished */}
        {/*<Link to={`${mapPath}?x=${coordinates.x}&y=${coordinates.y}`}>*/}
        {/*  {coordinates.x}, {coordinates.y}*/}
        {/*</Link>*/}/
      </TableCell>
    </TableRow>
  );
};

export const TreasuryArtifacts = () => {
  const { t } = useTranslation();
  const { hero } = useHero();
  const {
    currentVillageArtifactId,
    hasCurrentVillageArtifact,
    assignedArtifacts,
  } = useArtifacts();
  const { worldItems } = useWorldItems();

  const availableArtifacts = hero.inventory.filter(
    ({ category }) => category === 'artifact',
  );
  const hasAvailableArtifacts = availableArtifacts.length > 0;

  const unclaimedArtifactWorldItems = worldItems.filter(({ id, type }) => {
    return (
      type === 'artifact' &&
      // @ts-expect-error: TODO: Fix these type narrowing issues
      !assignedArtifacts.includes(id) &&
      // @ts-expect-error: TODO: Fix these type narrowing issues
      !availableArtifacts.includes(id)
    );
  });

  // TODO: Re-enable this when SQLite migration is finished
  // const sortedByDistanceArtifactWorldItems = useMemo<WorldItem[]>(() => {
  //   return unclaimedArtifactWorldItems.toSorted((prev, next) => {
  //     return (
  //       getDistanceFromCurrentVillage(prev.tileId) -
  //       getDistanceFromCurrentVillage(next.tileId)
  //     );
  //   });
  // }, [unclaimedArtifactWorldItems, getDistanceFromCurrentVillage]);

  const _assignArtifactToCurrentVillage = (_artifactId: ArtifactId) => {};

  const _unassignArtifactFromCurrentVillage = () => {};

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="train" />
        <Text as="h2">{t('Artifacts')}</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium
          ad autem distinctio nesciunt officia quas qui similique. Aperiam atque
          et excepturi fugiat labore quidem sed sit tempore totam voluptas.
          Iure!
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
                  <TableCell>
                    {t(`ITEMS.${currentVillageArtifactId}.NAME`)}
                  </TableCell>
                  <TableCell>
                    {t(`ITEMS.${currentVillageArtifactId}.DESCRIPTION`)}
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
                    {hasAvailableArtifacts
                      ? t(
                          'This village does not host an artifact. Select an artifact to assign.',
                        )
                      : t(
                          'This village does not host an artifact. Capture one first from the list bellow.',
                        )}
                  </TableCell>
                  {hasAvailableArtifacts && (
                    <TableCell className="text-left">TODO</TableCell>
                  )}
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
            {unclaimedArtifactWorldItems.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-left"
                  colSpan={3}
                >
                  {t('There are no more artifacts to conquer.')}
                </TableCell>
              </TableRow>
            )}
            {unclaimedArtifactWorldItems.length > 0 &&
              unclaimedArtifactWorldItems.map((item) => (
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
