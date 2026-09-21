import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const EXPORT_PATH = join('node_modules', '@pillage-first', 'dev');
const SEEDER_STATEMENTS_EXPORT_PATH = join(
  EXPORT_PATH,
  'seeder-statements.sql',
);

const FUNCTIONS = [
  'selectObjects',
  'selectValue',
  'selectValues',
  'selectObject',
  'exec',
  'prepare',
];

const constRegex =
  /(?:export\s+)?const\s+(\w+)\s*=\s*(`[\s\S]*?`|'[\s\S]*?'|"[\s\S]*?");/g;

interface SourceFile {
  content: string;
  definitions: Map<string, string>;
}

const extractStringDefinitions = (content: string): Map<string, string> => {
  const definitions = new Map<string, string>();

  for (const constMatch of findMatches(constRegex, content)) {
    const name = constMatch[1];
    const value = constMatch[2].slice(1, -1);
    definitions.set(name, value);
  }

  return definitions;
};

const findMatches = (regex: RegExp, content: string): RegExpExecArray[] => {
  const matches: RegExpExecArray[] = [];
  regex.lastIndex = 0;

  let match: RegExpExecArray | null = regex.exec(content);
  while (match !== null) {
    matches.push(match);
    match = regex.exec(content);
  }

  regex.lastIndex = 0;

  return matches;
};

const resolveTemplate = (
  value: string,
  definitions: Map<string, string>,
  resolving = new Set<string>(),
): string => {
  return value.replace(
    /\$\{\s*([A-Za-z_$][\w$]*)\s*\}/g,
    (match, name: string) => {
      if (resolving.has(name)) {
        return match;
      }

      const definition = definitions.get(name);
      if (definition === undefined) {
        return match;
      }

      resolving.add(name);
      const resolved = resolveTemplate(definition, definitions, resolving);
      resolving.delete(name);

      return resolved;
    },
  );
};

const stripSqlComments = (sql: string): string => {
  let result = '';
  let quotedString: '"' | "'" | null = null;
  let isLineComment = false;
  let isBlockComment = false;

  for (let index = 0; index < sql.length; index++) {
    const character = sql[index];
    const nextCharacter = sql[index + 1];

    if (isLineComment) {
      if (character === '\n') {
        result += '\n';
        isLineComment = false;
      }
      continue;
    }

    if (isBlockComment) {
      if (character === '*' && nextCharacter === '/') {
        index++;
        isBlockComment = false;
      } else if (character === '\n') {
        result += '\n';
      }
      continue;
    }

    if (quotedString !== null) {
      result += character;

      if (character === quotedString) {
        if (nextCharacter === quotedString) {
          result += nextCharacter;
          index++;
        } else {
          quotedString = null;
        }
      }

      continue;
    }

    if (character === '"' || character === "'") {
      result += character;
      quotedString = character;
      continue;
    }

    if (character === '-' && nextCharacter === '-') {
      index++;
      isLineComment = true;
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      index++;
      isBlockComment = true;
      continue;
    }

    result += character;
  }

  return result;
};

const normalizeStatement = (statement: string): string => {
  let cleaned = stripSqlComments(statement).replace(/\s+/g, ' ').trim();

  if (!cleaned.endsWith(';')) {
    cleaned += ';';
  }

  return cleaned;
};

(async (): Promise<void> => {
  const sqlStatements = new Set<string>();
  const globalDefinitions = new Map<string, string>();
  const sourceFiles: SourceFile[] = [];

  for await (const entry of glob('packages/db/src/seeders/**/*.ts')) {
    const content = await readFile(entry, 'utf8');
    const definitions = extractStringDefinitions(content);

    for (const [name, value] of definitions) {
      globalDefinitions.set(name, value);
    }

    sourceFiles.push({ content, definitions });
  }

  for (const { content, definitions: fileDefinitions } of sourceFiles) {
    const definitions = new Map([...globalDefinitions, ...fileDefinitions]);

    // Find function calls
    for (const func of FUNCTIONS) {
      // Matches:
      // database.func({ sql: 'sql' })
      // database.func({ sql: `sql` })
      // database.func({ sql: variable })
      // database.func({ sql })
      const funcRegex = new RegExp(
        `(?:database|db|this)\\.${func}\\(\\s*(?:\\{\\s*sql:\\s*)?(\`[\\s\\S]*?\`|'[^']*?'|"[^"]*?"|\\w+)`,
        'g',
      );
      for (const funcMatch of findMatches(funcRegex, content)) {
        const arg = funcMatch[1];
        if (arg.startsWith('`') || arg.startsWith("'") || arg.startsWith('"')) {
          const sql = resolveTemplate(arg.slice(1, -1).trim(), definitions);
          sqlStatements.add(sql);
        } else {
          const sql = definitions.get(arg);
          if (sql) {
            sqlStatements.add(resolveTemplate(sql.trim(), definitions));
          }
        }
      }

      // Handle { sql } shorthand
      const shorthandRegex = new RegExp(
        `(?:database|db|this)\\.${func}\\(\\s*\\{\\s*(\\w+)\\s*(?:,[\\s\\S]*?)?\\s*\\}`,
        'g',
      );
      for (const shorthandMatch of findMatches(shorthandRegex, content)) {
        const arg = shorthandMatch[1];
        const sql = definitions.get(arg);
        if (sql) {
          sqlStatements.add(resolveTemplate(sql.trim(), definitions));
        }
      }
    }
  }

  const sortedStatements = Array.from(sqlStatements)
    .filter((s) => s.length > 0)
    .map(normalizeStatement)
    .filter((s) => s !== ';')
    .sort();

  const output = [
    '-- Extracted Seeder SQL statements',
    `-- Generated: ${new Date().toISOString()}`,
    '',
    ...sortedStatements,
  ].join('\n');

  await mkdir(dirname(SEEDER_STATEMENTS_EXPORT_PATH), { recursive: true });
  await writeFile(SEEDER_STATEMENTS_EXPORT_PATH, output, 'utf8');

  const statementsUrl = pathToFileURL(
    resolve(SEEDER_STATEMENTS_EXPORT_PATH),
  ).href;
  // biome-ignore lint/suspicious/noConsole: This script reports the generated file path in CLI output.
  console.log(
    `✅ Extracted ${sortedStatements.length} Seeder SQL statements to: ${statementsUrl}`,
  );
})();
