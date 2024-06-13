import type { Server } from 'interfaces/models/game/server';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';
import type { Hero } from 'interfaces/models/game/hero';
import { heroFactory } from 'app/factories/hero-factory';

export type GenerateHeroWorkerPayload = {
  server: Server;
};

export type GenerateHeroWorkerReturn = {
  hero: Hero;
};

self.addEventListener('message', async (event: MessageEvent<GenerateHeroWorkerPayload>) => {
  const { server } = event.data;

  const hero = heroFactory(server);

  self.postMessage({ hero });

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<Hero>(serverHandle, 'hero', hero);

  self.close();
});
