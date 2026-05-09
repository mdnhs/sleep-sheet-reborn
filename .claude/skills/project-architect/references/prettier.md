# Prettier + Tailwind CSS

Always generated. Configures Prettier with Tailwind CSS class sorting and wires it into
Husky's lint-staged pre-commit hook.

## Files to generate

### `prettier.config.js`

```javascript
module.exports = {
  printWidth: 120,
  jsxSingleQuote: true,
  quoteProps: 'as-needed',
  bracketSameLine: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
};
```

### `.prettierignore`

```
node_modules
.next
dist
build
public
*.min.js
```

### `.lintstagedrc.json`

```json
{
  "*.{js,jsx,ts,tsx}": ["prettier --write --ignore-path .prettierignore", "eslint --fix", "eslint"],
  "*.{css,scss,json,md,yml}": ["prettier --write --ignore-path .prettierignore"]
}
```

## Setup commands

```bash
pnpm add -D prettier prettier-plugin-tailwindcss lint-staged
```
