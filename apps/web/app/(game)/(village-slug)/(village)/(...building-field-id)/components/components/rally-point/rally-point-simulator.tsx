import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { getUnitsByTribe } from '@pillage-first/game-assets/units/utils';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Button } from 'app/components/ui/button';
import { Form, FormControl, FormField, FormItem } from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from 'app/components/ui/table';

const formSchema = z.strictObject({
  unit0: z.number(),
});

export const RallyPointSimulator = () => {
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (_values: z.infer<typeof formSchema>) => {
    // TODO: Perform simulation
  };

  return (
    <section className="flex flex-col gap-2">
      <SectionContent>
        <Bookmark tab="simulator" />
        <Text as="h2">{t('Battle Simulator')}</Text>
        <Text>
          Are you unsure about winning a battle? You want to know how many
          losses or resoureces you can expect? Just choost your army, the
          defender and reinforcements (not mandatory), and find out!
        </Text>
      </SectionContent>

      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2 mt-2"
        >
          <SimulatorArmy {...form} />
          <Button
            size="fit"
            type="submit"
          >
            {t('Simulate')}
          </Button>
        </form>
      </Form>
    </section>
  );
};

// TODO: Add type to "form"
export const SimulatorArmy = (form) => {
  const unitsByTribe = getUnitsByTribe('romans');

  return (
    <div className="overflow-x-scroll">
      <Table className="">
        <TableBody>
          <TableRow>
            {unitsByTribe.map(({ id }) => (
              <TableCell
                className="text-center"
                key={id}
              >
                <Icon
                  type={unitIdToUnitIconMapper(id)}
                  className="size-4 lg:size-6 m-auto"
                />
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            {unitsByTribe.map(({ id }, index) => {
              const formId = `unit${index}`;
              return (
                <TableCell
                  className="text-center"
                  key={id}
                >
                  <FormField
                    control={form.control}
                    name={formId}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="0"
                            className="max-w-20 min-w-10 text-center"
                            size="fit"
                            type="text"
                            min={0}
                            {...form.register(formId, {
                              valueAsNumber: true,
                            })}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TableCell>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
