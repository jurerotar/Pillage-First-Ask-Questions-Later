import { glob, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EXPORT_PATH = join('node_modules', '@pillage-first', 'dev');
const STATEMENTS_EXPORT_PATH = join(EXPORT_PATH, 'statements.sql');

const FUNCTIONS = ['selectObjects', 'selectValue', 'selectValues', 'selectObject', 'exec'];

(async (): Promise<void> => {
  const sqlStatements = new Set<string>();
  const variableDefinitions = new Map<string, string>();

  const pendingVariableResolutions: string[] = [];

  for await (const entry of glob('packages/api/src/**/*.ts')) {
    if (entry.endsWith('api-worker.ts')) {
      continue;
    }
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
      const funcRegex = new RegExp(`(?:database|db|this)\\.${func}\\(\\s*(\`[\\s\\S]*?\`|'[^']*?'|"[^"]*?"|\\w+)`, 'g');
      let funcMatch;
      while ((funcMatch = funcRegex.exec(content)) !== null) {
        const arg = funcMatch[1];
        if (arg.startsWith('`') || arg.startsWith("'") || arg.startsWith('"')) {
          let sql = arg.slice(1, -1).trim();
          sql = sql.replace(/\${[\s\S]*?}/g, '?');
          sqlStatements.add(sql);
        } else {
          pendingVariableResolutions.push(arg);
        }
      }
    }
  }

  // Resolve pending variables
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
    '-- Extracted SQL statements',
    `-- Generated: ${new Date().toISOString()}`,
    '',
    ...sortedStatements.flatMap((s, i) => [
      `-- Statement ${i + 1}`,
      s,
      ''
    ]),
  ].join('\n');

  await writeFile(STATEMENTS_EXPORT_PATH, output, 'utf8');

  const statementsUrl = pathToFileURL(resolve(STATEMENTS_EXPORT_PATH)).href;
  console.log(`✅ Extracted ${sortedStatements.length} SQL statements to: ${statementsUrl}`);
})();
