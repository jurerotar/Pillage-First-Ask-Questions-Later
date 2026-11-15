import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { analyzeColocation } from '../file-colocation-plugin.ts';

let temporaryDirectory: string;

const writeFile = (filePath: string, contents: string): string => {
  const absolutePath = path.join(temporaryDirectory, filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);

  return absolutePath;
};

const getReport = (
  reports: ReturnType<typeof analyzeColocation>,
  filePath: string,
) => {
  return reports.get(path.join(temporaryDirectory, filePath));
};

beforeEach(() => {
  temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'file-colocation-plugin-'),
  );
});

afterEach(() => {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test('reports a file that is only imported by a lower feature directory', () => {
  writeFile(
    'shared/use-local-hook.ts',
    'export const useLocalHook = () => {};',
  );
  writeFile(
    'feature/detail/card.tsx',
    "import { useLocalHook } from '../../shared/use-local-hook';\nuseLocalHook();",
  );

  const reports = analyzeColocation(temporaryDirectory);
  const report = getReport(reports, 'shared/use-local-hook.ts');

  assert.equal(report.suggestedDirectory, 'app/feature/detail');
});

test('does not report files shared by sibling feature directories', () => {
  writeFile(
    'shared/use-shared-hook.ts',
    'export const useSharedHook = () => {};',
  );
  writeFile(
    'feature-a/card.tsx',
    "import { useSharedHook } from '../shared/use-shared-hook';\nuseSharedHook();",
  );
  writeFile(
    'feature-b/card.tsx',
    "import { useSharedHook } from '../shared/use-shared-hook';\nuseSharedHook();",
  );

  const reports = analyzeColocation(temporaryDirectory);

  assert.equal(getReport(reports, 'shared/use-shared-hook.ts'), undefined);
});
