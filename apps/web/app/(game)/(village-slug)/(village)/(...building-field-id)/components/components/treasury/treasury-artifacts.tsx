import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useArtifactsAroundCurrentVillage } from 'app/(game)/(village-slug)/hooks/use-artifacts-around-current-village';
import { InformationPopover } from 'app/(game)/components/information-popover';
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
        <InformationPopover ariaLabel={t('Artifacts')}>
          <Text>
            {t(
              'Artifacts are powerful items created by the ancient Natars. Once activated, they provide strong advantages such as reduced crop consumption or increased troop speed.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Artifacts')}</Text>
      </SectionContent>
      <SectionContent>
        <Text as="h2">{t('Artifact in this village')}</Text>
        <OverflowContainer>
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
        </OverflowContainer>
      </SectionContent>

      <SectionContent>
        <Text as="h2">{t('Unoccupied artifacts')}</Text>
        <OverflowContainer>
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
        </OverflowContainer>
      </SectionContent>
    </Section>
  );
};
