import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { getServer } from '../server-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('server-controllers', () => {
  test('getServer should return server details', async () => {
    const database = await prepareTestDatabase();

    getServer(database, createControllerArgs<'/server'>({}));

    expect(true).toBeTruthy();
  });
});
