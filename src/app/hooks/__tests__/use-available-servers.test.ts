import { beforeAll, expect } from 'vitest';
import { serverMock } from 'mocks/game/server-mock';
import { initializeServer } from 'app/[public]/components/create-server-modal-content';
import { deleteServerData } from 'app/hooks/use-available-servers';
import { getRootHandle } from 'app/utils/opfs';
import 'packages/vitest-opfs-mock';

beforeAll(async () => {
  await initializeServer({ server: serverMock });
});

test('Server deletion should remove server directory', async () => {
  await deleteServerData(serverMock);

  const root = await getRootHandle();

  let serverDirectoryStillExists = false;

  for await (const serverSlug of root.keys()) {
    if (serverSlug === serverMock.slug) {
      serverDirectoryStillExists = true;
    }
  }

  expect(serverDirectoryStillExists).toBe(false);
});
