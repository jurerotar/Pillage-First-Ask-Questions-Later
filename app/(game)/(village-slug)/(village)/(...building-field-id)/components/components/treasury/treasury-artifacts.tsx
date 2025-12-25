import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useArtifactsAroundCurrentVillage } from 'app/(game)/(village-slug)/hooks/use-artifacts-around-current-village';
import { getItemDefinition } from 'app/assets/utils/items';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

type UnoccupiedArtifactRowProps = {
  item: ReturnType<
    typeof useArtifactsAroundCurrentVillage
  >['artifactsAroundCurrentVillage'][0];
};

const UnoccupiedArtifactRow = ({ item }: UnoccupiedArtifactRowProps) => {
  const { t } = useTranslation();

  const { name } = getItemDefinition(item.id);

  return (
    <TableRow>
      <TableCell>{t(`ITEMS.${name}.NAME`)}</TableCell>
      <TableCell>{t(`ITEMS.${name}.DESCRIPTION`)}</TableCell>
      <TableCell>{item.distance}</TableCell>
      <TableCell>
        <Link to={`../map?x=${item.coordinates.x}&y=${item.coordinates.y}`}>
          ({item.coordinates.x} | {item.coordinates.y})
        </Link>
      </TableCell>
    </TableRow>
  );
};

export const TreasuryArtifacts = () => {
  const { t } = useTranslation();
  const { artifactsAroundCurrentVillage } = useArtifactsAroundCurrentVillage();

  // const availableArtifacts = hero.inventory.filter(
  //   ({ category }) => category === 'artifact',
  // );

  const hasCurrentVillageArtifact = false;

  const hasAvailableArtifacts = false; //availableArtifacts.length > 0;

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="artifacts" />
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
              {/*{hasCurrentVillageArtifact && (*/}
              {/*  <>*/}
              {/*    <TableCell>*/}
              {/*      {t(`ITEMS.${currentVillageArtifactId}.NAME`)}*/}
              {/*    </TableCell>*/}
              {/*    <TableCell>*/}
              {/*      {t(`ITEMS.${currentVillageArtifactId}.DESCRIPTION`)}*/}
              {/*    </TableCell>*/}
              {/*    <TableCell>/</TableCell>*/}
              {/*  </>*/}
              {/*)}*/}
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
              <TableHeaderCell>{t('Distance')}</TableHeaderCell>
              <TableHeaderCell>{t('Coordinates')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {artifactsAroundCurrentVillage.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-left"
                  colSpan={3}
                >
                  {t('There are no more artifacts to conquer.')}
                </TableCell>
              </TableRow>
            )}
            {artifactsAroundCurrentVillage.length > 0 &&
              artifactsAroundCurrentVillage.map((item) => (
                <UnoccupiedArtifactRow
                  key={item.id}
                  item={item}
                />
              ))}
          </TableBody>
        </Table>
      </section>
    </Section>
  );
};
