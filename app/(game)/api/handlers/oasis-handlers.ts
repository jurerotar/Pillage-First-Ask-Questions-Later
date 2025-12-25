import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';
import type { ApiHandler } from 'app/interfaces/api';
import type { Resource } from 'app/interfaces/models/game/resource';

// TODO: Move this to an util function that's called after combat, once combat is added
export const occupyOasis: ApiHandler<'oasisId' | 'villageId'> = (
  database,
  args,
) => {
  const {
    params: { oasisId, villageId },
  } = args;
  // TODO: Add Hero's mansion level & empty oasis slot check

  database.transaction((db) => {
    updateVillageResourcesAt(db, villageId, Date.now());

    const oasisFieldsRows = db.selectObjects(
      `
        SELECT resource,
               bonus
        FROM oasis
        WHERE tile_id = $tile_id;
      `,
      {
        $tile_id: oasisId,
      },
    ) as { resource: Resource; bonus: number }[];

    for (const { resource, bonus } of oasisFieldsRows) {
      const effectId = `${resource}Production`;
      const value = bonus === 25 ? 1.25 : 1.5;

      db.exec(
        `
          INSERT INTO effects (effect_id, value, type, scope, source, village_id, source_specifier)
          VALUES ((SELECT id FROM effect_ids WHERE effect = $effect_id), $value, $type, $scope, $source, $village_id, $source_specifier);
        `,
        {
          $effect_id: effectId,
          $value: value,
          $type: 'bonus',
          $scope: 'village',
          $source: 'oasis',
          $village_id: villageId,
          $source_specifier: oasisId,
        },
      );
    }

    db.exec(
      `
        UPDATE oasis
        SET village_id = $village_id
        WHERE tile_id = $oasis_tile_id;
      `,
      {
        $oasis_tile_id: oasisId,
        $village_id: villageId,
      },
    );
  });
};

export const abandonOasis: ApiHandler<'oasisId' | 'villageId'> = (
  database,
  args,
) => {
  const {
    params: { oasisId, villageId },
  } = args;

  database.transaction((db) => {
    updateVillageResourcesAt(db, villageId, Date.now());

    db.exec(
      `
        DELETE
        FROM effects
        WHERE source = 'oasis'
          AND village_id = $village_id
          AND source_specifier = $source_specifier;
      `,
      {
        $village_id: villageId,
        $source_specifier: oasisId,
      },
    );

    db.exec(
      `
        UPDATE oasis
        SET village_id = NULL
        WHERE tile_id = $oasis_tile_id
          AND village_id = $village_id;
      `,
      {
        $oasis_tile_id: oasisId,
        $village_id: villageId,
      },
    );
  });
};
