import fs from 'node:fs';
import path from 'node:path';

type ColocationOptions = {
  appRoots: string[];
  ignore: string[];
  minImporters: number;
};

type UserColocationOptions = Partial<ColocationOptions>;

type ColocationReport = {
  importerCount: number;
  suggestedDirectory: string;
  targetPath: string;
};

type GraphCacheEntry = {
  appRoot: string;
  reportsByTarget: Map<string, ColocationReport>;
};

type RuleContext = {
  cwd: string;
  filename: string;
  options: readonly UserColocationOptions[];
  report: (diagnostic: {
    node: unknown;
    messageId: string;
    data: Record<string, string | number>;
  }) => void;
};

const SCRIPT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'];

const DEFAULT_OPTIONS: ColocationOptions = {
  appRoots: ['apps/web/app', 'app'],
  ignore: [
    '**/__tests__/**',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/page.tsx',
    '**/layout.tsx',
    '**/error-boundary.tsx',
    'app/entry.client.tsx',
    'app/root.tsx',
    'app/routes.ts',
    'app/sw.ts',
    'app/components/icons/**',
    'app/components/ui/**',
    'app/localization/**',
    'app/styles/**',
    'app/tests/**',
  ],
  minImporters: 1,
};

const graphCache = new Map<string, GraphCacheEntry>();

const toPosixPath = (value: string): string => value.replaceAll(path.sep, '/');

const normalizePath = (value: string): string => path.resolve(value);

const isScriptFile = (filePath: string): boolean => {
  return SCRIPT_EXTENSIONS.some((extension) => filePath.endsWith(extension));
};

const walkFiles = (directory: string): string[] => {
  const files: string[] = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath));
      continue;
    }

    if (entry.isFile() && isScriptFile(entry.name)) {
      files.push(normalizePath(entryPath));
    }
  }

  return files;
};

const STATIC_IMPORT_REGEX =
  /^\s*(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/gm;
const DYNAMIC_IMPORT_REGEX = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const IMPORT_TYPE_REGEX = /\bimport\s*<[^>]*>\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const collectImportSpecifiers = (filePath: string): string[] => {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const specifiers: string[] = [];

  for (const regex of [
    STATIC_IMPORT_REGEX,
    DYNAMIC_IMPORT_REGEX,
    IMPORT_TYPE_REGEX,
  ]) {
    regex.lastIndex = 0;

    let match = regex.exec(sourceText);

    while (match) {
      if (match[1]) {
        specifiers.push(match[1]);
      }

      match = regex.exec(sourceText);
    }
  }

  return specifiers;
};

const resolveCandidate = (candidatePath: string): string | null => {
  const candidates: string[] = [];

  if (path.extname(candidatePath)) {
    candidates.push(candidatePath);
  }

  for (const extension of SCRIPT_EXTENSIONS) {
    candidates.push(`${candidatePath}${extension}`);
  }

  for (const extension of SCRIPT_EXTENSIONS) {
    candidates.push(path.join(candidatePath, `index${extension}`));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return normalizePath(candidate);
    }
  }

  return null;
};

const resolveImport = (
  importerPath: string,
  specifier: string,
  appRoot: string,
): string | null => {
  if (specifier.startsWith('app/')) {
    return resolveCandidate(path.join(appRoot, specifier.slice('app/'.length)));
  }

  if (specifier.startsWith('~/')) {
    return resolveCandidate(path.join(appRoot, specifier.slice('~/'.length)));
  }

  if (specifier.startsWith('@/')) {
    return resolveCandidate(path.join(appRoot, specifier.slice('@/'.length)));
  }

  if (specifier.startsWith('.')) {
    return resolveCandidate(
      path.resolve(path.dirname(importerPath), specifier),
    );
  }

  return null;
};

const getLowestCommonDirectory = (filePaths: string[]): string | null => {
  const directories = filePaths.map((filePath) => path.dirname(filePath));
  const [firstDirectory] = directories;

  if (!firstDirectory) {
    return null;
  }

  const firstParts = firstDirectory.split(path.sep);
  let partIndex = 0;

  while (
    partIndex < firstParts.length &&
    directories.every((directory) => {
      const parts = directory.split(path.sep);
      return parts[partIndex] === firstParts[partIndex];
    })
  ) {
    partIndex += 1;
  }

  return firstParts.slice(0, partIndex).join(path.sep);
};

const isPathWithin = (childPath: string, parentPath: string): boolean => {
  const relativePath = path.relative(parentPath, childPath);

  return relativePath === '' || !relativePath.startsWith('..');
};

const isDirectoryBelow = (
  directory: string,
  parentDirectory: string,
): boolean => {
  return (
    directory !== parentDirectory && isPathWithin(directory, parentDirectory)
  );
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
};

const globToRegExp = (glob: string): RegExp => {
  let pattern = '^';

  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];
    const nextCharacter = glob[index + 1];

    if (character === '*' && nextCharacter === '*') {
      pattern += '.*';
      index += 1;
      continue;
    }

    if (character === '*') {
      pattern += '[^/]*';
      continue;
    }

    pattern += escapeRegExp(character);
  }

  pattern += '$';

  return new RegExp(pattern);
};

const createIgnoreMatchers = (patterns: string[]): RegExp[] => {
  return patterns.map((pattern) => globToRegExp(pattern));
};

const matchesAnyPattern = (filePath: string, matchers: RegExp[]): boolean => {
  return matchers.some((matcher) => matcher.test(filePath));
};

