# @pillage-first/i18n-hashing

Build-time localization key hashing system for reducing bundle size in production builds.

## Overview

This package implements a localization key hashing system that replaces human-readable translation keys (e.g., `"Notifications"`) with short MD5-based hashes (e.g., `"a274f4"`) in production builds. This reduces localization file sizes by approximately 50% by eliminating duplicate text used as both keys and values.

## Features

- **Hash Generation**: Creates short 6-character MD5 hashes from translation keys
- **Build-time Transformation**: Converts localization files from `extracted/` to `hashed/` directories
- **Vite Plugin**: Automatically replaces translation keys in source code during production builds
- **Development-Friendly**: Development mode uses readable keys; production uses hashes
- **Zero Runtime Overhead**: All transformations happen at build time

## Installation

This package is part of the Pillage First monorepo and is automatically linked as a workspace dependency.

```json
{
  "devDependencies": {
    "@pillage-first/i18n-hashing": "*"
  }
}
```

## Usage

### 1. Build Script

Add the hash generation script to your build process:

```json
{
  "scripts": {
    "build": "node scripts/hash-localization-files.ts && react-router build"
  }
}
```

Create `scripts/hash-localization-files.ts`:

```typescript
import { hashLocalizationFiles } from '@pillage-first/i18n-hashing';
import i18nextCliConfig from '../i18next.config.ts';

await hashLocalizationFiles(i18nextCliConfig);
```

### 2. Vite Plugin

Add the plugin to your `vite.config.ts`:

```typescript
import { vitePluginI18nHashing } from '@pillage-first/i18n-hashing';

export default defineConfig({
  plugins: [
    vitePluginI18nHashing(),
    // ... other plugins
  ],
});
```

### 3. Runtime Loader

Configure your localization loader to use the appropriate directory based on environment:

```typescript
import { env } from 'app/env.ts';

const localizationFilesTarget =
  env.NODE_ENV === 'production' ? 'hashed' : 'extracted';

const appPath = `app/localization/locales/${locale}/${localizationFilesTarget}/app.json`;
```

## How It Works

### Build Flow

```
1. i18next-cli extract → Creates extracted/ with readable keys
2. hashLocalizationFiles() → Reads extracted/, generates hashed/
3. Vite plugin → Replaces keys in source code during build
4. Runtime → Loads appropriate files based on NODE_ENV
```

### File Structure

```
locales/
  en-US/
    extracted/        # Human-readable keys (development)
      app.json
      public.json
    hashed/          # Hash keys (production, gitignored)
      app.json
      public.json
    assets.json      # Not hashed (file paths, not translations)
```

### Hash Algorithm

- **Algorithm**: MD5
- **Length**: 6 characters (first 6 characters of MD5 hex digest)
- **Collision Handling**: None needed - keys are unique, collision probability is negligible
- **Cache**: In-memory Map to avoid recomputing hashes

**Why MD5?**
- Fast and widely available
- Cryptographic security is not required (no sensitive data)
- 6 characters provide 16^6 = 16.7 million possible values
- With ~1000 translation keys, collision probability is extremely low

### Example Transformation

**Before (extracted/app.json):**
```json
{
  "Notifications": "Notifications",
  "Settings": "Settings",
  "Welcome": "Welcome"
}
```

**After (hashed/app.json):**
```json
{
  "a274f4": "Notifications",
  "3e5a12": "Settings",
  "7b9c8d": "Settings"
}
```

**Source Code (before build):**
```typescript
t('Notifications')
<Trans>Welcome</Trans>
```

**Source Code (after build):**
```typescript
t('a274f4')
<Trans>7b9c8d</Trans>
```

## API

### `hashLocalizationFiles(config)`

Generates hashed localization files from extracted files.

**Parameters:**
- `config`: i18next-cli configuration object

**Returns:** `Promise<void>`

**Example:**
```typescript
import { hashLocalizationFiles } from '@pillage-first/i18n-hashing';
import i18nextCliConfig from '../i18next.config.ts';

await hashLocalizationFiles(i18nextCliConfig);
```

### `vitePluginI18nHashing()`

Vite plugin that replaces translation keys with hashes during production builds.

**Returns:** Vite `Plugin` object

**Behavior:**
- Only active when `NODE_ENV === 'production'`
- Scans `.ts` and `.tsx` files for `t()` calls and `<Trans>` components
- Replaces keys found in single quotes, double quotes, template literals, and JSX text
- Sorts keys by length (longest first) to avoid partial matches

**Example:**
```typescript
import { vitePluginI18nHashing } from '@pillage-first/i18n-hashing';

export default defineConfig({
  plugins: [vitePluginI18nHashing()],
});
```

### `generateHashKey(key)`

Generates a 6-character hash from a translation key.

**Parameters:**
- `key`: Translation key string

**Returns:** 6-character hash string

**Example:**
```typescript
import { generateHashKey } from '@pillage-first/i18n-hashing';

const hash = generateHashKey('Notifications'); // 'a274f4'
```

## Benefits

1. **Reduced Bundle Size**: ~50% reduction in localization file sizes
2. **Faster Downloads**: Smaller files mean faster initial page loads
3. **Better Compression**: Shorter keys compress better with gzip/brotli
4. **Maintainability**: Developers still work with readable keys
5. **No Runtime Cost**: All transformations happen at build time

## Development vs Production

| Aspect | Development | Production |
|--------|------------|-----------|
| Keys | Human-readable | 6-char hashes |
| Files | `extracted/` | `hashed/` |
| Debugging | Easy to read | Requires mapping |
| Bundle Size | Larger | ~50% smaller |
| Hot Reload | Fast | N/A |

## Gitignore

The `hashed/` directories are gitignored and regenerated on each build:

```gitignore
# Gitignored - generated at build time
apps/web/app/localization/locales/*/hashed/
```

## Testing

Run tests with:

```bash
npm run test
```

The package includes comprehensive tests for:
- Hash generation utilities
- File transformation logic
- Vite plugin replacement behavior

## Troubleshooting

### Keys not being replaced

1. Ensure `NODE_ENV=production` is set
2. Check that `extracted/` directory exists and contains JSON files
3. Verify the vite plugin is loaded before other build plugins

### Build fails with "directory doesn't exist"

Run `npm run localize` to generate the `extracted/` directory before building.

### Translations not loading

Verify the loader logic uses the correct directory based on `NODE_ENV`:
```typescript
const target = env.NODE_ENV === 'production' ? 'hashed' : 'extracted';
```

## License

AGPL-3.0-or-later

## Author

Jure Rotar <hello@jurerotar.com>
