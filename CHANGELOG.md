# @codama/renderers-demo

## 2.0.0-rc.0

### Major Changes

- [#136](https://github.com/codama-idl/renderers-demo/pull/136) [`4275753`](https://github.com/codama-idl/renderers-demo/commit/427575347ad41310c9d708bf583cb0961a73a3c7) Thanks [@codama-releases](https://github.com/apps/codama-releases)! - Start major 2. Release candidates publish under the `rc` dist-tag while this major is in development.

- [#139](https://github.com/codama-idl/renderers-demo/pull/139) [`5082c35`](https://github.com/codama-idl/renderers-demo/commit/5082c35f10e11c82dd776d5a1bc24a670c7d9639) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Require Node.js 22.12.0 or later, as Codama v2 does.
  
  **BREAKING CHANGES**
  
  **Node.js 20 is no longer supported.** The package now declares `"engines": { "node": ">=22.12.0" }`, the first Node.js 22 release that supports `require(esm)` by default. Node.js 20 reached its end of life in April 2026. This only concerns the environment running the renderer: the generated documentation is unaffected.

- [#138](https://github.com/codama-idl/renderers-demo/pull/138) [`5e291bb`](https://github.com/codama-idl/renderers-demo/commit/5e291bbe77a1dac69babc2e8a53d5ecc5f50d0c3) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix "See also" links to defined types, which pointed to a `types` folder instead of the `definedTypes` folder their pages are written to.

- [#137](https://github.com/codama-idl/renderers-demo/pull/137) [`8fa3898`](https://github.com/codama-idl/renderers-demo/commit/8fa3898426e3d4c56eb19cb102f022812fb60853) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Render IDLs of the Codama v2 standard. The renderer now depends on the v2 releases of `@codama/nodes`, `@codama/visitors-core` and `@codama/errors`, and on `@codama/fragments` instead of `@codama/renderers-core`.
  
  **BREAKING CHANGES**
  
  **Codama v2 IDLs are required.** The renderer only accepts trees of the v2 standard, and rendering a root node whose `version` is not a 2.x version throws `CODAMA_ERROR__VERSION_MISMATCH`. Upgrade v1 IDLs with the `codama upgrade` command, or with `@codama/upgrade` as a `before` visitor of your Codama configuration.
  
  ```json
  {
      "idl": "program/idl.json",
      "before": ["@codama/upgrade"],
      "scripts": { "demo": { "from": "@codama/renderers-demo", "args": ["docs"] } }
  }
  ```
  
  **Names are derived from identifiers of any casing.** Node identifiers keep their original casing in v2, e.g. `transfer_tokens` from an Anchor IDL, and every name rendered in the documentation goes through the casing helpers of `@codama/fragments/casing`. File names, links, struct field values and PDA seeds use the camelCase form of identifiers, and titles use their title case form.
  
  **Instruction arguments are the instruction data.** The "Instruction arguments" section renders the `data` of the instruction, which may be a struct or a link to a defined type, and enum variants render their `data` inline when it is a struct and under a `fields` field otherwise. Enum values render their payload, e.g. `Command.Move({ x: 1, y: 2 })`.
  
  **Unrenderable nodes throw.** Value nodes that cannot be rendered in documentation, such as `injectedValueNode`, throw `CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE` with the `path` of the node instead of rendering an empty string.

## 1.0.7

### Patch Changes

- [#83](https://github.com/codama-idl/renderers-demo/pull/83) [`bd76ed8`](https://github.com/codama-idl/renderers-demo/commit/bd76ed82faa5245a4adf1de3b52fa24578310f53) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Support `@codama/nodes@1.10`, whose node array attributes are now optional (`Array<T> | undefined`). Array reads and helper call sites are guarded with `?? []` throughout the renderer.

## 1.0.6

### Patch Changes

- [#73](https://github.com/codama-idl/renderers-demo/pull/73) [`c08e199`](https://github.com/codama-idl/renderers-demo/commit/c08e1998e5eea2a29f263f99be6a791911c3f79a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Enabled Rollup treeshaking pass

## 1.0.5

### Patch Changes

- [#63](https://github.com/codama-idl/renderers-demo/pull/63) [`a57624a`](https://github.com/codama-idl/renderers-demo/commit/a57624a2b1bcf358861e6c33da4f18532413bb81) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use latest RenderMap type from renderers-core

## 1.0.4

### Patch Changes

- [#15](https://github.com/codama-idl/renderers-demo/pull/15) [`66be4db`](https://github.com/codama-idl/renderers-demo/commit/66be4db808a4eeee3c75a0437858946a8345ea4f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump Codama

## 1.0.3

### Patch Changes

- [`2874afc`](https://github.com/codama-idl/renderers-demo/commit/2874afccd5c51e034f8ebdd94ea18f8ca4ba4913) Thanks [@lorisleiva](https://github.com/lorisleiva)! - This is another test patch update.

## 1.0.2

### Patch Changes

- [#7](https://github.com/codama-idl/renderers-demo/pull/7) [`06e4f2c`](https://github.com/codama-idl/renderers-demo/commit/06e4f2c05943a857ec21f69be5980457400d3320) Thanks [@lorisleiva](https://github.com/lorisleiva)! - This is a test patch update to ensure the extraction of the demo renderer to its own repo was successful.
