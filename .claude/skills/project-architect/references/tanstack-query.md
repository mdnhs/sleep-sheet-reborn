# TanStack Query Reference

## Overview

Client-side server-state management with `@tanstack/react-query`. Provides query caching, deduplication,
background refetching, and mutations. The `QueryProvider` wraps the app with a shared `QueryClient`.

## Setup commands to append

```bash
pnpm add @tanstack/react-query
pnpm add @tanstack/react-query-devtools
```

---

## Files to generate

### `src/contexts/QueryProvider.tsx`

```tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export interface QueryOptions {
  staleTime?: number;
  gcTime?: number;
  retry?: number;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: false,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Update `src/contexts/ProviderWrapper.tsx`

Import `QueryProvider` and wrap the outermost children:

```tsx
import { QueryProvider } from '@/contexts/QueryProvider';

// Wrap as the outermost provider:
<QueryProvider>{/* other providers */}</QueryProvider>;
```