const getRelativeAppPath = (filePath: string, appRoot: string): string => {
  return toPosixPath(path.relative(appRoot, filePath));
};

const getReportPath = (filePath: string, appRoot: string): string => {
  return `app/${getRelativeAppPath(filePath, appRoot)}`;
};

const isTestPath = (filePath: string): boolean => {
  const normalizedPath = toPosixPath(filePath);

  return (
    normalizedPath.includes('/__tests__/') ||
    normalizedPath.endsWith('.test.ts') ||
    normalizedPath.endsWith('.test.tsx') ||
    normalizedPath.endsWith('.spec.ts') ||
    normalizedPath.endsWith('.spec.tsx')
  );
};

const findAppRoot = (cwd: string, configuredRoots: string[]): string | null => {
  let currentDirectory = normalizePath(cwd);

  while (true) {
    for (const configuredRoot of configuredRoots) {
      const candidate = path.resolve(currentDirectory, configuredRoot);

      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    }

    const parentDirectory = path.dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return null;
    }

    currentDirectory = parentDirectory;
  }
};

const buildGraph = (
  appRoot: string,
  options: ColocationOptions,
): Map<string, ColocationReport> => {
  const files = walkFiles(appRoot);
  const fileSet = new Set(files);
  const importersByTarget = new Map<string, string[]>(
    files.map((filePath) => [filePath, []]),
  );

  for (const filePath of files) {
    for (const specifier of collectImportSpecifiers(filePath)) {
      const targetPath = resolveImport(filePath, specifier, appRoot);

      if (!targetPath || !fileSet.has(targetPath)) {
        continue;
      }

      importersByTarget.get(targetPath)?.push(filePath);
    }
  }

  const ignoreMatchers = createIgnoreMatchers(options.ignore);
  const reportsByTarget = new Map<string, ColocationReport>();

  for (const [targetPath, importers] of importersByTarget) {
    if (importers.length < options.minImporters || isTestPath(targetPath)) {
      continue;
    }

    const targetReportPath = getReportPath(targetPath, appRoot);

    if (matchesAnyPattern(targetReportPath, ignoreMatchers)) {
      continue;
    }

    const productionImporters = importers.filter(
      (importerPath) => !isTestPath(importerPath),
    );

    if (productionImporters.length < options.minImporters) {
      continue;
    }

    const commonDirectory = getLowestCommonDirectory(productionImporters);

    if (!commonDirectory) {
      continue;
    }

    const targetDirectory = path.dirname(targetPath);

    if (
      !isDirectoryBelow(commonDirectory, targetDirectory) &&
      commonDirectory.split(path.sep).length <=
        targetDirectory.split(path.sep).length
    ) {
      continue;
    }

    reportsByTarget.set(targetPath, {
      importerCount: productionImporters.length,
      suggestedDirectory: getReportPath(commonDirectory, appRoot),
      targetPath: targetReportPath,
    });
  }

  return reportsByTarget;
};

const normalizeOptions = (
  options: readonly UserColocationOptions[] = [],
): ColocationOptions => {
  const [userOptions = {}] = options;

  return {
    appRoots: userOptions.appRoots ?? DEFAULT_OPTIONS.appRoots,
    ignore: [...DEFAULT_OPTIONS.ignore, ...(userOptions.ignore ?? [])],
    minImporters: userOptions.minImporters ?? DEFAULT_OPTIONS.minImporters,
  };
};

export const analyzeColocation = (
  appRoot: string,
  userOptions: UserColocationOptions = {},
): Map<string, ColocationReport> => {
  const options = normalizeOptions([userOptions]);

  return buildGraph(normalizePath(appRoot), options);
};

const getReports = (context: RuleContext): GraphCacheEntry | null => {
  const options = normalizeOptions(context.options);
  const appRoot = findAppRoot(context.cwd, options.appRoots);

  if (!appRoot) {
    return null;
  }

  const cacheKey = JSON.stringify({
    appRoot,
    ignore: options.ignore,
    minImporters: options.minImporters,
  });

  if (!graphCache.has(cacheKey)) {
    graphCache.set(cacheKey, {
      appRoot,
      reportsByTarget: buildGraph(appRoot, options),
    });
  }

  return graphCache.get(cacheKey) ?? null;
};

export const colocationRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require feature files to live at the lowest directory needed by their importers.',
    },
    messages: {
      colocate:
        '{{targetPath}} is imported only from {{suggestedDirectory}}. Move it closer to that feature or add an ignore pattern if this is intentionally shared.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          appRoots: {
            type: 'array',
            items: { type: 'string' },
          },
          ignore: {
            type: 'array',
            items: { type: 'string' },
          },
          minImporters: {
            type: 'number',
            minimum: 1,
          },
        },
      },
    ],
    defaultOptions: [DEFAULT_OPTIONS],
  },
  create(context: RuleContext) {
    const graph = getReports(context);

    if (!graph) {
      return {};
    }

    const report = graph.reportsByTarget.get(normalizePath(context.filename));

    if (!report) {
      return {};
    }

    return {
      Program(node: unknown) {
        context.report({
          node,
          messageId: 'colocate',
          data: {
            targetPath: report.targetPath,
            suggestedDirectory: report.suggestedDirectory,
            importerCount: report.importerCount,
          },
        });
      },
    };
  },
};

export default {
  meta: {
    name: 'file-colocation-plugin',
  },
  rules: {
    colocation: colocationRule,
  },
};
