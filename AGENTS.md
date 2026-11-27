# @codama/renderers-demo

## What this project is

`@codama/renderers-demo` is a small Codama renderer that turns a Codama IDL into Markdown documentation: one page per account, defined type, instruction and PDA, plus a program overview page listing its errors.

It is a **teaching resource** for developers writing their own renderer, and a starting point for forks. Keep the code simple enough to read top to bottom. Prefer fewer features to clever code, and think twice before removing helpers that a fork may build upon (e.g. `getCommentFragment`) or concepts it introduces on purpose (e.g. `ImportMap`).

## Mental model

The renderer has three layers, which mirror larger renderers such as `@codama/renderers-js`:

1. `src/visitors/getTypeVisitor.ts` and `src/visitors/getValueVisitor.ts`: render type and value nodes as TypeScript-like snippets.
2. `src/fragments/*`: assemble those snippets into account, defined type, instruction, PDA and program pages.
3. `src/visitors/getRenderMapVisitor.ts` and `src/visitors/renderVisitor.ts`: decide which pages exist, then write them to disk.

## End-to-end render flow

1. The caller invokes `renderVisitor(path, options)`, the default export, e.g. through the Codama CLI.
2. The output folder is deleted unless `deleteFolderBeforeRendering === false`.
3. `getRenderMapVisitor(options)` rejects root nodes of another major version (`CODAMA_ERROR__VERSION_MISMATCH`), then returns a `RenderMap` of pages keyed by path.
4. `getPageFragment` joins the sections of each page and lists the imports it collected as "See also" links.
5. `writeRenderMap` from `@codama/fragments` writes the pages.

## Core abstractions

- **`Fragment`** (`src/utils/fragment.ts`): an immutable piece of content with the imports it requires, built on `BaseFragment` and `createFragmentTemplate` from `@codama/fragments`. Compose fragments with the `fragment` template tag and `mergeFragments`.
- **`ImportMap`** (`src/utils/importMap.ts`): the names a fragment imports, grouped by symbolic path, e.g. `generatedTypes`. It is kept on purpose to introduce the concept that code renderers rely on. Here, imports become links resolved by `getImportMapLinks` and the `PathOverrides` of each page.
- **`RenderMap`**: from `@codama/fragments`, maps output paths to fragments.

## Output structure

- `README.md` (`indexFilename` option): the program page.
- `accounts/`, `definedTypes/`, `instructions/`, `pdas/`: one page per node, named after the camelCase form of its identifier.

Only `program.instructions`, `accounts`, `definedTypes`, `pdas` and `errors` of the root program are rendered. Additional programs, events, constants and sub-instructions are out of scope.

## Codama v2 conventions

- Node identifiers keep their original casing (e.g. `transfer_tokens`), so every rendered name goes through `@codama/fragments/casing`: camelCase for file names, links, fields and seeds, PascalCase for type names, title case for titles.
- Docs and error messages are `string | TextNode`; read them with `getTextNodeContent` from `@codama/nodes`.
- Instruction arguments are the instruction `data`: absent, a struct, or a link to a defined type.
- Type `transforms` and the `count` of arrays, sets and maps are ignored, since they affect encoding, not shape.
- Unsupported nodes throw `CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE` with the `path` of the node rather than rendering an empty string.

## Testing

- Unit tests in `test/fragments` and `test/visitors` build nodes with `@codama/nodes` and assert rendered fragments.
- `test/exports` smoke-tests the built `dist` in CommonJS and ES modules.
- E2E fixtures in `test/e2e/system` and `test/e2e/token` run `codama run demo` against the **built** package (`file:../../..`) and write committed `docs/`. CI requires a clean working tree after `pnpm build && pnpm test`, so the committed docs act as snapshots: regenerate and commit them when output changes.

## Commands

- `pnpm build`, `pnpm test` (types, treeshakability, unit, e2e, exports)
- `pnpm lint`, `pnpm lint:fix` (oxlint, type-aware through `oxlint-tsgolint`)
- `pnpm format`, `pnpm format:fix` (oxfmt)

Both tools extend `@solana-config/oxc`. Their `ignorePatterns` must stay in sync, and exclude generated fixture docs, fixture IDLs and agent docs.

## Release process

- Changesets drives versioning. Pending release notes live in `.changeset/*.md`.
- The release job of `.github/workflows/main.yml` delegates to `codama-idl/release-tools` on pushes to `main` and `[0-9]+.x` branches. While `.changeset/pre.json` exists, releases are candidates under the `rc` dist-tag.
- Use a `major` changeset whenever generated docs change during a major's candidacy.

## Practical repo facts

- Package manager: `pnpm@10.15.1`
- Required Node: `>=22.12.0`, or 22.18+ (declared in `devEngines`) to run `pnpm lint` and `pnpm format`, whose `*.config.ts` files rely on native type stripping
- TypeScript: strict, `module: "preserve"`, `moduleResolution: "bundler"`
