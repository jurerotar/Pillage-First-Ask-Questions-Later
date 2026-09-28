import { z } from 'zod';
import {
  deleteFiltersQuery,
  insertFiltersQuery,
  selectActiveFiltersQuery,
} from '../../queries/filter-queries';
import { createController } from '../controller';

export const getFilters = createController('/players/:playerId/filters/:name', {
  summary: 'Get active filters by name',
  requestParams: {
    path: z.strictObject({
      playerId: z.coerce.number(),
      name: z.string().min(1),
    }),
  },
  response: z.array(z.string()),
})(({ database, path: { playerId, name } }) => {
  return database.selectValues({
    sql: selectActiveFiltersQuery,
    bind: { $player_id: playerId, $name: name },
    schema: z.string(),
  });
});

export const updateFilters = createController(
  '/players/:playerId/filters/:name',
  'patch',
  {
    summary: 'Update active filters by name',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
        name: z.string().min(1),
      }),
    },
    requestBody: z.strictObject({
      filters: z.array(z.string()),
    }),
  },
)(({ database, path: { playerId, name }, body: { filters } }) => {
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
