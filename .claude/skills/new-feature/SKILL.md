---
name: new-feature
description: >
  Use this skill whenever the user wants to scaffold, create, or add a new feature module to their
  Next.js enterprise project. Triggers include: "add a new feature", "create a module for X",
  "scaffold [entity] CRUD", "add [entity] to the project", "create pages for [entity]", or any
  request to build out a new domain entity (users, orders, products, invoices, etc.).
  Always use this skill when generating files that need to follow the project's feature-based
  architecture — do NOT improvise the structure without consulting this skill first.
---

# Next.js Feature Scaffolder

Generates a complete, architecture-compliant feature module for the project described in CLAUDE.md.
Follows the feature-based module pattern with service layer, TanStack Query hooks, Zod validation,
and Next.js App Router route groups.

---

## Before You Start

1. Confirm the **feature name** (e.g. `orders`, `invoices`, `customers`)
2. Confirm the **API base path** (e.g. `/orders`) — check `lib/routes/api-routes.ts` if unsure
3. Confirm which **CRUD operations** are needed: list / create / edit / details / delete
4. Check if a **permission prefix** is needed (e.g. `order_management.order`)
5. Ask if this feature lives under `(dashboard_layout)` or `(global_layout)`

---

## Step 1 — App Router Pages

Create route group files under:

```
src/app/(main)/(protected)/(dashboard_layout)/(feature-group)/[feature-name]/
├── (list)/
│   ├── layout.tsx
│   └── page.tsx
├── (mutation)/
│   ├── create/
│   │   └── page.tsx
│   └── [id]/
│       └── edit/
│           └── page.tsx
└── [id]/
    └── page.tsx
```

### page.tsx pattern (list)

```tsx
import { FeatureTable } from '@/features/[feature-name]/components/list/[feature]-table';

export default function FeatureListPage() {
  return <FeatureTable />;
}
```

### layout.tsx pattern (list)

```tsx
export default function FeatureListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

---

## Step 2 — Feature Module Structure

Create all files under `src/features/[feature-name]/`:

```
src/features/[feature-name]/
├── components/
│   ├── list/
│   │   ├── columns.tsx
│   │   ├── [feature]-table.tsx
│   │   └── [feature]-table-filter.tsx
│   ├── create/
│   │   └── index.tsx
│   ├── edit/
│   │   └── index.tsx
│   ├── details/
│   │   └── index.tsx
│   └── index.tsx
├── hooks/
│   └── api/
│       ├── mutation/
│       │   ├── use-create-[feature].ts
│       │   ├── use-update-[feature].ts
│       │   └── use-delete-[feature].ts
│       └── query/
│           ├── use-[feature]-list.ts
│           └── use-[feature]-detail.ts
├── services/
│   ├── api.ts
│   ├── service.ts
│   └── mapper.ts
├── types/
│   └── index.ts
├── utils/
│   ├── constants.ts
│   └── query-keys.ts
└── validations/
    └── [feature]-schema.ts
```

---

## Step 3 — File Templates

### `types/index.ts`

```typescript
import { CamelCaseKeys } from '@/types';

export interface [Feature]ApiResponse {
  id: string;
  // snake_case fields from API
  created_at: string;
  updated_at: string;
}

export type [Feature] = CamelCaseKeys<[Feature]ApiResponse>;

export interface Create[Feature]Payload {
  // camelCase fields
}

export interface Update[Feature]Payload extends Partial<Create[Feature]Payload> {}
```

### `utils/query-keys.ts`

```typescript
export const [FEATURE]_QUERY_KEYS = {
  all: ['[feature]'] as const,
  lists: () => [[FEATURE]_QUERY_KEYS.all[0], 'list'] as const,
  list: (filters: Record<string, string>) => [...[FEATURE]_QUERY_KEYS.lists(), filters] as const,
  details: () => [[FEATURE]_QUERY_KEYS.all[0], 'detail'] as const,
  detail: (id: string) => [...[FEATURE]_QUERY_KEYS.details(), id] as const,
};
```

### `services/api.ts`

```typescript
import { API_ROUTES } from '@/lib/routes/api-routes';
import { del, get, post, put } from '@/lib/api-client';
import { Create[Feature]Payload, Update[Feature]Payload } from '../types';

export const [feature]Api = {
  list: (params: Record<string, string>) => get(API_ROUTES.[feature].list, params),
  detail: (id: string) => get(API_ROUTES.[feature].detail(id)),
  create: (data: Create[Feature]Payload) => post(API_ROUTES.[feature].create, data),
  update: (id: string, data: Update[Feature]Payload) => put(API_ROUTES.[feature].update(id), data),
  delete: (id: string) => del(API_ROUTES.[feature].detail(id)),
};
```

### `services/mapper.ts`

```typescript
import { mapSnakeToCamel, mapCamelToSnake } from '@/lib/utils';
import { [Feature], [Feature]ApiResponse } from '../types';

export const map[Feature]Response = (data: [Feature]ApiResponse[]): [Feature][] =>
  data?.map(mapSnakeToCamel) ?? [];

