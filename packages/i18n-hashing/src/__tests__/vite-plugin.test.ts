import * as fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { vitePluginI18nHashing } from '../vite-plugin.ts';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

describe(vitePluginI18nHashing, () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Default mock behavior for localization files
    // @ts-expect-error - This doesn't matter, not worth fixing
    vi.mocked(fs.readdirSync).mockReturnValue(['app.json']);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        Notifications: 'Notifications',
        'Enable notifications': 'Enable notifications',
        'Key with options': 'Key with options',
        hello: 'hello',
        'User {{name}}': 'User {{name}}',
      }),
    );
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.unstubAllEnvs();
  });

  test('should return null if NODE_ENV is not production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const plugin = vitePluginI18nHashing();
    // @ts-expect-error - transform is a hook
    const result = await plugin.transform!("t('hello')", 'test.ts');
    expect(result).toBeNull();
  });

  test('should hash keys in t() calls in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const plugin = vitePluginI18nHashing();
    const code =
      'const x = t(\'Notifications\'); const y = t("Enable notifications");';
    // @ts-expect-error - transform is a hook
    const result = await plugin.transform!(code, 'test.ts');

    expect(result.code).toContain("t('a274f4')");
    expect(result.code).toContain('t("dfa971")');
  });

  test('should hash keys in <Trans> components in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const plugin = vitePluginI18nHashing();
    const code = '<Trans>Notifications</Trans>';
    // @ts-expect-error - transform is a hook
    const result = await plugin.transform!(code, 'test.tsx');

    expect(result.code).toBe('<Trans>a274f4</Trans>');
  });

  test('should skip hashing for already hashed keys or keys with interpolation (if using backticks without quotes)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const plugin = vitePluginI18nHashing();
    const code = `
      t('5c6307');
      t(\`Welcome \${user}\`);
    `;
    // @ts-expect-error - transform is a hook
    const result = await plugin.transform!(code, 'test.ts');
    // It will be null because sortedKeys will not match '5c6307' (unless it was in localization files)
    // and `Welcome ${user}` will not match because it's not a static string in our mock.
    expect(result).toBeNull();
  });

  test('should handle complex t() calls with options', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const plugin = vitePluginI18nHashing();
    const code = "t('Key with options', { count: 5 })";
    // @ts-expect-error - transform is a hook
    const result = await plugin.transform!(code, 'test.ts');

    // hash of 'Key with options' is 330e4e
    expect(result.code).toBe("t('330e4e', { count: 5 })");
  });

  test('should ignore non-ts/tsx files', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const plugin = vitePluginI18nHashing();
    const code = "t('hello')";
    // @ts-expect-error - transform is a hook
    const result = await plugin.transform!(code, 'test.js');
    expect(result).toBeNull();
  });

  test('should ignore node_modules', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const plugin = vitePluginI18nHashing();
    const code = "t('hello')";
    // @ts-expect-error - transform is a hook
    const result = await plugin.transform!(code, 'node_modules/test.ts');
    expect(result).toBeNull();
  });

  test('should return null if code does not contain t( or <Trans', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const plugin = vitePluginI18nHashing();
    const code = 'const x = 1;';
    // @ts-expect-error - transform is a hook
    const result = await plugin.transform!(code, 'test.ts');
    expect(result).toBeNull();
  });
});
