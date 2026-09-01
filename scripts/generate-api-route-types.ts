import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

type GenerateApiRouteTypesResult = {
  changed: boolean;
  outputPath: string;
};

type GenerateApiRouteTypesOptions = {
  quiet?: boolean;
};

const repoRoot = resolve(import.meta.dirname, '..');
const apiPackageRoot = resolve(repoRoot, 'packages/api');
const apiRoutesSourcePath = resolve(apiPackageRoot, 'src/http/api-routes.ts');
const apiControllersRoot = resolve(apiPackageRoot, 'src/http/controllers');
const generatedApiRouteTypesPath = resolve(
  apiPackageRoot,
  'src/http/api-route-types.generated.d.ts',
);

export const apiRouteTypesInputGlobs = [
  apiRoutesSourcePath,
  resolve(apiControllersRoot, '**/*-controller.ts'),
  resolve(apiControllersRoot, '**/*-controllers.ts'),
];

const toTsConfigPath = (path: string) => path.replaceAll('\\', '/');

const getTscBinPath = () => {
  return resolve(repoRoot, 'node_modules/typescript/bin/tsc');
};

const readDirectoryRecursive = (directory: string): string[] => {
  if (!existsSync(directory)) {
    return [];
  }

  const entries = readFileSystemDirectory(directory);

  return entries.flatMap((entry) => {
    if (entry.isDirectory) {
      return readDirectoryRecursive(entry.path);
    }

    return [entry.path];
  });
};

const readFileSystemDirectory = (directory: string) => {
  return readdirSync(directory, { withFileTypes: true }).map((entry) => ({
    isDirectory: entry.isDirectory(),
    path: resolve(directory, entry.name),
  }));
};

export const isApiRouteTypesInputFile = (filePath: string): boolean => {
  const resolvedPath = resolve(filePath);

  if (resolvedPath === apiRoutesSourcePath) {
    return true;
  }

  const controllersRootWithSeparator = `${apiControllersRoot}${sep}`;

  return (
    resolvedPath.startsWith(controllersRootWithSeparator) &&
    /-controllers?\.ts$/u.test(resolvedPath)
  );
};

export const listApiRouteTypesInputFiles = (): string[] => {
  return [apiRoutesSourcePath, ...readDirectoryRecursive(apiControllersRoot)]
    .filter(isApiRouteTypesInputFile)
    .sort();
};

const createTemporaryTsConfig = (temporaryRoot: string): string => {
  const outDir = resolve(temporaryRoot, 'dist');
  const tsConfigPath = resolve(temporaryRoot, 'tsconfig.json');

  writeFileSync(
    tsConfigPath,
    JSON.stringify(
      {
        extends: toTsConfigPath(resolve(apiPackageRoot, 'tsconfig.json')),
        compilerOptions: {
          declaration: true,
          declarationMap: false,
          emitDeclarationOnly: true,
          noEmit: false,
          outDir: toTsConfigPath(outDir),
          rootDir: toTsConfigPath(resolve(apiPackageRoot, 'src')),
        },
        files: [toTsConfigPath(apiRoutesSourcePath)],
        include: [],
      },
      null,
      2,
    ),
  );

  return tsConfigPath;
};

const emitApiRoutesDeclaration = (): string => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'pillage-api-route-types-'));
  const tsConfigPath = createTemporaryTsConfig(temporaryRoot);
  const outputPath = resolve(temporaryRoot, 'dist/http/api-routes.d.ts');

  try {
    execFileSync(process.execPath, [getTscBinPath(), '-p', tsConfigPath], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (!existsSync(outputPath)) {
      throw new Error(`TypeScript did not emit ${outputPath}`);
    }

    return readFileSync(outputPath, 'utf8');
  } catch (error) {
    const { stderr, stdout } = error as {
      stderr?: string;
      stdout?: string;
    };

    throw new Error(
      ['Failed to emit API route declarations.', stdout?.trim(), stderr?.trim()]
        .filter(Boolean)
        .join('\n'),
    );
  } finally {
    if (temporaryRoot.startsWith(tmpdir())) {
      rmSync(temporaryRoot, { force: true, recursive: true });
    }
  }
};

const extractApiRoutesDeclaration = (declarationText: string): string => {
  const startMarker = 'export declare const apiRoutes:';
  const endMarker = '\nexport declare const paths:';
  const startIndex = declarationText.indexOf(startMarker);
  const endIndex = declarationText.indexOf(endMarker, startIndex);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(
      'Unable to locate the apiRoutes declaration in emitted d.ts',
    );
  }

  return declarationText.slice(startIndex, endIndex).trim();
};

