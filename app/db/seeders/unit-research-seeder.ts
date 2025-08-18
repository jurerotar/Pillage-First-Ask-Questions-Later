import type { Database } from 'app/interfaces/models/common';

const sql = `
  INSERT INTO unit_research (village_id, unit_id)
  VALUES (?, ?);
`;

export const unitResearchSeeder = (database: Database): void => {
  const researches: [string, string][] = [
    ['village_1', 'spear'],
    ['village_1', 'axe'],
    ['village_2', 'phalanx'],
    ['village_2', 'swordsman'],
  ];

  const stmt = database.prepare(sql);

  for (const [villageId, unitId] of researches) {
    stmt.bind([villageId, unitId]).stepReset();
  }

  stmt.finalize();
};
