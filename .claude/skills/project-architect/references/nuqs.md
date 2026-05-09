# Typed Search Params — NUQS

Replaces raw `useSearchParams` / `router.push` with type-safe, declarative search param
management. Especially useful for table filters, pagination, and any URL-driven state.

## Files to generate

### `src/contexts/NuqsProvider.tsx`

```typescript
'use client';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export function NuqsProvider({ children }: { children: React.ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
```

### Update `src/contexts/ProviderWrapper.tsx`

Add `NuqsProvider` inside the provider composition, wrapping the children:

```tsx
import { NuqsProvider } from '@/contexts/NuqsProvider';

// Inside ProviderWrapper return:
<NuqsProvider>{children}</NuqsProvider>;
```

### `src/hooks/use-table-search-params.ts`

A reusable hook pattern for paginated table filters:

```typescript
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export const tableSearchParamsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(''),
  sortBy: parseAsString.withDefault(''),
  sortOrder: parseAsString.withDefault('asc'),
};

export const useTableSearchParams = () =>
  useQueryStates(tableSearchParamsParsers, {
    history: 'push',
    shallow: false,
  });
```

### Usage pattern in feature table filters

When generating feature list pages that have search/filter/pagination, use NUQS:

```typescript
// features/orders/components/list/order-table-filter.tsx
import { useTableSearchParams } from '@/hooks/use-table-search-params';

export function OrderTableFilter() {
  const [params, setParams] = useTableSearchParams();

  return (
    <input
      value={params.search}
      onChange={(e) => setParams({ search: e.target.value, page: 1 })}
      placeholder='Search orders...'
    />
  );
}
```

### Feature-specific search params

For feature-specific filters beyond the base table params, create per-feature parsers:

```typescript
// features/orders/utils/search-params.ts
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

export const orderSearchParamsParsers = {
  status: parseAsStringEnum(['pending', 'completed', 'cancelled']).withDefault('pending'),
  customerId: parseAsString.withDefault(''),
};

export const useOrderSearchParams = () => useQueryStates(orderSearchParamsParsers);
```

## Setup commands to append

```bash
pnpm add nuqs
# No other setup needed — nuqs works with the NuqsAdapter already configured
```
