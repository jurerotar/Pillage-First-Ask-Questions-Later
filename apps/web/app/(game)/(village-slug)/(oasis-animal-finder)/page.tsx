import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FaTrash } from 'react-icons/fa6';
import { Link, useSearchParams } from 'react-router';
import { z } from 'zod';
import { natureUnits } from '@pillage-first/game-assets/units';
import { coordinatesSchema } from '@pillage-first/types/models/coordinates';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { natureUnitIdSchema } from '@pillage-first/types/models/unit';
import { calculateGridLayout } from '@pillage-first/utils/map';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(hero)/+types/page.ts';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { oasisAnimalFinderCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { Icon } from 'app/components/icon.tsx';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons.tsx';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Button } from 'app/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import { Pagination } from 'app/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const animalFinderQuerySchema = z.strictObject({
  tileId: z.number(),
  coordinates: coordinatesSchema,
  bonuses: z.array(
    z.strictObject({
      resource: resourceSchema,
      bonus: z.number(),
    }),
  ),
  animals: z.array(
    z.strictObject({
      unitId: natureUnitIdSchema,
      amount: z.number(),
    }),
  ),
  distance: z.number(),
});

const animalFilterSchema = z.strictObject({
  animal: natureUnitIdSchema,
  amount: z.number().min(1),
});

const OasisAnimalFinderPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;
  const { t } = useTranslation();
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const { mapSize } = useServer();
  const [searchParams, setSearchParams] = useSearchParams();

  const { halfSize } = calculateGridLayout(mapSize);

  const formSchema = z.strictObject({
    origin: z.strictObject({
      x: z.number().min(-halfSize).max(halfSize),
      y: z.number().min(-halfSize).max(halfSize),
    }),
    animalFilters: z.array(animalFilterSchema).min(1),
  });

  const { coordinates } = currentVillage;

  const x = Number.parseInt(searchParams.get('x')!, 10) ?? coordinates.x;
  const y = Number.parseInt(searchParams.get('y')!, 10) ?? coordinates.y;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: {
        x,
        y,
      },
      animalFilters: [{ animal: 'ELEPHANT', amount: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'animalFilters',
  });

  const {
    data = [],
    isFetching,
    refetch,
    isFetched,
  } = useQuery({
    queryKey: [oasisAnimalFinderCacheKey, x, y],
    queryFn: async () => {
      const values = form.getValues();
      const { data } = await fetcher(`/oasis-animal-finder?x=${x}&y=${y}`, {
        method: 'GET',
        body: {
          animalFilters: values.animalFilters,
        },
      });

      return z.array(animalFinderQuerySchema).parse(data);
    },
    staleTime: 2000,
    enabled: false,
    placeholderData: keepPreviousData,
  });

  const pagination = usePagination(data, 20, 1);
  const { currentPageItems, page, resultsPerPage } = pagination;

  const title = `${t('Oasis animal finder')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

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
          <BreadcrumbItem>{t('Oasis animal finder')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Oasis animal finder')}</Text>
      <Text>{t('Search for oasis tiles with specific nature troops.')}</Text>
      <Section>
        <SectionContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(async () => {
                await refetch();
              })}
              className="flex gap-4 flex-col"
            >
              <div className="flex gap-4 items-end">
                <FormField
                  name="origin.x"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>{t('Start position (x)')}</FormLabel>
                      <FormControl>
                        <Input
                          className="max-w-20"
                          type="number"
                          min={-halfSize}
                          max={halfSize}
                          {...form.register('origin.x', {
                            valueAsNumber: true,
                          })}
                          onChange={(event) => {
                            field.onChange(event);
                            setSearchParams(
                              (prev) => {
                                prev.set('x', event.target.value);
                                return prev;
                              },
                              { replace: true },
                            );
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="origin.y"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>{t('Start position (y)')}</FormLabel>
                      <FormControl>
                        <Input
                          className="max-w-20"
                          type="number"
                          min={-halfSize}
                          max={halfSize}
                          {...form.register('origin.y', {
                            valueAsNumber: true,
                          })}
                          onChange={(event) => {
                            field.onChange(event);
                            setSearchParams(
                              (prev) => {
                                prev.set('y', event.target.value);
                                return prev;
                              },
                              { replace: true },
                            );
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex gap-2"
                  >
                    <FormField
                      control={form.control}
                      name={`animalFilters.${index}.animal`}
                      render={({ field: animalField }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel>{t('Animal')}</FormLabel>
                          <Select
                            onValueChange={animalField.onChange}
                            defaultValue={animalField.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {natureUnits.map((unit) => (
                                <SelectItem
                                  key={unit.id}
                                  value={unit.id}
                                >
                                  <Icon
                                    type={unitIdToUnitIconMapper(unit.id)}
                                  />
                                  {t(`UNITS.${unit.id}.NAME`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`animalFilters.${index}.amount`}
                      render={({ field: amountField }) => (
                        <FormItem className="flex flex-col gap-2 w-20">
                          <FormLabel>{t('Min amount')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...amountField}
                              value={amountField.value}
                              onChange={(event) => {
                                amountField.onChange(
                                  Number.parseInt(event.target.value, 10) || 1,
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {index !== 0 && (
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <FaTrash className="text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ animal: 'RAT', amount: 1 })}
                  >
                    {t('Add animal filter')}
                  </Button>
                </div>
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
                  amount: data.length,
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
                    <Text>{t('Coordinates')}</Text>
                  </TableHeaderCell>
                  <TableHeaderCell>
                    <Text>{t('Distance')}</Text>
                  </TableHeaderCell>
                  <TableHeaderCell>
                    <Text>{t('Oasis bonuses')}</Text>
                  </TableHeaderCell>
                  <TableHeaderCell>
                    <Text>{t('Animals')}</Text>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isFetched && (
                  <TableRow>
                    <TableCell
                      className="text-left"
                      colSpan={5}
                    >
                      <Text>{t('Define your criteria and click search.')}</Text>
                    </TableCell>
                  </TableRow>
                )}
                {isFetched &&
                  currentPageItems.map(
                    (
                      { tileId, coordinates, distance, bonuses, animals },
                      index,
                    ) => (
                      <TableRow key={tileId}>
                        <TableCell>
                          <Text className="text-sm font-medium">
                            {(page - 1) * resultsPerPage + index + 1}.
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
                        <TableCell>
                          <Text className="inline-flex gap-2">
                            {bonuses.map(({ resource, bonus }) => (
                              <span
                                key={resource}
                                className="flex gap-1 items-center"
                              >
                                <Icon
                                  className="size-4"
                                  type={resource}
                                />
                                {bonus}%
                              </span>
                            ))}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Text className="inline-flex gap-2">
                            {animals.map(({ unitId, amount }) => (
                              <span
                                key={unitId}
                                className="inline-flex items-center gap-1"
                              >
                                <Icon
                                  className="size-4"
                                  type={unitIdToUnitIconMapper(unitId)}
                                />
                                {amount}
                              </span>
                            ))}
                          </Text>
                        </TableCell>
                      </TableRow>
                    ),
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

export default OasisAnimalFinderPage;
