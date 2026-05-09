# Husky Git Hooks

Always generated. Sets up pre-commit linting with lint-staged and commit message validation
with commitlint. Ensures no bad code or malformed commit messages ever reach the repository.

## Files to generate

### `commitlint.config.js`

```javascript
module.exports = { extends: ['@commitlint/config-conventional'] };
```

### `.husky/pre-commit`

```sh
npx lint-staged
```

### `.husky/commit-msg`

```sh
npx --no -- commitlint --edit "$1"
```

### `.husky/pre-push`

```sh
pnpm build
```

### Add to `package.json` scripts section

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

## Commit message format (conventional commits)

| Type       | When to use                     |
| ---------- | ------------------------------- |
| `feat`     | New feature                     |
| `fix`      | Bug fix                         |
| `chore`    | Build, deps, config             |
| `refactor` | Code change, no new feature/fix |
| `docs`     | Documentation only              |
| `style`    | Formatting, whitespace          |
| `test`     | Adding or fixing tests          |
| `perf`     | Performance improvement         |

Example: `feat(orders): add order export to CSV`

## Setup commands

```bash
pnpm add -D husky @commitlint/cli @commitlint/config-conventional
pnpm exec husky init
chmod +x .husky/pre-commit .husky/commit-msg .husky/pre-push
```
