import { z } from 'zod';
import {
  deleteFiltersQuery,
  insertFiltersQuery,
  selectActiveFiltersQuery,
} from '../../queries/filter-queries';
import { createController } from '../controller';

export const getFilters = createController('/me/filters/:name', {
  summary: 'Get active filters by name',
  requestParams: {
    path: z.strictObject({
      name: z.string().min(1),
    }),
  },
  response: z.array(z.string()),
})(({ database, context: { playerId }, path: { name } }) => {
  return database.selectValues({
    sql: selectActiveFiltersQuery,
    bind: { $player_id: playerId, $name: name },
    schema: z.string(),
  });
});

export const updateFilters = createController('/me/filters/:name', 'patch', {
  summary: 'Update active filters by name',
  requestParams: {
    path: z.strictObject({
      name: z.string().min(1),
    }),
  },
  requestBody: z.strictObject({
    filters: z.array(z.string()),
  }),
})(({ database, context: { playerId }, path: { name }, body: { filters } }) => {
  database.transaction((tx) => {
    tx.exec({
      sql: deleteFiltersQuery,
      bind: { $player_id: playerId, $name: name },
    });
    tx.exec({
      sql: insertFiltersQuery,
      bind: {
        $player_id: playerId,
        $name: name,
        $filters: JSON.stringify(filters),
      },
    });
  });
});
