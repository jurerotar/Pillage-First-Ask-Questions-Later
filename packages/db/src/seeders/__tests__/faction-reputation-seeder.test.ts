import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { reputationLevels } from '@pillage-first/game-assets/reputation';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('factionReputationSeeder', () => {
  test('seeds player reputation toward every NPC faction tier', () => {
    const rows = database.selectObjects({
      sql: `
        SELECT
          source.faction AS sourceFaction,
          target.faction AS targetFaction,
          fr.reputation
        FROM
          faction_reputation fr
            JOIN faction_ids source ON source.id = fr.source_faction_id
            JOIN faction_ids target ON target.id = fr.target_faction_id
        ORDER BY
          target.faction;
      `,
      schema: z.strictObject({
        sourceFaction: z.string(),
        targetFaction: z.string(),
        reputation: z.number(),
      }),
    });

    expect(rows).toStrictEqual([
      {
        sourceFaction: 'player',
        targetFaction: 'npc1',
        reputation: reputationLevels.get('ecstatic')!,
      },
      {
        sourceFaction: 'player',
        targetFaction: 'npc2',
        reputation: reputationLevels.get('honored')!,
      },
      {
        sourceFaction: 'player',
        targetFaction: 'npc3',
        reputation: reputationLevels.get('respected')!,
      },
      {
        sourceFaction: 'player',
        targetFaction: 'npc4',
        reputation: reputationLevels.get('friendly')!,
      },
      {
        sourceFaction: 'player',
        targetFaction: 'npc5',
        reputation: reputationLevels.get('neutral')!,
      },
      {
        sourceFaction: 'player',
        targetFaction: 'npc6',
        reputation: reputationLevels.get('unfriendly')!,
      },
      {
        sourceFaction: 'player',
        targetFaction: 'npc7',
        reputation: reputationLevels.get('hostile')!,
      },
      {
        sourceFaction: 'player',
        targetFaction: 'npc8',
        reputation: reputationLevels.get('hated')!,
      },
    ]);
  });

  test('does not seed self-relations or NPC-sourced relations', () => {
    const invalidRelationCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          faction_reputation fr
            JOIN faction_ids source ON source.id = fr.source_faction_id
        WHERE
          source.faction != 'player'
          OR fr.source_faction_id = fr.target_faction_id;
      `,
      schema: z.number(),
    });

    expect(invalidRelationCount).toBe(0);
  });
});
