import { execSync } from 'node:child_process';
import { glob, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  jsDocumentCommentsToOpenApi,
  parseFile,
  SpecBuilder,
  swaggerJsDocumentCommentsToOpenApi,
} from '@visulima/jsdoc-open-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Pillage First API',
      version: '1.0.0',
      description: 'Worker-API definition for the Pillage First! game.',
      license: {
        name: 'AGPL-3.0-or-later',
        url: 'https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/blob/main/LICENSE.md',
      },
    },
  },
};

const spec = new SpecBuilder(options.swaggerDefinition);

const rootDir = join(__dirname, '..');

const files = glob('src/handlers/*-handlers.ts', {
  cwd: rootDir,
});

for await (const file of files) {
  const fullPath = join(rootDir, file);
  const parsedJsDocumentFile = parseFile(fullPath, jsDocumentCommentsToOpenApi);
  spec.addData(parsedJsDocumentFile.map((item) => item.spec));

  const parsedSwaggerJsDocumentFile = parseFile(
    fullPath,
    swaggerJsDocumentCommentsToOpenApi,
  );
  spec.addData(parsedSwaggerJsDocumentFile.map((item) => item.spec));
}

const output = join(__dirname, '..', 'open-api.json');

await writeFile(output, JSON.stringify(spec, null, 2));

const schemaOutput = join(__dirname, '..', 'open-api.ts');

execSync(
  `npx openapi-typescript ${output} -o ${schemaOutput} --immutable --alphabetize --empty-objects-unknown`,
  {
    cwd: rootDir,
    stdio: 'inherit',
  },
);

execSync(`biome format --write ${output} ${schemaOutput}`, {
  cwd: rootDir,
  stdio: 'inherit',
});
