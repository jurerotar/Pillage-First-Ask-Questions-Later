import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { expect, test } from 'vitest';
import { bundleForHermes } from '../bundle';

test('shakes unused exports before preserving module boundaries and lexical captures', async () => {
  const workspace = await mkdtemp(
    path.join(tmpdir(), 'pillage-engine-bundle-'),
  );

  if (
    path.dirname(workspace) !== path.resolve(tmpdir()) ||
    !path.basename(workspace).startsWith('pillage-engine-bundle-')
  ) {
    throw new Error('Unexpected test workspace');
  }

  try {
    await writeFile(
      path.join(workspace, 'dependency.ts'),
      `export const answer: number = 42;
       export const unused = () => 'UNUSED_DEPENDENCY_EXPORT';
       globalThis.moduleSideEffect = true;`,
    );
    await writeFile(
      path.join(workspace, 'entry.ts'),
      `import { answer } from './dependency';
       const captured: Array<() => number> = [];
       for (let index = 0; index < 3; index++) captured.push(() => index);
       class ModernSyntax {
         #value = 0;
         static initialized = false;
         static { ModernSyntax.initialized = true; }
         read() { this.#value ||= answer; return this.#value; }
       }
       globalThis.result = {
         answer, captures: captured.map(fn => fn()),
         modern: new ModernSyntax().read(), initialized: ModernSyntax.initialized
       };`,
    );
    const source = await bundleForHermes(path.join(workspace, 'entry.ts'));
    expect(source).not.toContain('UNUSED_DEPENDENCY_EXPORT');
    expect(source.match(/__commonJS\(/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain('#value');
    expect(source).toContain('||=');
    expect(source).toMatch(/static\s*\{/);
    // Babel must eliminate lexical per-iteration captures for pinned Hermes.
    expect(source).not.toMatch(/\b(?:let|const) index\b/);
    const context: Record<string, unknown> = {};
    runInNewContext(source, context);
    expect(context.result).toEqual({
      answer: 42,
      captures: [0, 1, 2],
      modern: 42,
      initialized: true,
    });
    expect(context.moduleSideEffect).toBe(true);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('resolves package exports and nested dependencies before lowering TypeScript', async () => {
  const workspace = await mkdtemp(
    path.join(tmpdir(), 'pillage-engine-bundle-'),
  );

  if (
    path.dirname(workspace) !== path.resolve(tmpdir()) ||
    !path.basename(workspace).startsWith('pillage-engine-bundle-')
  ) {
    throw new Error('Unexpected test workspace');
  }

  try {
    const dependency = path.join(workspace, 'node_modules/test-package');
    await mkdir(dependency, { recursive: true });
    await writeFile(
      path.join(dependency, 'package.json'),
      JSON.stringify({ type: 'module', exports: './index.ts' }),
    );
    await writeFile(
      path.join(dependency, 'value.ts'),
      'export const value: number = 17;',
    );
    await writeFile(
      path.join(dependency, 'index.ts'),
      `export { value } from './value';
       export const unused = () => 'UNUSED_PACKAGE_EXPORT';`,
    );
    await writeFile(
      path.join(workspace, 'entry.ts'),
      `import { value } from 'test-package';
       globalThis.result = import.meta.env.PROD ? value : 0;`,
    );
    const source = await bundleForHermes(path.join(workspace, 'entry.ts'), {
      'import.meta.env': JSON.stringify({ PROD: true }),
    });
    expect(source).not.toContain('UNUSED_PACKAGE_EXPORT');
    const context: Record<string, unknown> = {};
    runInNewContext(source, context);
    expect(context.result).toBe(17);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('preserves live bindings across cyclic module imports', async () => {
  const workspace = await mkdtemp(
    path.join(tmpdir(), 'pillage-engine-bundle-'),
  );

  if (
    path.dirname(workspace) !== path.resolve(tmpdir()) ||
    !path.basename(workspace).startsWith('pillage-engine-bundle-')
  ) {
    throw new Error('Unexpected test workspace');
  }

  try {
    await writeFile(
      path.join(workspace, 'counter.ts'),
      `import { read } from './reader';
       export let counter = 0;
       export const increment = () => counter++;
       export const readThroughCycle = () => read();`,
    );
    await writeFile(
      path.join(workspace, 'reader.ts'),
      `import { counter } from './counter';
       export const read = () => counter;`,
    );
    await writeFile(
      path.join(workspace, 'entry.ts'),
      `import { counter, increment, readThroughCycle } from './counter';
       increment();
       globalThis.result = [counter, readThroughCycle()];`,
    );
    const source = await bundleForHermes(path.join(workspace, 'entry.ts'));
    const context: Record<string, unknown> = {};
    runInNewContext(source, context);
    expect(context.result).toEqual([1, 1]);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
