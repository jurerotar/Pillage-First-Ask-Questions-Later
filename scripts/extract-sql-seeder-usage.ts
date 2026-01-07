import { glob, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EXPORT_PATH = join('node_modules', '@pillage-first', 'dev');
const SEEDER_STATEMENTS_EXPORT_PATH = join(EXPORT_PATH, 'seeder-statements.sql');

const FUNCTIONS = ['selectObjects', 'selectValue', 'selectValues', 'selectObject', 'exec', 'selectArrays', 'prepare'];

(async (): Promise<void> => {
  const sqlStatements = new Set<string>();
  const variableDefinitions = new Map<string, string>();

  const pendingVariableResolutions: string[] = [];

  for await (const entry of glob('packages/db/src/seeders/**/*.ts')) {
    const content = await readFile(entry, 'utf8');

    // Find exported const strings
    const constRegex = /export\s+const\s+(\w+)\s*=\s*(`[\s\S]*?`|'[\s\S]*?'|"[\s\S]*?");/g;
    let constMatch;
    while ((constMatch = constRegex.exec(content)) !== null) {
      const name = constMatch[1];
      const value = constMatch[2].slice(1, -1); // remove quotes/backticks
      variableDefinitions.set(name, value);
    }

    // Find function calls
    for (const func of FUNCTIONS) {
      // Matches:
      // database.func('sql')
      // database.func(`sql`)
      // database.func("sql")
      // database.func(variable)
      // database.func({ sql: 'sql' })
      // database.func({ sql: `sql` })
      // database.func({ sql: variable })
      // database.func({ sql })
      const funcRegex = new RegExp(`(?:database|db|this)\\.${func}\\(\\s*(?:\\{\\s*sql:\\s*)?(\`[\\s\\S]*?\`|'[^']*?'|"[^"]*?"|\\w+)`, 'g');
      let funcMatch;
      while ((funcMatch = funcRegex.exec(content)) !== null) {
        const arg = funcMatch[1];
        if (arg.startsWith('`') || arg.startsWith("'") || arg.startsWith('"')) {
          let sql = arg.slice(1, -1).trim();
          sql = sql.replace(/\$\{([\s\S]*?)\}/g, (_, p1) => `\${${p1}}`);
          sqlStatements.add(sql);
        } else {
          pendingVariableResolutions.push(arg);
        }
      }

      // Handle { sql } shorthand
      const shorthandRegex = new RegExp(`(?:database|db|this)\\.${func}\\(\\s*\\{\\s*(\\w+)\\s*(?:,[\\s\\S]*?)?\\s*\\}`, 'g');
      let shorthandMatch;
      while ((shorthandMatch = shorthandRegex.exec(content)) !== null) {
        const arg = shorthandMatch[1];
        if (arg === 'sql') {
          // This matches { sql } or { sql, bind: ... }
          // We already have 'sql' in pendingVariableResolutions if it matched the first regex?
          // Actually the first regex (?:\{\s*sql:\s*)? expects a colon for the { part.
          // So { sql } won't match the first one.
          pendingVariableResolutions.push('sql');
        }
      }
    }
  }

  // Resolve pending variables
  for await (const entry of glob('packages/db/src/seeders/**/*.ts')) {
    const content = await readFile(entry, 'utf8');
    const constRegex = /(?:export\s+)?const\s+(\w+)\s*=\s*(`[\s\S]*?`|'[\s\S]*?'|"[\s\S]*?");/g;
    let constMatch;
    while ((constMatch = constRegex.exec(content)) !== null) {
      const name = constMatch[1];
      let value = constMatch[2].slice(1, -1).trim();
      value = value.replace(/\$\{([\s\S]*?)\}/g, (_, p1) => `\${${p1}}`);
      variableDefinitions.set(name, value);
    }
  }

  for (const arg of pendingVariableResolutions) {
    const val = variableDefinitions.get(arg);
    if (val) {
      sqlStatements.add(val.trim());
    }
  }

  const sortedStatements = Array.from(sqlStatements)
    .filter(s => s.length > 0)
    .map(s => {
      let cleaned = s.trim();
      if (!cleaned.endsWith(';')) {
        cleaned += ';';
      }
      return cleaned;
    })
    .sort();

  const output = [
    '-- Extracted Seeder SQL statements',
    `-- Generated: ${new Date().toISOString()}`,
    '',
    ...sortedStatements.flatMap((s, i) => [
      `-- Statement ${i + 1}`,
      s,
      ''
    ]),
  ].join('\n');

  await writeFile(SEEDER_STATEMENTS_EXPORT_PATH, output, 'utf8');

  const statementsUrl = pathToFileURL(resolve(SEEDER_STATEMENTS_EXPORT_PATH)).href;
  console.log(`✅ Extracted ${sortedStatements.length} Seeder SQL statements to: ${statementsUrl}`);
})();
