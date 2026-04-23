import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
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

type EditFarmListModalProps = {
  isOpen: boolean;
  id: number;
  onClose: () => void;
};

export const EditFarmListModal = ({
  isOpen,
  id,
  onClose,
}: EditFarmListModalProps) => {
  const { t } = useTranslation();
  const { farmLists, updateFarmList } = useFarmLists();
  const { playerVillages } = usePlayerVillageListing();

  const farmList = farmLists.find((list) => list.id === id);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: farmList
      ? {
          name: farmList.name,
          villageId: farmList.villageId.toString(),
        }
      : undefined,
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateFarmList({
      id,
      name: values.name,
      villageId: Number.parseInt(values.villageId, 10),
    });
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Edit Farm List')}</DialogTitle>
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

            <DialogFooter className="flex justify-end items-center mt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={onClose}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  variant="confirm"
                  type="submit"
                >
                  {t('Save')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
