import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { document } from '../open-api.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const output = join(__dirname, '..', 'open-api.json');

const jsonString = JSON.stringify(document, null, 2);

// Replaced colon-prefixed path parameters (e.g., `:playerId`) with curly brace-enclosed parameters (e.g., `{playerId}`) to comply with OpenAPI specifications.
const outputContent = jsonString.replace(
  /"\/([^"]*):([^"/]+)([^"]*)"/g,
  (match) => {
    return match.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
  },
);

await writeFile(output, outputContent);
