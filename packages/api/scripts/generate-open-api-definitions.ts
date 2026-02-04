import { dirname, join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { document } from '../open-api.ts';
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const output = join(__dirname, '..', 'open-api.json');

await writeFile(output, JSON.stringify(document, null, 2));
