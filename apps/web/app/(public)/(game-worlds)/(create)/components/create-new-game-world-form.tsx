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
import type { ServerEffect } from '@pillage-first/types/models/effect';
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
import { Alert } from 'app/components/ui/alert';
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
} from 'app/components/ui/select';
import { Slider } from 'app/components/ui/slider';
import { Switch } from 'app/components/ui/switch';

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

type CreateServerFormValues = z.infer<typeof createServerFormSchema>;

const createServerFromFormValues = (values: CreateServerFormValues) => {
  const id = crypto.randomUUID();
  const slug = `s-${id.slice(0, 4)}`;

  return {
    id: window.crypto.randomUUID(),
    slug,
    version: env.VERSION,
    createdAt: Date.now(),
    ...values,
    configuration: {
      ...values.configuration,
      speed: 1,
    },
  };
};

const flowSteps = ['Basics', 'Effects', 'Create'];

const speedControlledServerEffects = [
  {
    id: 'merchantCapacity',
    label: 'Merchant capacity',
    description: 'Controls how much each merchant can carry.',
    mode: 'increase',
  },
  {
    id: 'merchantSpeed',
    label: 'Merchant speed',
    description: 'Controls trade route and merchant travel speed.',
    mode: 'increase',
  },
  {
    id: 'resourceProduction',
    label: 'Resource production',
    description: 'Controls server-wide wood, clay, iron, and wheat production.',
    mode: 'increase',
  },
  {
    id: 'unitSpeed',
    label: 'Unit speed',
    description: 'Controls troop movement speed.',
    mode: 'increase',
  },
  {
    id: 'durations',
    label: 'Duration speed',
    description:
      'Controls all training, building, research, and improvement durations.',
    mode: 'decrease',
  },
] as const satisfies readonly {
  id: ServerEffect['id'] | 'durations' | 'resourceProduction';
  label: string;
  description: string;
  mode: 'increase' | 'decrease';
}[];

type SpeedControlledServerEffectId =
  (typeof speedControlledServerEffects)[number]['id'];

type EffectSliderValues = Record<SpeedControlledServerEffectId, number>;

const createDefaultEffectSliderValues = (): EffectSliderValues => {
  return speedControlledServerEffects.reduce((acc, { id }) => {
    acc[id] = 1;
    return acc;
  }, {} as EffectSliderValues);
};

type MutateArgs = {
  server: Server;
};

