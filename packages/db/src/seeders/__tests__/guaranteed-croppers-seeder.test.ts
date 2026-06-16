import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

const checkCropperCount = (rfc: string, minCount: number) => {
  const goodCroppersCount = database.selectObjects({
    sql: `
      SELECT
        t.id
      FROM
        oasis o
          JOIN tiles ot ON ot.id = o.tile_id
          JOIN tiles t ON t.x BETWEEN ot.x - 3 AND ot.x + 3
          AND t.y BETWEEN ot.y - 3 AND ot.y + 3
          JOIN resource_field_composition_ids rfc_id ON rfc_id.id = t.resource_field_composition_id
      WHERE
        o.resource = 'wheat'
        AND o.bonus = 50
        AND t.type = 'free'
        AND rfc_id.resource_field_composition = $rfc
      GROUP BY
        t.id
      HAVING
        COUNT(DISTINCT o.tile_id) >= 3;
    `,
    bind: {
      $rfc: rfc,
    },
    schema: z.strictObject({ id: z.number() }),
  });

  expect(goodCroppersCount.length).toBeGreaterThanOrEqual(minCount);
};

describe('guaranteedCroppersSeeder', () => {
  test('seeds at least 4 00018 tiles with 150% wheat bonus', () => {
    checkCropperCount('00018', 4);
  });

  test('seeds at least 12 11115 tiles with 150% wheat bonus', () => {
    checkCropperCount('11115', 12);
  });

  test('seeds at least 20 3339 tiles with 150% wheat bonus', () => {
    checkCropperCount('3339', 20);
  });
});
