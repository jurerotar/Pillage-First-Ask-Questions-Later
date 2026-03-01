import { faro } from '@grafana/faro-web-sdk';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { randomInt } from 'moderndash';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import {
  npcVillageNameAdjectives,
  npcVillageNameNouns,
} from '@pillage-first/game-assets/village';
import type { Server } from '@pillage-first/types/models/server';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { env } from '@pillage-first/utils/env';
import type {
  CreateNewGameWorldWorkerPayload,
  CreateNewGameWorldWorkerResponse,
} from 'app/(public)/(game-worlds)/(create)/workers/create-new-game-world-worker';
import CreateNewGameWorldWorker from 'app/(public)/(game-worlds)/(create)/workers/create-new-game-world-worker?worker&url';
import { useGameWorldActions } from 'app/(public)/(game-worlds)/hooks/use-game-world-actions';
import { Text } from 'app/components/text';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select.tsx';
import { Switch } from 'app/components/ui/switch.tsx';

const createServerFormSchema = z.strictObject({
  seed: z.string().min(1, { error: 'Seed is required' }),
  name: z.string().min(1, { error: 'Server name is required' }),
  configuration: z.strictObject({
    speed: z
      .enum(['1', '2', '3', '5', '10'])
      // @ts-expect-error: I don't know how to solve this one, speed is expected to be number, but if I use z.literal to use exact numbers
      // fom completely breaks
      .overwrite((val) => Number.parseInt(val, 10)),
    mapSize: z
      .enum(['100', '200'])
      // @ts-expect-error
      .overwrite((val) => Number.parseInt(val, 10)),
  }),
  playerConfiguration: z.strictObject({
    name: z.string().min(1, { error: 'Player name is required' }),
    tribe: tribeSchema,
  }),
  gameplay: z.strictObject({
    areOfflineNpcAttacksEnabled: z.boolean(),
  }),
});

const generateSeed = (length = 10): string => {
  return crypto.randomUUID().replaceAll('-', '').substring(0, length);
};

type MutateArgs = {
  server: Server;
};

