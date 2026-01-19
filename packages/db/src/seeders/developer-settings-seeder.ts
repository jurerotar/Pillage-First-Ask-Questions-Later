import type { Seeder } from '../types/seeder';

export const developerSettingsSeeder: Seeder = (database): void => {
  database.exec(
    `
      INSERT INTO
        developer_settings (
        is_instant_building_construction_enabled,
        is_instant_unit_training_enabled,
        is_instant_unit_improvement_enabled,
        is_instant_unit_research_enabled,
        is_free_building_construction_enabled,
        is_free_unit_training_enabled,
        is_free_unit_improvement_enabled,
        is_free_unit_research_enabled
      )
      VALUES
        (0, 0, 0, 0, 0, 0, 0, 0)
    `,
  );
};
