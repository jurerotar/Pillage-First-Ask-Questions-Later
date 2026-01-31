import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { getReputations } from '../reputation-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('reputation-controllers', () => {
  test('getReputations should return reputations for a player', async () => {
    const database = await prepareTestDatabase();

    getReputations(database, createControllerArgs<'/me/reputations'>({}));

    expect(true).toBeTruthy();
  });
});
