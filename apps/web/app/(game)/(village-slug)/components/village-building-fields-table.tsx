import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { buttonVariants } from 'app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

export const VillageBuildingFieldsTable = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();

  const sortedFields = [...currentVillage.buildingFields].sort(
    (a, b) => a.id - b.id,
  );

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell className="w-16">#</TableHeaderCell>
            <TableHeaderCell>{t('Building')}</TableHeaderCell>
            <TableHeaderCell className="w-24">{t('Level')}</TableHeaderCell>
            <TableHeaderCell className="w-32">{t('Action')}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFields.map((field) => {
            const isResourceField = field.id >= 1 && field.id <= 18;
            const baseUrl = isResourceField ? '../resources' : '../village';
            const linkTo = `${baseUrl}/${field.id}`;

            return (
              <TableRow key={field.id}>
                <TableCell>{field.id}</TableCell>
                <TableCell className="text-left font-bold">
                  {field.buildingId
                    ? t(`BUILDINGS.${field.buildingId}.NAME`)
                    : t('Empty')}
                </TableCell>
                <TableCell>{field.buildingId ? field.level : '—'}</TableCell>
                <TableCell>
                  <Link
                    to={linkTo}
                    className={buttonVariants({
                      size: 'sm',
                      variant: 'outline',
                    })}
                  >
                    {t('View')}
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
