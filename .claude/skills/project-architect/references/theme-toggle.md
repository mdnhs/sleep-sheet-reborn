# Dark/Light Theme Toggle

## Files to generate

### `src/contexts/ThemeProvider.tsx`

```typescript
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### `src/components/layout/theme-toggle.tsx`

```typescript
'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label='Toggle theme'
    >
      <Sun className='h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
      <Moon className='absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
    </Button>
  );
}
```

### Update `src/contexts/ProviderWrapper.tsx`

Make sure `ThemeProvider` is included with these props:

```tsx
<ThemeProvider attribute='class' defaultTheme='light' enableSystem disableTransitionOnChange>
```

### `globals.css` requirement

Ensure the `.dark` block of CSS variables is present (already in core globals.css template).

## Setup commands to append

```bash
pnpm add next-themes
```
