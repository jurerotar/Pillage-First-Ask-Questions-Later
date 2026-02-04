import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { document } from '../open-api.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const output = join(__dirname, '..', 'open-api.json');

await writeFile(output, JSON.stringify(document, null, 2));
