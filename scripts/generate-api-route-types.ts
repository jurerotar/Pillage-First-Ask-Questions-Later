import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createFileSystemLayer } from 'typescript/fs';
import { API, formatDiagnostics, TypeFormatFlags } from 'typescript/sync';

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

const readFileSystemDirectory = (directory: string) => {
  return readdirSync(directory, { withFileTypes: true }).map((entry) => ({
    isDirectory: entry.isDirectory(),
    path: resolve(directory, entry.name),
  }));
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
    .toSorted();
};

const routingProjection = `
import type { apiRoutes } from './api-routes';
import type { input, output } from 'zod/v4/core';

type JsonSchema<Entry> = Entry extends {
  content: { 'application/json': { schema: infer Schema } };
} ? Schema : never;

type ResponseSchema<Operation> = Operation extends { responses: infer Responses }
  ? JsonSchema<Responses[Extract<keyof Responses, '200' | '201' | '202'>]>
  : never;

type Contract<Operation> =
  (Operation extends { requestParams: { path: infer Path } } ? { path: output<Path> } : {}) &
  (Operation extends { requestParams: { query: infer Query } } ? { query: input<Query> } : {}) &
  (Operation extends { requestBody: infer Body }
    ? [JsonSchema<Body>] extends [never] ? {} : { requestBody: input<JsonSchema<Body>> }
    : {}) &
  { response: [ResponseSchema<Operation>] extends [never] ? undefined : output<ResponseSchema<Operation>> };

type Controller = typeof apiRoutes[number]['controller'];
export declare const routes: {
  [Route in Controller as \`\${Route['method']} \${Route['path']}\`]: Contract<Route['operation']>;
};
`;

const createProjectedRouteTypes = (): string => {
  // Give the virtual file the same import context as the generated declaration.
  const projectionPath = resolve(
    dirname(generatedApiRouteTypesPath),
    'api-route-types.projection.ts',
  ).replaceAll('\\', '/');
  using compiler = new API({ cwd: repoRoot });
  const config = compiler.parseConfigFile(
    resolve(apiPackageRoot, 'tsconfig.json'),
  );
  if (config.errors.length > 0) {
    throw new Error(formatDiagnostics(config.errors, compiler));
  }

  using snapshot = compiler.createSnapshot({
    fileSystem: createFileSystemLayer([[projectionPath, routingProjection]]),
    createPrograms: [
      { rootFiles: [projectionPath], compilerOptions: config.options },
    ],
  });
  const [program] = snapshot.operation.createdPrograms;
  const diagnostics = [
    ...program.getGlobalDiagnostics(),
    ...program.getProgramDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ];
  if (diagnostics.length > 0) {
    throw new Error(formatDiagnostics(diagnostics, program));
  }

  const { checker } = program.getProject();
  const source = program.getSourceFile(projectionPath);
  const module = checker.getSymbolOfSourceFile(projectionPath);
  const routes = module && checker.getMemberInModuleExports(module, 'routes');
  if (!source || !routes) {
    throw new Error('Unable to resolve the API route contracts');
  }

  const flags =
    TypeFormatFlags.NoTruncation |
    TypeFormatFlags.UseFullyQualifiedType |
    TypeFormatFlags.UseStructuralFallback |
    TypeFormatFlags.InTypeAlias;
  const routeSymbols = checker.getPropertiesOfType(
    checker.getTypeOfSymbol(routes),
  );
  if (routeSymbols.length === 0) {
    throw new Error('No API route contracts found');
  }

  const methods = new Map<string, string[]>();
  for (const route of routeSymbols) {
    const separator = route.name.indexOf(' ');
    const method = route.name.slice(0, separator);
    const path = route.name.slice(separator + 1);
    const operation = checker.getTypeOfSymbol(route);
    const fields = new Map<string, string>();
    for (const field of checker.getPropertiesOfType(operation)) {
      const type = checker.getTypeOfSymbol(field);
      if (type.isErrorType()) {
        throw new Error(`Unable to resolve ${field.name} for ${route.name}`);
      }
      fields.set(field.name, checker.typeToString(type, source, flags));
    }

    const response = fields.get('response');
    if (!response) {
      throw new Error(`Missing response type for ${route.name}`);
    }
    const requestParams = [];
    for (const parameter of ['path', 'query']) {
      const type = fields.get(parameter);
      if (type) {
        requestParams.push(`${parameter}: ${type};`);
      }
    }

    const entry = [`    ${JSON.stringify(path)}: {`, '      operation: {'];
    if (requestParams.length > 0) {
      entry.push(
        '        requestParams: {',
        ...requestParams.map((parameter) => `          ${parameter}`),
        '        };',
      );
    }
    const requestBody = fields.get('requestBody');
    if (requestBody) {
      entry.push(`        requestBody: ${requestBody};`);
    }
    entry.push(`        response: ${response};`, '      };', '    };');

    const methodRoutes = methods.get(method) ?? [];
    methodRoutes.push(entry.join('\n'));
    methods.set(method, methodRoutes);
  }

  const declarations = [...methods].map(([method, routes]) => {
    return `  ${method}: {\n${routes.join('\n')}\n  };`;
  });
  const outputPath = relative(repoRoot, generatedApiRouteTypesPath).replaceAll(
    '\\',
    '/',
  );
  return `/**
 * Generated by scripts/generate-api-route-types.ts.
 * Output: ${outputPath}
 *
 * Do not edit this file directly. It is intentionally ignored by git.
 */
export type ApiRoutesByMethod = {
${declarations.join('\n')}
};
`;
};

export const generateApiRouteTypes = ({
  quiet = false,
}: GenerateApiRouteTypesOptions = {}): GenerateApiRouteTypesResult => {
  const generatedDeclaration = createProjectedRouteTypes();
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
