import { faro } from '@grafana/faro-web-sdk';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { randomInt } from 'moderndash';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import {
  npcVillageNameAdjectives,
  npcVillageNameNouns,
} from '@pillage-first/game-assets/village';
import type { Server } from '@pillage-first/types/models/server';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { CreateNewGameWorldWorkerPayload } from 'app/(public)/(game-worlds)/(create)/workers/create-new-game-world-worker';
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
} from 'app/components/ui/select';
import { Switch } from 'app/components/ui/switch';
import { env } from 'app/env';
import { workerFactory } from 'app/utils/workers';

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
      .enum(['100', '200', '300'])
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
  const navigate = useNavigate();
  const { createGameWorld, deleteGameWorld } = useGameWorldActions();

  const {
    mutate: createServer,
    isError,
    error,
    isPending,
    isSuccess,
  } = useMutation<void, Error, MutateArgs>({
    mutationFn: async ({ server }) => {
      const { migrationDuration } = await workerFactory<
        CreateNewGameWorldWorkerPayload,
        { migrationDuration: number }
      >(CreateNewGameWorldWorker, {
        server,
      });

      faro.api.pushMeasurement({
        type: 'performance',
        values: {
          migration_and_seed_duration: migrationDuration,
        },
      });
    },
    onSuccess: async (_, { server }) => {
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
      </div>
    );
  }

  return (
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
                        <SelectItem value="300">300x300</SelectItem>
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
                        By keeping this option enabled, enemies may send attacks
                        while you're offline.
                      </Text>
                    </div>
                    <div className="flex flex-1 justify-end items-center">
                      <FormControl>
                        <Switch
                          disabled
                          checked={field.value}
                          onCheckedChange={(v: boolean) => field.onChange(v)}
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
  );
};
