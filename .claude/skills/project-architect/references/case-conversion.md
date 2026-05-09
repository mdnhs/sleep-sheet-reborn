# Case Conversion

Adds snake↔camel case conversion utilities. Enable this feature to get full implementations of
`mapSnakeToCamel` / `mapCamelToSnake` in `src/lib/utils.ts` and the matching TypeScript type
utilities in `src/types/index.ts`.

No setup commands needed — pure TypeScript, no extra dependencies.

---

## Files to generate / update

### Update `src/lib/utils.ts`

Replace the TODO stubs with full implementations. Keep the existing `cn()` function at the top.

```typescript
import type { CamelCaseKeys, SnakeCaseKeys } from '@/types';

// Convert snake_case string to camelCase
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Convert camelCase string to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function mapSnakeToCamel<T>(obj: T): CamelCaseKeys<T> {
  if (obj === null || obj === undefined) {
    return obj as any;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => mapSnakeToCamel(item)) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key);
      result[camelKey] = mapSnakeToCamel(value);
    }

    return result;
  }

  return obj as any;
}

export function mapCamelToSnake<T>(obj: T): SnakeCaseKeys<T> {
  if (obj === null || obj === undefined) {
    return obj as any;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => mapCamelToSnake(item)) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = toSnakeCase(key);
      result[snakeKey] = mapCamelToSnake(value);
    }

    return result;
  }

  return obj as any;
}
```

---

### Update `src/types/index.ts`

Append the following type utilities to the existing file (which already has `ServiceResponse` and
`PaginationType`):

```typescript
// Case conversion type utilities

export type SnakeToCamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<SnakeToCamelCase<Tail>>}`
  : S;

export type CamelCaseKeys<T> =
  T extends Array<infer U>
    ? Array<CamelCaseKeys<U>>
    : T extends object
      ? {
          [K in keyof T as SnakeToCamelCase<string & K>]: CamelCaseKeys<T[K]>;
        }
      : T;

export type CamelToSnakeCase<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends Uppercase<Head>
    ? Head extends Lowercase<Head>
      ? `${Head}${CamelToSnakeCase<Tail>}`
      : `_${Lowercase<Head>}${CamelToSnakeCase<Tail>}`
    : `${Head}${CamelToSnakeCase<Tail>}`
  : S;

export type SnakeCaseKeys<T> =
  T extends Array<infer U>
    ? Array<SnakeCaseKeys<U>>
    : T extends object
      ? {
          [K in keyof T as CamelToSnakeCase<string & K>]: SnakeCaseKeys<T[K]>;
        }
      : T;
```

---

## Note: API Ecosystem integration

If both Case Conversion and API Ecosystem are selected, `references/api-ecosystem.md` already
imports `mapSnakeToCamel` / `mapCamelToSnake` from `@/lib/utils` — no extra wiring needed.
