---
name: project-architect
description: >
  Use this skill whenever the user wants to scaffold, initialize, or set up a new Next.js enterprise
  project from scratch. Triggers include: "start a new Next.js project", "scaffold a new project",
  "set up my Next.js app", "create a new project with this stack", "initialize a new Next.js app",
  "architect a new project", or any request to bootstrap a Next.js application with an enterprise
  structure. Always use this skill before generating any project files — it determines which optional
  features to include and ensures every config file is generated correctly and consistently.
---

# Next.js Project Architect

Interactively scaffolds a complete, production-ready Next.js enterprise project based on the
established architecture manifest. Asks the user which optional features to enable, then generates
all necessary files, configs, and folder structure.

---

## Phase 1 — Interview

Collect info in two steps — do not combine them into one message.

### Step 1 — API config

Ask the user for:

- **API base URL** (e.g. `https://api.myapp.com`)
- **API prefix** (e.g. `/api`)
- **API version** (e.g. `/v1`)

### Step 2 — Optional features

After the user answers Step 1, use the `AskUserQuestion` tool with `type: checkbox` to present
the following options so the user can select interactively:

- Translation — Non-route (next-intl, locale without URL change)
- Translation — Route (next-intl, locale in URL via [locale] segment)
- Dark/Light Theme Toggle
- TanStack Query
- Case Conversion (mapSnakeToCamel / mapCamelToSnake + SnakeToCamelCase / CamelCaseKeys / SnakeCaseKeys types)
- API Ecosystem
- Module Boundaries (ESLint)
- Typed Search Params (NUQS)
- Permission System (bitfield compressPermissions/decompressPermissions, PermissionGate, ClientPermissionGate, usePermissions hook, ROUTE_PERMISSIONS)

Once the user confirms their selection, read ONLY the reference files for the features they selected.
Do not load reference files for features they skipped.

---

## Phase 2 — Generate Core Structure

After the interview, generate all files in this order:

> `create-next-app` and `shadcn init` are assumed done. Do not generate a `package.json`.

### 1. Config files (always generated)

- Read `references/prettier.md` — run its setup commands, then generate all its files (`prettier.config.js`, `.prettierignore`, `.lintstagedrc.json`).
- Read `references/husky.md` — run its setup commands, then generate all its files (`.husky/pre-commit`, `.husky/commit-msg`, `commitlint.config.js`, add `prepare` to `package.json`).
- Run setup commands from each selected feature's reference file, then generate their files.
- `.env.local` — populate with interview answers:
  ```
  NEXT_PUBLIC_API_BASE_URL=<api-base-url>
  NEXT_PUBLIC_API_PREFIX=<api-prefix>
  NEXT_PUBLIC_API_VERSION=<api-version>
  NEXT_PUBLIC_API_TIMEOUT=30000
  NEXT_PUBLIC_DEBUG_API=false
  MOCK_CLIENT_IP=
  ```
- `.env.example` — same keys, all values empty

### 2. Folder skeleton

Create the full directory tree as defined in the manifest. Generate placeholder `index.ts` or
`.gitkeep` files in leaf directories so the structure is visible in git.

```
src/
├── app/
│   ├── (auth)/layout.tsx
│   ├── (main)/
│   │   ├── (protected)/
│   │   │   ├── (dashboard_layout)/
│   │   │   │   ├── dashboard/          # .gitkeep
│   │   │   │   └── layout.tsx
│   │   │   └── (global_layout)/layout.tsx
│   │   └── (public)/
│   │       ├── unauthorized/page.tsx
│   │       └── maintenance/page.tsx
│   └── layout.tsx
├── features/          # empty, features added per-module
├── components/
│   ├── ui/            # shadcn drops files here
│   ├── form/
│   ├── layout/
│   │   ├── sidebar/navs/
│   │   └── header/navs/
│   ├── table/
│   └── icons/
├── lib/
│   ├── api-client/
│   ├── permission/
│   ├── routes/
│   ├── utils.ts
│   ├── constants.ts
│   └── font.ts
├── contexts/
├── hooks/
│   └── api/
│       ├── mutation/
│       └── query/
├── types/
│   ├── index.ts
│   └── icons.ts
├── services/
└── validations/

public/
├── assets/images/
└── fonts/

deployment/
```