export const CreateNewGameWorldForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createGameWorld, deleteGameWorld } = useGameWorldActions();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

  const steps = [
    t('Generating map tiles...'),
    t('Generating oasis...'),
    t('Generating players...'),
    t('Generating villages...'),
    t('Finalizing world generation...'),
  ];

  const {
    mutate: createServer,
    isError,
    error,
    isPending,
    isSuccess,
  } = useMutation<number, Error, MutateArgs>({
    mutationFn: async ({ server }) => {
      return new Promise<number>((resolve, reject) => {
        const worker = new Worker(CreateNewGameWorldWorker, { type: 'module' });
        const channel = new MessageChannel();

        worker.postMessage(
          {
            server,
            port: channel.port2,
          } satisfies CreateNewGameWorldWorkerPayload,
          [channel.port2],
        );

        channel.port1.onmessage = (
          event: MessageEvent<CreateNewGameWorldWorkerResponse>,
        ) => {
          const data = event.data;

          if (data.type === 'progress') {
            setCurrentStepIndex((currentIndex) => {
              return currentIndex + 1;
            });
          } else if (data.type === 'result') {
            setCurrentStepIndex(steps.length);
            worker.terminate();
            channel.port1.close();
            resolve(data.migrationDuration);
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          channel.port1.close();
          reject(err);
        };
      });
    },
    onMutate: () => {
      setCurrentStepIndex(0);
    },
    onSuccess: async (migrationDuration, { server }) => {
      faro.api?.pushMeasurement({
        type: 'performance',
        values: {
          migration_and_seed_duration: migrationDuration,
        },
      });

      createGameWorld({ server });
      await navigate(`/game/${server.slug}/v-1/resources`);
    },
    onError: (_, { server }) => deleteGameWorld({ server }),
  });

  const form = useForm<z.infer<typeof createServerFormSchema>>({
    resolver: zodResolver(createServerFormSchema),
    defaultValues: {
      seed: '',
      name: '',
      configuration: {
        speed: '1',
        mapSize: '100',
      },
      playerConfiguration: {
        name: 'Player',
        tribe: 'gauls',
      },
      gameplay: {
        areOfflineNpcAttacksEnabled: true,
      },
    },
  });

  const onSubmit = (values: z.infer<typeof createServerFormSchema>) => {
    const id = crypto.randomUUID();
    const slug = `s-${id.slice(0, 4)}`;

    const server = {
      id: window.crypto.randomUUID(),
      slug,
      version: env.VERSION,
      createdAt: Date.now(),
      ...values,
    };

    // @ts-expect-error - Not an error, values for speed and mapSize are already cast as numbers
    createServer({ server });
  };

  useEffect(() => {
    const adjectiveIndex = randomInt(0, npcVillageNameAdjectives.length - 1);
    const nounIndex = randomInt(0, npcVillageNameNouns.length - 1);

    const adjective = npcVillageNameAdjectives[adjectiveIndex];
    const noun = npcVillageNameNouns[nounIndex];

    form.setValue('seed', generateSeed());
    form.setValue('name', `${adjective}${noun}`);
  }, [form]);

  if (isError) {
    console.error(error);

    return (
      <div className="flex flex-col gap-4 p-6 max-w-md mx-auto">
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          {error.message}
        </div>
        <Button onClick={() => window.location.reload()}>Back to form</Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={clsx(isPending && 'blur-sm pointer-events-none')}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-2 shadow-xl rounded-md border border-border"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <Text as="h2">Game world configuration</Text>
                  </div>
                  <FormField
                    control={form.control}
                    name="seed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seed</FormLabel>
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
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="New World"
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
                        <FormLabel>Size</FormLabel>
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
                            <SelectItem value="100">100x100</SelectItem>
                            <SelectItem value="200">200x200</SelectItem>
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
                        <FormLabel>Speed</FormLabel>
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
              </div>

              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <Text as="h2">Player configuration</Text>
                  </div>
                  <FormField
                    control={form.control}
                    name="playerConfiguration.name"
                    disabled={isPending || isSuccess}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
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
                        <FormLabel>Tribe</FormLabel>
                        <Select
                          disabled={isPending || isSuccess}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a tribe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="romans">Romans</SelectItem>
                            <SelectItem value="gauls">Gauls</SelectItem>
                            <SelectItem value="teutons">Teutons</SelectItem>
                            <SelectItem value="huns">Huns</SelectItem>
                            <SelectItem value="egyptians">Egyptians</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            <details>
              <summary className="py-2 underline hover:cursor-pointer">
                Advanced options
              </summary>
              <div className="space-y-4 px-2">
                <div className="flex flex-col">
                  <Text
                    className="text-lg"
                    as="h3"
                  >
                    Advanced gameplay options
                  </Text>
                  <Text>These options can be updated in-game at any time.</Text>
                </div>
                <FormField
                  control={form.control}
                  name="gameplay.areOfflineNpcAttacksEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex">
                        <div className="flex flex-4 gap-1 flex-col">
                          <FormLabel className="text-base">
                            Offline attacks (in development)
                          </FormLabel>
                          <Text>
                            By keeping this option enabled, enemies may send
                            attacks while you're offline.
                          </Text>
                        </div>
                        <div className="flex flex-1 justify-end items-center">
                          <FormControl>
                            <Switch
                              disabled
                              checked={field.value}
                              onCheckedChange={(v: boolean) =>
                                field.onChange(v)
                              }
                            />
                          </FormControl>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </details>
            <div className="flex justify-end">
              <Button
                size="fit"
                disabled={isPending || isSuccess}
                type="submit"
              >
                Create Server
              </Button>
            </div>
          </form>
        </Form>
      </div>
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs z-10 rounded-md">
          <div className="flex flex-col gap-4 p-6 shadow-2xl rounded-lg border border-border bg-background max-w-sm w-full mx-4">
            <div className="flex flex-col relative">
              <div
                className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-muted-foreground/20"
                aria-hidden="true"
              />
              {steps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div
                    key={step}
                    className="flex items-center gap-4 relative py-1.5"
                  >
                    <div
                      className={clsx(
                        'relative z-10 flex items-center justify-center size-6 rounded-full bg-background border-4 border-background box-content -ml-2.25',
                      )}
                    >
                      <div
                        className={clsx(
                          'size-3 rounded-full transition-colors duration-300',
                          isCompleted ? 'bg-success' : 'bg-muted-foreground/30',
                          isCurrent && 'bg-muted-foreground/60 animate-pulse',
                        )}
                      />
                    </div>
                    <Text
                      className={clsx(
                        'text-sm transition-all duration-300',
                        isCompleted && 'text-foreground font-medium',
                        isCurrent && 'text-primary font-bold',
                        !isCompleted && !isCurrent && 'text-muted-foreground',
                      )}
                    >
                      {step}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
