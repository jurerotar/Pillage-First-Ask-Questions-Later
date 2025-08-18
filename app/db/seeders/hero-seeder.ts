import type { Database } from 'app/interfaces/models/common';

const sql = `
  INSERT INTO heroes (
    experience,
    health,
    attack_power,
    resource_production,
    attack_bonus,
    defence_bonus,
    resource_to_produce,
    adventure_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
`;

export const heroSeeder = (database: Database): void => {
  database.exec({
    sql,
    bind: [
      0, // experience
      100, // health
      0, // attack_power
      4, // resource_production
      0, // attack_bonus
      0, // defence_bonus
      'shared', // resource_to_produce
      0, // adventure_count
    ],
  });
};