### 3. Core lib files (always generated)

Read `references/core-lib-files.md` for the full source of each file. Generate them verbatim:

- `src/lib/utils.ts`
- `src/lib/routes/api-routes.ts` — with `auth` group pre-populated, empty shell for features
- `src/lib/routes/app-routes.ts` — same pattern
- `src/types/index.ts` — placeholder with `ServiceResponse`, `PaginationType` only
- `src/contexts/ProviderWrapper.tsx` — minimal shell; optional features add their providers here
- `src/contexts/LoadingOverlayProvider.tsx` — loading overlay context (imported by ProviderWrapper)

### 4. Font (always generated)

Do **not** hardcode a font name. Instead, extract whatever fonts `create-next-app` already placed in the root layout:

1. **Read** `src/app/layout.tsx`.
2. **Identify** every `next/font` import (`next/font/google` or `next/font/local`) and the corresponding `const` declarations in that file.
3. **Create** `src/lib/font.ts` — re-export each font as a named `export const`, preserving the exact constructor options verbatim.
4. **Update** `src/app/layout.tsx`:
   - Remove the inline `next/font` import(s) and `const` declaration(s).
   - Add `import { <fontVars> } from '@/lib/font'` in their place.
   - Leave everything else (metadata, className, JSX) untouched.

**Example** — if the root layout contained:

```typescript
import { Geist, Geist_Mono } from 'next/font/google';
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
```

Then `src/lib/font.ts` becomes:

```typescript
import { Geist, Geist_Mono } from 'next/font/google';
export const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
export const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
```

And `src/app/layout.tsx` replaces those lines with:

```typescript
import { geistSans, geistMono } from '@/lib/font';
```

`next/font` is built into Next.js — no install needed. The font variables are applied to `<body>` in the layout (see translation reference files for layout templates).

---

## Phase 3 — Optional Feature Files

For each enabled feature, read its reference file and generate the additional files it specifies.
Reference files are:

| Feature                 | Reference file                        |
| ----------------------- | ------------------------------------- |
| Translation (non-route) | `references/translation-non-route.md` |
| Translation (route)     | `references/translation-route.md`     |
| Theme toggle            | `references/theme-toggle.md`          |
| TanStack Query          | `references/tanstack-query.md`        |
| Case Conversion         | `references/case-conversion.md`       |
| API ecosystem           | `references/api-ecosystem.md`         |
| Module boundaries       | `references/module-boundaries.md`     |
| NUQS                    | `references/nuqs.md`                  |
| Permission              | `references/permission.md`            |

---

## Naming Conventions (always enforce)

| Item               | Convention                 | Example             |
| ------------------ | -------------------------- | ------------------- |
| Files (components) | kebab-case                 | `order-table.tsx`   |
| Files (hooks)      | kebab-case, `use-` prefix  | `use-order-list.ts` |
| Directories        | kebab-case                 | `order-processing/` |
| React Components   | PascalCase                 | `OrderTable`        |
| Functions/Hooks    | camelCase                  | `useOrderList`      |
| Constants          | SCREAMING_SNAKE_CASE       | `API_ROUTES`        |
| Types/Interfaces   | PascalCase                 | `OrderResponse`     |
| API response types | PascalCase + `ApiResponse` | `OrderApiResponse`  |
| Zod schemas        | camelCase + `Schema`       | `orderSchema`       |

---

## Final Checklist

Before finishing, verify:

- [ ] `.env.local` has real values from interview; `.env.example` has empty values
- [ ] Every enabled optional feature has its files generated
- [ ] Disabled features have zero files generated (no dead code)
- [ ] Install commands from all selected feature reference files were shown to the user
