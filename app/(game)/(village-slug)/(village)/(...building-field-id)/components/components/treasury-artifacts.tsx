import { useArtifacts } from 'app/(game)/(village-slug)/hooks/use-artifacts';
import { useArtifactLocation } from 'app/(game)/(village-slug)/hooks/use-artifact-location';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { getItemDefinition } from 'app/assets/utils/items';
import type { Point } from 'app/interfaces/models/common';
import { Link } from 'react-router';

type UnoccupiedArtifactRowProps = {
  itemId: number;
  itemCoordinates: Point;
};

const UnoccupiedArtifactRow = ({
  itemId,
  itemCoordinates,
}: UnoccupiedArtifactRowProps) => {
  const { t } = useTranslation();

  const { name } = getItemDefinition(itemId);

  return (
    <TableRow>
      <TableCell>{t(`ITEMS.${name}.NAME`)}</TableCell>
      <TableCell>{t(`ITEMS.${name}.DESCRIPTION`)}</TableCell>
      <TableCell>
        <Link to={`../map?x=${itemCoordinates.x}&y=${itemCoordinates.y}`}>
          {itemCoordinates.x}, {itemCoordinates.y}
        </Link>
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
  const { artifacts } = useArtifactLocation();

  const availableArtifacts = hero.inventory.filter(
    ({ category }) => category === 'artifact',
  );
  const hasAvailableArtifacts = availableArtifacts.length > 0;

  const unclaimedArtifactWorldItems = artifacts.filter(({ id }) => {
    return (
      // @ts-expect-error: TODO: Fix these type narrowing issues
      !assignedArtifacts.includes(id) && !availableArtifacts.includes(id)
    );
  });

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
                  key={item.id}
                  itemId={item.id}
                  itemCoordinates={item.coordinates}
                />
              ))}
          </TableBody>
        </Table>
      </section>
    </Section>
  );
};