export const map[Feature]Request = (data: Record<string, unknown>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(mapCamelToSnake(data))
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
```

### `services/service.ts`

```typescript
import { ServiceResponse } from '@/types';
import { [feature]Api } from './api';
import { map[Feature]Response, map[Feature]Request } from './mapper';
import { [Feature], Create[Feature]Payload, Update[Feature]Payload } from '../types';

export const [feature]Service = {
  async getList(params: Record<string, unknown>): Promise<ServiceResponse<[Feature][]>> {
    const response = await [feature]Api.list(map[Feature]Request(params));
    if (response.data?.error) return { error: true, message: response.data.message, data: null };
    return {
      error: false,
      message: response.data?.message ?? 'Success',
      data: map[Feature]Response(response.data?.data ?? []),
      pagination: response.data?.pagination,
    };
  },

  async getDetail(id: string): Promise<ServiceResponse<[Feature]>> {
    const response = await [feature]Api.detail(id);
    if (response.data?.error) return { error: true, message: response.data.message, data: null };
    return { error: false, message: 'Success', data: mapSnakeToCamel(response.data?.data) };
  },

  async create(data: Create[Feature]Payload): Promise<ServiceResponse<[Feature]>> {
    const response = await [feature]Api.create(data);
    if (response.data?.error) return { error: true, message: response.data.message, data: null };
    return { error: false, message: response.data?.message ?? 'Created', data: response.data?.data };
  },

  async update(id: string, data: Update[Feature]Payload): Promise<ServiceResponse<[Feature]>> {
    const response = await [feature]Api.update(id, data);
    if (response.data?.error) return { error: true, message: response.data.message, data: null };
    return { error: false, message: response.data?.message ?? 'Updated', data: response.data?.data };
  },

  async delete(id: string): Promise<ServiceResponse<null>> {
    const response = await [feature]Api.delete(id);
    if (response.data?.error) return { error: true, message: response.data.message, data: null };
    return { error: false, message: response.data?.message ?? 'Deleted', data: null };
  },
};
```

### `hooks/api/query/use-[feature]-list.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { [feature]Service } from '../../../services/service';
import { [FEATURE]_QUERY_KEYS } from '../../../utils/query-keys';

export const use[Feature]List = (filters: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: [FEATURE]_QUERY_KEYS.list(filters),
    queryFn: () => [feature]Service.getList(filters),
  });
```

### `hooks/api/mutation/use-create-[feature].ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { [feature]Service } from '../../../services/service';
import { [FEATURE]_QUERY_KEYS } from '../../../utils/query-keys';
import { Create[Feature]Payload } from '../../../types';

export const useCreate[Feature] = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Create[Feature]Payload) => [feature]Service.create(data),
    onSuccess: (response) => {
      if (response.error) return toast.error(response.message);
      queryClient.invalidateQueries({ queryKey: [FEATURE]_QUERY_KEYS.lists() });
      toast.success(response.message);
    },
    onError: () => toast.error('Something went wrong'),
  });
};
```

### `validations/[feature]-schema.ts`

```typescript
import { z } from 'zod';

export const create[Feature]Schema = z.object({
  // Add fields here
  name: z.string().min(1, 'Name is required'),
});

export const update[Feature]Schema = create[Feature]Schema.partial();

export type Create[Feature]FormValues = z.infer<typeof create[Feature]Schema>;
export type Update[Feature]FormValues = z.infer<typeof update[Feature]Schema>;
```

---

## Step 4 — Register Routes

Add to `src/lib/routes/api-routes.ts`:

```typescript
[feature]: {
  list: '/[feature]',
  create: '/[feature]',
  detail: (id: string) => `/[feature]/${id}`,
  update: (id: string) => `/[feature]/${id}`,
},
```

Add to `src/lib/routes/app-routes.ts`:

```typescript
[feature]: {
  index: '/[feature]',
  create: '/[feature]/create',
  details: (id: string) => `/[feature]/${id}`,
  edit: (id: string) => `/[feature]/${id}/edit`,
},
```

---

## Step 5 — Register Permissions (if applicable)

Add to `src/lib/permission/permissions.ts`:

```typescript
[FEATURE]_VIEW_LIST: '[module].[feature].view_list',
[FEATURE]_CREATE: '[module].[feature].create',
[FEATURE]_EDIT: '[module].[feature].edit',
[FEATURE]_DELETE: '[module].[feature].delete',
```

---

## Naming Conventions Reminder

| Thing                  | Convention                 | Example                 |
| ---------------------- | -------------------------- | ----------------------- |
| Directory              | kebab-case                 | `order-items/`          |
| Component files        | kebab-case                 | `order-table.tsx`       |
| Hook files             | kebab-case with `use-`     | `use-order-list.ts`     |
| Types/Interfaces       | PascalCase                 | `OrderItem`             |
| API response types     | PascalCase + `ApiResponse` | `OrderItemApiResponse`  |
| Zod schemas            | camelCase + `Schema`       | `orderItemSchema`       |
| Constants              | SCREAMING_SNAKE_CASE       | `ORDER_ITEM_QUERY_KEYS` |
| Service/hook instances | camelCase                  | `orderItemService`      |

---

## Checklist Before Handing Off

- [ ] All `[feature]` / `[Feature]` / `[FEATURE]` placeholders replaced
- [ ] API routes registered in `api-routes.ts` and `app-routes.ts`
- [ ] Permissions added if required
- [ ] Zod schema fields match the actual API payload
- [ ] `mapper.ts` handles all fields that need snake↔camel conversion
- [ ] Query keys are unique and don't collide with other features
- [ ] Mutation hooks invalidate the correct query keys on success
