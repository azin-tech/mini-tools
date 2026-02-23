# Contributing

Thanks for your interest in contributing to `@azin/mini-tools`!

## Setup

```bash
git clone https://github.com/azin-run/mini-tools.git
cd mini-tools
bun install
```

## Development

```bash
bun test              # run all tests (watch mode: bun test --watch)
bun run typecheck     # type-check with tsc
bun run lint          # lint with Biome
bun run lint:fix      # auto-fix lint issues
bun run build         # compile to dist/
```

## Running the CLI locally

```bash
bun run cli/index.ts yaml validate "key: value"
echo "key: value" | bun run cli/index.ts yaml validate -
```

## Adding a new tool

1. Create `src/<tool-name>/index.ts` — export named functions with structured return types
2. Create `src/<tool-name>/index.test.ts` — happy path, edge cases, error cases
3. Export from `src/index.ts`
4. Add a subcommand in `cli/index.ts`
5. Document in `README.md`

### Conventions

- **Never throw** — return `{ error?: string }` instead
- **Sync where possible** — only async when genuinely required (network, file I/O)
- **Zero deps where possible** — UUID, Base64, PostgreSQL need nothing; don't add a library if the native API covers it
- **Structured return types** — explicit interfaces, no `any`
- **Stdin support** — all text-input CLI commands should accept `-` for stdin

## Pull Requests

- Keep PRs focused — one tool or fix per PR
- Tests required for all new code
- `bun run typecheck && bun run lint && bun test` must all pass

## Releasing

Releases follow [Semantic Versioning](https://semver.org). Bump the version in `package.json` and tag:

```bash
git tag v0.x.0
git push --tags
npm publish
```
