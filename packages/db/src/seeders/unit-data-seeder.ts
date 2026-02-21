import { units } from '@pillage-first/game-assets/units';
import type { Unit } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const unitDataSeeder = (database: DbFacade): void => {
  const unitDataToInsert: [Unit['id'], number][] = [];

  for (const unit of units) {
    unitDataToInsert.push([unit.id, unit.unitWheatConsumption]);
  }

  batchInsert(
    database,
    'unit_data',
    ['unit_id', 'wheat_consumption'],
    unitDataToInsert,
  );
};
