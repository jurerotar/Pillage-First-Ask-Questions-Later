import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'app/components/ui/form';
import { Input } from 'app/components/ui/input';
import { Button } from 'app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import { useMutation } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import { serverFactory } from 'app/factories/server-factory';
import type { CreateServerWorkerPayload } from 'app/(public)/(create-new-server)/workers/create-new-server-worker';
import CreateServerWorker from 'app/(public)/(create-new-server)/workers/create-new-server-worker?worker&url';
import { workerFactory } from 'app/utils/workers';
import { toast } from 'sonner';

const formSchema = z.object({
  seed: z.string().min(1, { error: t('Seed is required') }),
  name: z.string().min(1, { error: t('Server name is required') }),
  configuration: z.object({
    speed: z
      .enum(['1', '2', '3', '5', '10'])
      // @ts-expect-error: I don't know how to solve this one, speed is expected to be number, but if I use z.literal to use exact numbers
      // fom completely breaks
      .overwrite((val) => Number.parseInt(val)),
    mapSize: z
      .enum(['100', '200', '300'])
      // @ts-expect-error
      .overwrite((val) => Number.parseInt(val)),
  }),
  playerConfiguration: z.object({
    name: z.string().min(1, { error: t('Player name is required') }),
    tribe: z.enum(['romans', 'gauls', 'teutons', 'huns', 'egyptians']),
  }),
});

const generateSeed = (length = 10): string => {
  return crypto.randomUUID().replaceAll('-', '').substring(0, length);
};

type MutateArgs = {
  server: Server;
};

export const CreateNewServerForm = () => {
  const { t } = useTranslation('public');
  const navigate = useNavigate();
  const { addServer, deleteServer } = useAvailableServers();

  const {
    mutate: createServer,
    isError,
    error,
    isPending,
    isSuccess,
  } = useMutation<void, Error, MutateArgs>({
    mutationFn: async ({ server }) => {
      await workerFactory<CreateServerWorkerPayload>(CreateServerWorker, {
        server,
      });
    },
    onSuccess: (_, { server }) => {
      addServer({ server });
      navigate(`/game/${server.slug}/v-1/resources`);
      toast.success(t('Server successfully created! Redirecting...'));
    },
    onError: (_, { server }) => deleteServer({ server }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      seed: generateSeed(),
      name: t('Server'),
      configuration: {
        speed: '1',
        mapSize: '100',
      },
      playerConfiguration: {
        name: t('Player'),
        tribe: 'gauls',
      },
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // @ts-expect-error: This is actually fine, it's just a typing issue described above
    const server = serverFactory({ ...values });
    createServer({ server });
  };

  if (isError) {
    console.error(error);

    return (
      <div className="flex flex-col gap-4 p-6 max-w-md mx-auto">
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 p-2 shadow-xl rounded-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="seed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Server Seed')}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPending || isSuccess}
                      placeholder="abc123"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              disabled={isPending || isSuccess}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Server Name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('New World')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="configuration.mapSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('World Size')}</FormLabel>
                  <Select
                    disabled={isPending || isSuccess}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                      <SelectItem value="300">300</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="configuration.speed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Game Speed')}</FormLabel>
                  <Select
                    disabled={isPending || isSuccess}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="3">3x</SelectItem>
                      <SelectItem value="5">5x</SelectItem>
                      <SelectItem value="10">10x</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="playerConfiguration.name"
              disabled={isPending || isSuccess}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Player Name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="playerConfiguration.tribe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Tribe')}</FormLabel>
                  <Select
                    disabled={isPending || isSuccess}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Select a tribe')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="romans">{t('Romans')}</SelectItem>
                      <SelectItem value="gauls">{t('Gauls')}</SelectItem>
                      <SelectItem value="teutons">{t('Teutons')}</SelectItem>
                      <SelectItem value="huns">{t('Huns')}</SelectItem>
                      <SelectItem value="egyptians">
                        {t('Egyptians')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            disabled={isPending || isSuccess}
            type="submit"
          >
            {t('Create Server')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