export const CreateNewGameWorldForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createGameWorld, deleteGameWorld } = useGameWorldActions();
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [effectSliderValues, setEffectSliderValues] =
    useState<EffectSliderValues>(createDefaultEffectSliderValues);

  const generationSteps = [
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
            setCurrentStepIndex(generationSteps.length);
            worker.terminate();
            channel.port1.close();
            resolve(data.migrationDuration);
          } else if (data.type === 'error') {
            console.error(
              `Game world seeding failed. Message: ${data.message}`,
            );

            worker.terminate();
            channel.port1.close();
            reject(new Error(data.message));
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

  const form = useForm<CreateServerFormValues>({
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

  const onInitialSubmit = () => {
    form.setValue('configuration.speed', '1');
    setActiveStepIndex(1);
  };

  const startGeneration = (values: CreateServerFormValues) => {
    const server = createServerFromFormValues(values);

    setActiveStepIndex(2);

    // @ts-expect-error - Not an error, values for speed and mapSize are already cast as numbers
    createServer({ server });
  };

  const updateEffectSliderValue = (
    effectId: SpeedControlledServerEffectId,
    value: number,
  ) => {
    setEffectSliderValues((currentValues) => ({
      ...currentValues,
      [effectId]: value,
    }));
  };

  useEffect(() => {
    const adjectiveIndex = randomInt(0, npcVillageNameAdjectives.length - 1);
    const nounIndex = randomInt(0, npcVillageNameNouns.length - 1);

    const adjective = npcVillageNameAdjectives[adjectiveIndex];
    const noun = npcVillageNameNouns[nounIndex];

    form.setValue('seed', generateSeed());
    form.setValue('name', `${adjective}${noun}`);
  }, [form]);

  return (
    <Form {...form}>
      <div className="space-y-4 p-2 shadow-xl rounded-md border border-border overflow-hidden">
        <div className="px-2 pt-2">
          <div className="relative flex items-center justify-between gap-2">
            <div
              className="absolute left-0 right-0 top-4 h-0.5 bg-muted"
              aria-hidden="true"
            />
            <div
              className="absolute left-0 top-4 h-0.5 bg-primary transition-all duration-500 ease-out"
              style={{
                width: `${(activeStepIndex / (flowSteps.length - 1)) * 100}%`,
              }}
              aria-hidden="true"
            />
            {flowSteps.map((step, index) => {
              const isCompleted = index < activeStepIndex;
              const isCurrent = index === activeStepIndex;

              return (
                <div
                  key={step}
                  className="relative z-10 flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className={clsx(
                      'flex size-8 items-center justify-center rounded-full border bg-background text-sm font-medium transition-all duration-300',
                      isCompleted &&
                        'border-primary bg-primary text-primary-foreground',
                      isCurrent && 'border-primary text-primary shadow-sm',
                      !isCompleted &&
                        !isCurrent &&
                        'border-muted text-muted-foreground',
                    )}
                  >
                    {index + 1}
                  </div>
                  <Text
                    className={clsx(
                      'text-xs font-medium transition-colors',
                      !isCurrent && 'text-muted-foreground',
                    )}
                  >
                    {step}
                  </Text>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${activeStepIndex * 100}%)` }}
          >
            <section className="w-full shrink-0 p-2">
              <form
                onSubmit={form.handleSubmit(onInitialSubmit)}
                className="space-y-4"
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
                          <FormItem className="space-y-2">
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
                          <FormItem className="space-y-2">
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
                          <FormItem className="space-y-2">
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
                          <FormItem className="space-y-2">
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
                          <FormItem className="space-y-2">
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
                                <SelectItem value="egyptians">
                                  Egyptians
                                </SelectItem>
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
                      <Text>
                        These options can be updated in-game at any time.
                      </Text>
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
                    Continue
                  </Button>
                </div>
              </form>
            </section>

            <section className="w-full shrink-0 p-2">
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <Text as="h2">Server effect tuning</Text>
                  <Text variant="muted">
                    These sliders mirror the server effects currently controlled
                    by speed. For this test, the generated game world still uses
                    speed 1.
                  </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {speedControlledServerEffects.map((effect) => {
                    const value = effectSliderValues[effect.id];
                    const displayValue = `${value}x`;

                    return (
                      <div
                        key={effect.id}
                        className="space-y-3 rounded-md border border-border bg-background/60 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <Text as="h3">{effect.label}</Text>
                            <Text
                              variant="muted"
                              className="text-sm"
                            >
                              {effect.description}
                            </Text>
                          </div>
                          <Text className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-sm font-medium">
                            {displayValue}
                          </Text>
                        </div>
                        <div className="flex items-center gap-3">
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[value]}
                            marks={[1, 10]}
                            disabled={isPending || isSuccess}
                            onValueChange={([nextValue]) =>
                              updateEffectSliderValue(effect.id, nextValue)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button
                    size="fit"
                    variant="outline"
                    disabled={isPending || isSuccess}
                    onClick={() => setActiveStepIndex(0)}
                  >
                    Back
                  </Button>
                  <Button
                    size="fit"
                    disabled={isPending || isSuccess}
                    onClick={form.handleSubmit(startGeneration)}
                  >
                    Create world
                  </Button>
                </div>
              </div>
            </section>

            <section className="w-full shrink-0 p-2">
              <div className="flex min-h-96 items-center justify-center">
                <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-2xl">
                  <div className="space-y-1">
                    <Text as="h2">Creating game world</Text>
                    <Text variant="muted">
                      Keep this page open while the initial game state is
                      generated.
                    </Text>
                  </div>

                  <div className="flex flex-col relative">
                    <div
                      className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-muted-foreground/20"
                      aria-hidden="true"
                    />
                    {generationSteps.map((step, index) => {
                      const isCompleted = index < currentStepIndex;
                      const isCurrent = index === currentStepIndex;

                      return (
                        <div
                          key={step}
                          className="flex items-center gap-4 relative py-1.5"
                        >
                          <div className="relative z-10 flex items-center justify-center size-6 rounded-full bg-background border-4 border-background box-content -ml-2.25">
                            <div
                              className={clsx(
                                'size-3 rounded-full transition-colors duration-300',
                                isCompleted
                                  ? 'bg-success'
                                  : 'bg-muted-foreground/30',
                                isCurrent &&
                                  'bg-muted-foreground/60 animate-pulse',
                              )}
                            />
                          </div>
                          <Text
                            className={clsx(
                              'text-sm transition-all duration-300',
                              isCompleted && 'text-foreground font-medium',
                              isCurrent && 'text-primary font-bold',
                              !isCompleted &&
                                !isCurrent &&
                                'text-muted-foreground',
                            )}
                          >
                            {step}
                          </Text>
                        </div>
                      );
                    })}
                  </div>

                  {isError && <Alert variant="error">{error.message}</Alert>}

                  {isError && (
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                      <Button
                        size="fit"
                        variant="outline"
                        onClick={() => setActiveStepIndex(1)}
                      >
                        Back to effects
                      </Button>
                      <Button
                        size="fit"
                        onClick={form.handleSubmit(startGeneration)}
                      >
                        Try again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Form>
  );
};
