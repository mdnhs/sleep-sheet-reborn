# Module Boundaries (ESLint)

Enforces architectural boundaries between layers using `eslint-plugin-boundaries`.
Prevents features from importing directly from other features without going through
the shared layer, and prevents shared utilities from importing feature-specific code.

## Files to generate

### `eslint.config.mjs` (add boundaries plugin — extends existing Next.js config)

```javascript
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import boundariesPlugin from 'eslint-plugin-boundaries';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    plugins: {
      boundaries: boundariesPlugin,
    },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        {
          mode: 'full',
          type: 'shared',
          pattern: [
            'src/components/**/*',
            'src/contexts/**/*',
            'src/hooks/**/*',
            'src/lib/**/*',
            'src/types/**/*',
            'src/services/**/*',
            'src/validations/**/*',
          ],
        },
        {
          mode: 'full',
          type: 'feature',
          capture: ['featureName'],
          pattern: ['src/features/*/**/*'],
        },
        {
          mode: 'full',
          type: 'app',
          capture: ['_', 'fileName'],
          pattern: ['src/app/**/*'],
        },
      ],
    },
    rules: {
      'boundaries/no-unknown': ['error'],
      'boundaries/no-unknown-files': ['error'],
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Shared layer can only import from shared
            { from: ['shared'], allow: ['shared'] },
            // Features can import from shared and from other features
            // (for cross-module communication — use sparingly)
            { from: ['feature'], allow: ['shared', 'feature'] },
            // App layer can import from anywhere
            { from: ['app'], allow: ['shared', 'feature'] },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
```

### `src/lib/cross-module/README.md`

```markdown
# Cross-Module Communication

When one feature needs data from another feature, do NOT import directly from
`@/features/other-feature/...`. Instead:

1. Create a shared abstraction in `src/lib/` or `src/services/`
2. Or use React Context / Zustand store in `src/contexts/`
3. Or pass data down via page-level server components in `src/app/`

This keeps feature modules decoupled and boundaries clean.
```

## Setup commands to append

```bash
pnpm add -D eslint-plugin-boundaries
# Verify module boundaries are working
pnpm eslint src/ --quiet
```
