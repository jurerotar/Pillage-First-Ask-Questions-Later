import type { DbFacade } from '@pillage-first/utils/facades/database';

// This function should only contain db upgrades between app's minor version bumps. At that point, these DB changes
// should already be part of the new schema, so contents of this function should be deleted
export const upgradeDb = (_database: DbFacade): void => {};
