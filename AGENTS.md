# opencode-disabler

Disable globally-installed OpenCode plugins and skills on a per-project basis.

## How It Works

- **Plugins** — Registers a Bun runtime plugin that intercepts `import()` calls for disabled plugins at the module-resolution level, returning a noop module instead.
- **Skills** — Blocks disabled skills via the `tool.execute.before` hook, rejecting tool calls with an error.

The plugin must be listed **first** in the global `plugin` array to intercept other plugins before they load.

## Commands

```bash
bun install        # Install dependencies
bun run typecheck  # Type check without emitting
bun run lint       # Lint with oxlint
bun run lint:fix   # Lint with oxlint (autofix)
bun run format     # Format with oxfmt
bun run build      # Compile to dist/
```

Always use `bun` — never `node`, `npm`, `npx`, `yarn`, or `pnpm`.

## TypeScript Execution Model

### Local Development

Bun runs TypeScript directly — no compilation step needed.

- `main` in `package.json` points to `src/index.ts`
- Run directly: `bun src/index.ts`

### Production Build (Publish)

`bun run build` compiles to `dist/` for npm consumers who don't have Bun.

1. `tsc` compiles `src/` → `dist/` (JS + declarations)
2. `tsc-alias` resolves path aliases in the compiled output
3. `prepublishOnly` runs the build, then `scripts/prepublish.ts` rewrites `main` from `src/index.ts` to `dist/src/index.js`
4. `postpublish` restores `package.json` via `git checkout`

## Release

Use the **Release** GitHub Actions workflow (`workflow_dispatch`). Enter the version (e.g., `1.1.0`) — it typechecks, lints, builds, bumps version in `package.json`, commits, tags, publishes to npm, and creates a GitHub Release. Tags have no `v` prefix.

### Version Decision

- If the user specifies an exact version, use it as-is.
  Otherwise, decide the bump level based on changes since the last release (never bump major unless user explicitly asks):
  - **minor** — New features, new config options, new blocking mechanisms
  - **patch** — Bug fixes, refactors, docs, dependency updates
- Never ask the user which version to bump. Decide and proceed.
