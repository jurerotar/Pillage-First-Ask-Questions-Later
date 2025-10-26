import { useTranslation } from 'react-i18next';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type ResourceFieldComposition,
  resourceFieldCompositionSchema,
} from 'app/interfaces/models/game/resource-field-composition';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { Pagination } from 'app/components/ui/pagination';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'app/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { Icon } from 'app/components/icon';
import { parseResourcesFromRFC } from 'app/utils/map';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import type { Resource } from 'app/interfaces/models/game/resource';
import { Button } from 'app/components/ui/button';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { coordinatesSchema } from 'app/interfaces/models/common';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';
import { Link, useSearchParams } from 'react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(hero)/+types/page';

type OasisBonus =
  | `${25 | 50}-${Resource}`
  | `${25}-${Exclude<Resource, 'wheat'>}-${25}-wheat`;

const oasisBonuses: OasisBonus[] = [
  '25-wheat',
  '50-wheat',
  '25-wood',
  '25-wood-25-wheat',
  '50-wood',
  '25-clay',
  '25-clay-25-wheat',
  '50-clay',
  '25-iron',
  '25-iron-25-wheat',
  '50-iron',
];

const splitOasisBonus = (oasisBonus: OasisBonus) => {
  return oasisBonus.split('-') as
    | [string, Resource, string, Resource]
    | [string, Resource];
};

const parseOasisBonus = (
  oasisBonus: OasisBonus | typeof NO_OASIS_BONUS_KEY,
) => {
  if (oasisBonus === NO_OASIS_BONUS_KEY) {
    return [];
  }

  const [firstBonus, firstResource, secondBonus, secondResource] =
    splitOasisBonus(oasisBonus);

  const bonuses = [
    {
      bonus: Number.parseInt(firstBonus, 10),
      resource: firstResource,
    },
  ];

  if (secondBonus && secondResource) {
    bonuses.push({
      bonus: Number.parseInt(secondBonus, 10),
      resource: secondResource,
    });
  }

  return bonuses;
};

const bonusSetSchema = z.enum(oasisBonuses).or(z.literal('no-oasis-bonus'));

const extendedRFCSchema = resourceFieldCompositionSchema.or(
  z.literal('any-cropper'),
);

const bonusFinderFormSchema = z.strictObject({
  resourceFieldComposition: extendedRFCSchema,
  firstOasisBonus: bonusSetSchema,
  secondOasisBonus: bonusSetSchema,
  thirdOasisBonus: bonusSetSchema,
});

const resourceFieldCompositions: ResourceFieldComposition[] = [
  '4446',
  '5436',
  '5346',
  '4536',
  '3546',
  '4356',
  '3456',
  '4437',
  '4347',
  '3447',
  '3339',
  '11115',
  '00018',
];

const RFCFieldValues = ['any-cropper', ...resourceFieldCompositions] as const;

const NO_OASIS_BONUS_KEY = 'no-oasis-bonus';

const OasisBonusSelectContent = () => {
  const { t } = useTranslation();

  return (
    <SelectContent>
      <SelectItem value={NO_OASIS_BONUS_KEY}>{t('No oasis bonus')}</SelectItem>
      {oasisBonuses.map((oasisBonus) => {
        const [
          firstBonusValue,
          firstBonusResource,
          secondBonusValue,
          secondBonusResource,
        ] = splitOasisBonus(oasisBonus);

        return (
          <SelectItem
            key={oasisBonus}
            value={oasisBonus}
          >
            {firstBonusValue}%
            <Icon
              className="size-4"
              type={firstBonusResource}
            />
            {secondBonusValue && secondBonusResource && (
              <>
                {firstBonusValue}%
                <Icon
                  className="size-4"
                  type={secondBonusResource}
                />
              </>
            )}
          </SelectItem>
        );
      })}
    </SelectContent>
  );
};

const bonusFinderQuerySchema = z.strictObject({
  tileId: z.number(),
  coordinates: coordinatesSchema,
  resourceFieldComposition: resourceFieldCompositionSchema,
  distance: z.number(),
});

const OasisBonusFinderPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const [searchParams] = useSearchParams();

  const title = `${t('Oasis bonus finder')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  const { coordinates } = currentVillage;

  const x = Number.parseInt(searchParams.get('x')!, 10) ?? coordinates.x;
  const y = Number.parseInt(searchParams.get('y')!, 10) ?? coordinates.y;

  const form = useForm<z.infer<typeof bonusFinderFormSchema>>({
    resolver: zodResolver(bonusFinderFormSchema),
    defaultValues: {
      resourceFieldComposition: 'any-cropper',
      firstOasisBonus: NO_OASIS_BONUS_KEY,
      secondOasisBonus: NO_OASIS_BONUS_KEY,
      thirdOasisBonus: NO_OASIS_BONUS_KEY,
    },
  });

  const resourceFieldComposition = form.watch('resourceFieldComposition');
  const firstOasisBonus = form.watch('firstOasisBonus');
  const secondOasisBonus = form.watch('secondOasisBonus');
  const thirdOasisBonus = form.watch('thirdOasisBonus');

  const {
    data = [],
    isFetching,
    refetch,
    isFetched,
  } = useQuery({
    queryKey: ['oasis-bonus-finder'],
    queryFn: async () => {
      const { data } = await fetcher(`/oasis-bonus-finder?x=${x}&y=${y}`, {
        method: 'GET',
        body: {
          resourceFieldComposition,
          bonuses: {
            firstOasis: parseOasisBonus(firstOasisBonus),
            secondOasis: parseOasisBonus(secondOasisBonus),
            thirdOasis: parseOasisBonus(thirdOasisBonus),
          },
        },
      });

      return z.array(bonusFinderQuerySchema).parse(data);
    },
    staleTime: 2000,
    enabled: false,
    placeholderData: keepPreviousData,
  });

  const onSubmit = async () => {
    await refetch();
  };

  const pagination = usePagination(data!, 20, 1);
  const { currentPageItems, page, resultsPerPage } = pagination;

  return (
    <>
      <title>{title}</title>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={`../map?x=${coordinates.x}&y=${coordinates.y}`}>
              {t('Map')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Oasis bonus finder')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Oasis bonus finder')}</Text>
      <Text>
        {t(
          'Search for villages that offer your desired resources and oasis bonuses.',
        )}
      </Text>
      <Section>
        <SectionContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex gap-4 flex-col"
            >
              <FormField
                control={form.control}
                name="resourceFieldComposition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Resource field composition')}</FormLabel>
                    <Select
                      onValueChange={(v) =>
                        field.onChange(v === NO_OASIS_BONUS_KEY ? '' : v)
                      }
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('Select resource composition')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RFCFieldValues.map((rfc) => {
                          if (rfc === 'any-cropper') {
                            return (
                              <SelectItem
                                key={rfc}
                                value={rfc}
                              >
                                <Icon
                                  className="size-4"
                                  type="wheat"
                                />
                                {t('Any cropper')}
                              </SelectItem>
                            );
                          }

                          const resources = parseResourcesFromRFC(rfc);

                          return (
                            <SelectItem
                              key={rfc}
                              value={rfc}
                            >
                              <Resources
                                iconClassName="size-4"
                                resources={resources}
                              />
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 flex-wrap md:w-full *:flex *:flex-1 *:flex-col">
                <FormField
                  control={form.control}
                  name="firstOasisBonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('First oasis bonus')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="md:w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <OasisBonusSelectContent />
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondOasisBonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('First oasis bonus')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="md:w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <OasisBonusSelectContent />
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thirdOasisBonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Third oasis bonus')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="md:w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <OasisBonusSelectContent />
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex md:justify-end">
                <Button
                  size="fit"
                  disabled={isFetching}
                  type="submit"
                >
                  {t('Search')}
                </Button>
              </div>
            </form>
          </Form>
        </SectionContent>
        <SectionContent>
          {isFetched && (
            <Text className="font-semibold">
              {t(
                'Found a total of {{amount}} tiles that match your criteria.',
                {
                  amount: data!.length,
                },
              )}
            </Text>
          )}

          <div className="overflow-x-scroll scrollbar-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell />
                  <TableHeaderCell>
                    <Text>{t('Resources')}</Text>
                  </TableHeaderCell>
                  <TableHeaderCell>
                    <Text>{t('Coordinates')}</Text>
                  </TableHeaderCell>
                  <TableHeaderCell>
                    <Text>{t('Distance')}</Text>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isFetched && (
                  <TableRow>
                    <TableCell
                      className="text-left"
                      colSpan={4}
                    >
                      <Text>{t('Define your criteria and click search.')}</Text>
                    </TableCell>
                  </TableRow>
                )}
                {isFetched &&
                  currentPageItems.map(
                    (
                      {
                        tileId,
                        coordinates,
                        resourceFieldComposition,
                        distance,
                      },
                      index,
                    ) => {
                      const resources = parseResourcesFromRFC(
                        resourceFieldComposition,
                      );

                      return (
                        <TableRow key={tileId}>
                          <TableCell>
                            <Text className="text-sm font-medium">
                              {(page - 1) * resultsPerPage + index + 1}.
                            </Text>
                          </TableCell>
                          <TableCell>
                            <Text>
                              <Resources
                                className="justify-center"
                                iconClassName="size-4"
                                resources={resources}
                              />
                            </Text>
                          </TableCell>
                          <TableCell>
                            <Text variant="link">
                              <Link
                                to={`../map?x=${coordinates.x}&y=${coordinates.y}`}
                              >
                                ({coordinates.x} | {coordinates.y})
                              </Link>
                            </Text>
                          </TableCell>
                          <TableCell>
                            <Text>{distance}</Text>
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
              </TableBody>
            </Table>
          </div>
          <div className="flex w-full justify-end">
            <Pagination {...pagination} />
          </div>
        </SectionContent>
      </Section>
    </>
  );
};

export default OasisBonusFinderPage;
