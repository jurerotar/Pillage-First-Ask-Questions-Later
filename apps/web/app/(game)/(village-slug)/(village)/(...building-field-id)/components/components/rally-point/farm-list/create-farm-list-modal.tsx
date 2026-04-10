import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useFarmLists } from 'app/(game)/(village-slug)/hooks/use-farm-lists';
import { usePlayerVillageListing } from 'app/(game)/(village-slug)/hooks/use-player-village-listing';
import { Button } from 'app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';

const formSchema = z.strictObject({
  name: z.string().min(1, 'Name is required'),
  villageId: z.string().min(1, 'Village is required'),
});

type CreateFarmListModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateFarmListModal = ({
  isOpen,
  onClose,
}: CreateFarmListModalProps) => {
  const { t } = useTranslation();
  const { createFarmList } = useFarmLists();
  const { playerVillages } = usePlayerVillageListing();
  const { currentVillage } = useCurrentVillage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      villageId: currentVillage.id.toString(),
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createFarmList(values.name);
    form.reset();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create Farm List')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>{t('Name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('Enter list name')}
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="villageId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>{t('Village')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Select a village')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {playerVillages.map((village) => (
                        <SelectItem
                          key={village.id}
                          value={village.id.toString()}
                        >
                          {village.name} ({village.coordinates.x}|
                          {village.coordinates.y})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit">{t('Save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
