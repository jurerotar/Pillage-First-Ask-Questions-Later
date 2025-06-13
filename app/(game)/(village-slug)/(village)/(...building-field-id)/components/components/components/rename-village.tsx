import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Button } from 'app/components/ui/button';
import { z } from 'zod/v4';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

const formSchema = z.object({
  name: z
    .string()
    .min(1, { error: t('Village name is required') })
    .max(30, { error: t('Name cannot be longer than 30 characters') }),
});

export const RenameVillage = () => {
  const { fetcher } = use(ApiContext);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currentVillage } = useCurrentVillage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentVillage.name,
    },
  });

  const { mutate: renameVillage } = useMutation<void, Error, z.infer<typeof formSchema>>({
    mutationFn: async ({ name }) => {
      await fetcher(`/villages/${currentVillage.id}/rename`, {
        method: 'PATCH',
        body: {
          name,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [playerVillagesCacheKey] });
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    renameVillage(values);
  };

  return (
    <section className="flex flex-col gap-2">
      <Text as="h2">{t('Rename village')}</Text>
      <Text>{t('Rename current village. Name cannot exceed 30 characters.')}</Text>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2 mt-2"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Village name')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('Village name')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{t('Update village name')}</Button>
        </form>
      </Form>
    </section>
  );
};
