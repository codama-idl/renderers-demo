---
'@codama/renderers-demo': major
---

Render IDLs of the Codama v2 standard. The renderer now depends on the v2 releases of `@codama/nodes`, `@codama/visitors-core` and `@codama/errors`, and on `@codama/fragments` instead of `@codama/renderers-core`.

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