type StaticTypeImport = {
  importNames: string[];
  moduleSpecifier: string;
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
};

const collectInlineTypeImportNames = (
  declarationText: string,
  moduleSpecifier: string,
): string[] => {
  return [
    ...new Set(
      Array.from(
        declarationText.matchAll(
          new RegExp(
            `import\\("${escapeRegExp(moduleSpecifier)}"\\)\\.(?<importName>[$A-Za-z_][$\\w]*)`,
            'gu',
          ),
        ),
      ).map(({ groups }) => groups!.importName!),
    ),
  ].sort();
};

const createNamedTypeImport = ({
  importNames,
  moduleSpecifier,
}: StaticTypeImport): string => {
  if (importNames.length === 0) {
    return '';
  }

  return `import type {\n${importNames.map((importName) => `  ${importName},`).join('\n')}\n} from '${moduleSpecifier}';`;
};

const splitTopLevelTypeList = (text: string): string[] => {
  const items: string[] = [];
  let angleDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenthesisDepth = 0;
  let itemStartIndex = 0;
  let stringDelimiter: '"' | "'" | '`' | undefined;

  for (let index = 0; index < text.length; index++) {
    const character = text[index]!;
    const previousCharacter = text[index - 1];

    if (stringDelimiter) {
      if (character === stringDelimiter && previousCharacter !== '\\') {
        stringDelimiter = undefined;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      stringDelimiter = character;
      continue;
    }

    if (character === '<') {
      angleDepth++;
      continue;
    }

    if (character === '>') {
      angleDepth--;
      continue;
    }

    if (character === '{') {
      braceDepth++;
      continue;
    }

    if (character === '}') {
      braceDepth--;
      continue;
    }

    if (character === '[') {
      bracketDepth++;
      continue;
    }

    if (character === ']') {
      bracketDepth--;
      continue;
    }

    if (character === '(') {
      parenthesisDepth++;
      continue;
    }

    if (character === ')') {
      parenthesisDepth--;
      continue;
    }

    if (
      character === ',' &&
      angleDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenthesisDepth === 0
    ) {
      items.push(text.slice(itemStartIndex, index).trim());
      itemStartIndex = index + 1;
    }
  }

  const lastItem = text.slice(itemStartIndex).trim();

  if (lastItem) {
    items.push(lastItem);
  }

  return items;
};

const splitTopLevelIntersection = (text: string): string[] => {
  const items: string[] = [];
  let angleDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenthesisDepth = 0;
  let itemStartIndex = 0;
  let stringDelimiter: '"' | "'" | '`' | undefined;

  for (let index = 0; index < text.length; index++) {
    const character = text[index]!;
    const previousCharacter = text[index - 1];

    if (stringDelimiter) {
      if (character === stringDelimiter && previousCharacter !== '\\') {
        stringDelimiter = undefined;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      stringDelimiter = character;
      continue;
    }

    if (character === '<') {
      angleDepth++;
      continue;
    }

    if (character === '>') {
      angleDepth--;
      continue;
    }

    if (character === '{') {
      braceDepth++;
      continue;
    }

    if (character === '}') {
      braceDepth--;
      continue;
    }

    if (character === '[') {
      bracketDepth++;
      continue;
    }

    if (character === ']') {
      bracketDepth--;
      continue;
    }

    if (character === '(') {
      parenthesisDepth++;
      continue;
    }

    if (character === ')') {
      parenthesisDepth--;
      continue;
    }

    if (
      character === '&' &&
      angleDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenthesisDepth === 0
    ) {
      items.push(text.slice(itemStartIndex, index).trim());
      itemStartIndex = index + 1;
    }
  }

  const lastItem = text.slice(itemStartIndex).trim();

  if (lastItem) {
    items.push(lastItem);
  }

  return items;
};

const extractFirstSchemaType = (text: string): string | undefined => {
  const schemaMarker = 'schema:';
  const schemaMarkerIndex = text.indexOf(schemaMarker);

  if (schemaMarkerIndex === -1) {
    return undefined;
  }

  const schemaStartIndex = schemaMarkerIndex + schemaMarker.length;
  let angleDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenthesisDepth = 0;
  let stringDelimiter: '"' | "'" | '`' | undefined;

  for (let index = schemaStartIndex; index < text.length; index++) {
    const character = text[index]!;
    const previousCharacter = text[index - 1];

    if (stringDelimiter) {
      if (character === stringDelimiter && previousCharacter !== '\\') {
        stringDelimiter = undefined;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      stringDelimiter = character;
      continue;
    }

    if (character === '<') {
      angleDepth++;
      continue;
    }

    if (character === '>') {
      angleDepth--;
      continue;
    }

    if (character === '{') {
      braceDepth++;
      continue;
    }

    if (character === '}') {
      braceDepth--;
      continue;
    }

    if (character === '[') {
      bracketDepth++;
      continue;
    }

    if (character === ']') {
      bracketDepth--;
      continue;
    }

    if (character === '(') {
      parenthesisDepth++;
      continue;
    }

    if (character === ')') {
      parenthesisDepth--;
      continue;
    }

    if (
      character === ';' &&
      angleDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenthesisDepth === 0
    ) {
      return text.slice(schemaStartIndex, index).trim();
    }
  }

  return undefined;
};

const findTopLevelProperty = (
  text: string,
  propertyName: string,
): string | undefined => {
  const propertyStartMarkers = [
    `${propertyName}:`,
    `readonly ${propertyName}:`,
  ];
  let angleDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenthesisDepth = 0;
  let stringDelimiter: '"' | "'" | '`' | undefined;

  for (let index = 0; index < text.length; index++) {
    const character = text[index]!;
    const previousCharacter = text[index - 1];

    if (stringDelimiter) {
      if (character === stringDelimiter && previousCharacter !== '\\') {
        stringDelimiter = undefined;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      stringDelimiter = character;
      continue;
    }

    if (
      angleDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenthesisDepth === 0 &&
      propertyStartMarkers.some((propertyStartMarker) =>
        text.startsWith(propertyStartMarker, index),
      )
    ) {
      const propertyStartIndex = index;

      for (
        let propertyEndIndex = index;
        propertyEndIndex < text.length;
        propertyEndIndex++
      ) {
        const propertyCharacter = text[propertyEndIndex]!;
        const propertyPreviousCharacter = text[propertyEndIndex - 1];

        if (stringDelimiter) {
          if (
            propertyCharacter === stringDelimiter &&
            propertyPreviousCharacter !== '\\'
          ) {
            stringDelimiter = undefined;
          }
          continue;
        }

        if (
          propertyCharacter === '"' ||
          propertyCharacter === "'" ||
          propertyCharacter === '`'
        ) {
          stringDelimiter = propertyCharacter;
          continue;
        }

        if (propertyCharacter === '<') {
          angleDepth++;
          continue;
        }

        if (propertyCharacter === '>') {
          angleDepth--;
          continue;
        }

        if (propertyCharacter === '{') {
          braceDepth++;
          continue;
        }

        if (propertyCharacter === '}') {
          braceDepth--;
          continue;
        }

        if (propertyCharacter === '[') {
          bracketDepth++;
          continue;
        }

        if (propertyCharacter === ']') {
          bracketDepth--;
          continue;
        }

        if (propertyCharacter === '(') {
          parenthesisDepth++;
          continue;
        }

        if (propertyCharacter === ')') {
          parenthesisDepth--;
          continue;
        }

        if (
          propertyCharacter === ';' &&
          angleDepth === 0 &&
          braceDepth === 0 &&
          bracketDepth === 0 &&
          parenthesisDepth === 0
        ) {
          return text.slice(propertyStartIndex, propertyEndIndex + 1).trim();
        }
      }
    }

    if (character === '<') {
      angleDepth++;
      continue;
    }

    if (character === '>') {
      angleDepth--;
      continue;
    }

    if (character === '{') {
      braceDepth++;
      continue;
    }

    if (character === '}') {
      braceDepth--;
      continue;
    }

    if (character === '[') {
      bracketDepth++;
      continue;
    }

    if (character === ']') {
      bracketDepth--;
      continue;
    }

    if (character === '(') {
      parenthesisDepth++;
      continue;
    }

    if (character === ')') {
      parenthesisDepth--;
    }
  }

  return undefined;
};

const simplifyControllerOperationOmit = (text: string): string => {
  const startMarker = 'Omit<{';
  const endMarker = ', "requestBody" | "response" | "responses">';
  let result = '';
  let searchStartIndex = 0;

  while (searchStartIndex < text.length) {
    const omitStartIndex = text.indexOf(startMarker, searchStartIndex);

    if (omitStartIndex === -1) {
      result += text.slice(searchStartIndex);
      break;
    }

    result += text.slice(searchStartIndex, omitStartIndex);

    const objectBodyStartIndex = omitStartIndex + startMarker.length;
    let braceDepth = 1;
    let stringDelimiter: '"' | "'" | '`' | undefined;
    let objectBodyEndIndex: number | undefined;

    for (let index = objectBodyStartIndex; index < text.length; index++) {
      const character = text[index]!;
      const previousCharacter = text[index - 1];

      if (stringDelimiter) {
        if (character === stringDelimiter && previousCharacter !== '\\') {
          stringDelimiter = undefined;
        }
        continue;
      }

      if (character === '"' || character === "'" || character === '`') {
        stringDelimiter = character;
        continue;
      }

      if (character === '{') {
        braceDepth++;
        continue;
      }

      if (character === '}') {
        braceDepth--;

        if (braceDepth === 0) {
          objectBodyEndIndex = index;
          break;
        }
      }
    }

    if (objectBodyEndIndex === undefined) {
      throw new Error('Unable to parse generated ControllerOperation Omit');
    }

    const omitEndIndex = objectBodyEndIndex + 1 + endMarker.length;

    if (text.slice(objectBodyEndIndex + 1, omitEndIndex) !== endMarker) {
      throw new Error('Unexpected generated ControllerOperation Omit shape');
    }

    const objectBody = text.slice(objectBodyStartIndex, objectBodyEndIndex);
    const requestParamsProperty = findTopLevelProperty(
      objectBody,
      'requestParams',
    );

    result += requestParamsProperty
      ? `{\n    ${requestParamsProperty}\n}`
      : 'Record<never, never>';
    searchStartIndex = omitEndIndex;
  }

  return result;
};

const extractApiRouteTupleItems = (declarationText: string): string[] => {
  const startMarker = 'export declare const apiRoutes: readonly [';
  const startIndex = declarationText.indexOf(startMarker);

  if (startIndex === -1) {
    throw new Error('Unable to locate the generated apiRoutes tuple');
  }

  const tupleStartIndex = startIndex + startMarker.length;
  let bracketDepth = 1;
  let stringDelimiter: '"' | "'" | '`' | undefined;

  for (let index = tupleStartIndex; index < declarationText.length; index++) {
    const character = declarationText[index]!;
    const previousCharacter = declarationText[index - 1];

    if (stringDelimiter) {
      if (character === stringDelimiter && previousCharacter !== '\\') {
        stringDelimiter = undefined;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      stringDelimiter = character;
      continue;
    }

    if (character === '[') {
      bracketDepth++;
      continue;
    }

    if (character === ']') {
      bracketDepth--;

      if (bracketDepth === 0) {
        return splitTopLevelTypeList(
          declarationText.slice(tupleStartIndex, index),
        );
      }
    }
  }

  throw new Error('Unable to extract generated apiRoutes tuple items');
};

const createApiRouteControllerUnion = (declarationText: string): string => {
  const routeItems = extractApiRouteTupleItems(declarationText);
  const routeControllers = routeItems.map((routeItem) => {
    const startMarker = 'ApiRoute<';

    if (!routeItem.startsWith(startMarker) || !routeItem.endsWith('>')) {
      throw new Error(`Unexpected generated route item: ${routeItem}`);
    }

    return simplifyApiRouteController(routeItem.slice(startMarker.length, -1));
  });

  return `export type ApiRouteController =\n${routeControllers.map((routeController) => `  | ${routeController}`).join('\n')};`;
};

const simplifyOperationType = (operationType: string): string => {
  const properties: string[] = [];

  for (const part of splitTopLevelIntersection(operationType)) {
    if (part === 'Record<never, never>') {
      continue;
    }

    const objectBody =
      part.startsWith('{') && part.endsWith('}')
        ? part.slice(1, -1)
        : undefined;

    if (!objectBody) {
      throw new Error(`Unexpected generated operation part: ${part}`);
    }

    const requestParamsProperty = findTopLevelProperty(
      objectBody,
      'requestParams',
    );

    if (requestParamsProperty) {
      properties.push(requestParamsProperty);
      continue;
    }

    const requestBodyProperty = findTopLevelProperty(objectBody, 'requestBody');
    const requestBodySchema = requestBodyProperty
      ? extractFirstSchemaType(requestBodyProperty)
      : undefined;

    if (requestBodySchema) {
      properties.push(`requestBody: ${requestBodySchema};`);
      continue;
    }

    const responsesProperty = findTopLevelProperty(objectBody, 'responses');
    const responseSchema = responsesProperty
      ? extractFirstSchemaType(responsesProperty)
      : undefined;

    if (responsesProperty) {
      properties.push(`response: ${responseSchema ?? 'undefined'};`);
      continue;
    }

    throw new Error(`Unexpected generated operation object: ${part}`);
  }

  return properties.length > 0
    ? `{\n${properties.map((property) => `    ${property}`).join('\n')}\n  }`
    : 'Record<never, never>';
};

const simplifyApiRouteController = (routeController: string): string => {
  const startMarker = 'ApiController<';

  if (
    !routeController.startsWith(startMarker) ||
    !routeController.endsWith('>')
  ) {
    throw new Error(`Unexpected generated controller item: ${routeController}`);
  }

  const [path, method, operation] = splitTopLevelTypeList(
    routeController.slice(startMarker.length, -1),
  );

  if (!path || !method || !operation) {
    throw new Error(
      `Unable to parse generated controller item: ${routeController}`,
    );
  }

  return `ApiController<${path}, ${method}, ${simplifyOperationType(operation)}>`;
};

const replaceInlineTypeImports = (
  declarationText: string,
): {
  declarationText: string;
  imports: string;
} => {
  const locallyTypedDeclarationText = declarationText
    .replaceAll('Route<', 'ApiRoute<')
    .replaceAll('import("./controller").Controller<', 'ApiController<');
  const simplifiedDeclarationText = simplifyControllerOperationOmit(
    locallyTypedDeclarationText,
  );
  const staticTypeImports: StaticTypeImport[] = [
    {
      moduleSpecifier: 'zod',
      importNames: collectInlineTypeImportNames(
        simplifiedDeclarationText,
        'zod',
      ),
    },
    {
      moduleSpecifier: 'zod/v4/core',
      importNames: collectInlineTypeImportNames(
        simplifiedDeclarationText,
        'zod/v4/core',
      ),
    },
  ];

  let staticImportedDeclarationText = simplifiedDeclarationText;

  for (const staticTypeImport of staticTypeImports) {
    for (const importName of staticTypeImport.importNames) {
      staticImportedDeclarationText = staticImportedDeclarationText.replaceAll(
        `import("${staticTypeImport.moduleSpecifier}").${importName}`,
        importName,
      );
    }
  }

  return {
    declarationText: staticImportedDeclarationText,
    imports: staticTypeImports
      .map(createNamedTypeImport)
      .filter(Boolean)
      .join('\n'),
  };
};

const createGeneratedDeclaration = (apiRoutesDeclaration: string): string => {
  const outputRelativePath = toTsConfigPath(
    relative(repoRoot, generatedApiRouteTypesPath),
  );
  const { declarationText, imports } =
    replaceInlineTypeImports(apiRoutesDeclaration);
  const apiRouteControllerUnion =
    createApiRouteControllerUnion(declarationText);

  return `/**
 * Generated by scripts/generate-api-route-types.ts.
 * Output: ${outputRelativePath}
 *
 * Do not edit this file directly. It is intentionally ignored by git.
 */
${imports}

type ApiController<TPath extends string, TMethod extends string, TOperation> = {
  path: TPath;
  method: TMethod;
  operation: TOperation;
};

${apiRouteControllerUnion}
`;
};

export const generateApiRouteTypes = ({
  quiet = false,
}: GenerateApiRouteTypesOptions = {}): GenerateApiRouteTypesResult => {
  const declarationText = emitApiRoutesDeclaration();
  const apiRoutesDeclaration = extractApiRoutesDeclaration(declarationText);
  const generatedDeclaration = createGeneratedDeclaration(apiRoutesDeclaration);
  const previousDeclaration = existsSync(generatedApiRouteTypesPath)
    ? readFileSync(generatedApiRouteTypesPath, 'utf8')
    : undefined;

  if (previousDeclaration !== generatedDeclaration) {
    mkdirSync(dirname(generatedApiRouteTypesPath), { recursive: true });
    writeFileSync(generatedApiRouteTypesPath, generatedDeclaration);
  }

  const changed = previousDeclaration !== generatedDeclaration;

  if (!quiet) {
    const relativeOutputPath = relative(repoRoot, generatedApiRouteTypesPath);
    process.stdout.write(
      `${changed ? 'Generated' : 'API route types are up to date'}: ${relativeOutputPath}`,
    );
    process.stdout.write('\n');
  }

  return {
    changed,
    outputPath: generatedApiRouteTypesPath,
  };
};

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  generateApiRouteTypes();
}
