# Codama ➤ Renderers ➤ Demo

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/renderers-demo.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/renderers-demo.svg?style=flat&label=%40codama%2Frenderers-demo
[npm-url]: https://www.npmjs.com/package/@codama/renderers-demo

This package provides a demo implementation of a Codama renderer to help developers create their own.

## Installation

```sh
pnpm install @codama/renderers-demo
```

## Usage

Add the following script to your Codama configuration file.

```json
{
    "scripts": {
        "demo": {
            "from": "@codama/renderers-demo",
            "args": ["docs"]
        }
    }
}
```

This renders Markdown documentation for your program in the `docs` folder: a `README.md` overview page, and one page per account, defined type, instruction and PDA.

This renderer requires IDLs of the Codama v2 standard. To render a v1 IDL, upgrade it once with `codama upgrade path/to/idl.json`, or add `@codama/upgrade` as a `before` visitor of your configuration.

```json
{
    "before": ["@codama/upgrade"]
}
```

## Options

The `renderVisitor` accepts the following options as a second argument.

| Name                          | Type      | Default    | Description                                                     |
| ----------------------------- | --------- | ---------- | --------------------------------------------------------------- |
| `deleteFolderBeforeRendering` | `boolean` | `true`     | Whether to delete the output folder before rendering.           |
| `extension`                   | `string`  | `'md'`     | The extension of the rendered files.                            |
| `indexFilename`               | `string`  | `'README'` | The name of the program page, without its extension.            |
| `typeIndent`                  | `string`  | `'    '`   | The indentation of type definitions rendered on multiple lines. |
