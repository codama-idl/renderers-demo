import { joinPath, Path } from '@codama/fragments';
import { camelCase } from '@codama/fragments/casing';

/**
 * The names imported by a fragment, grouped by the path they are imported from.
 *
 * Renderers generating code use import maps to collect the imports of every fragment of a file and render
 * them at the top. This demo uses one to introduce the concept: here, imports are rendered as links
 * in the "See also" section of pages instead.
 */
export type ImportMap = ReadonlyMap<Path, ReadonlySet<string>>;

/** Creates an import map from a list of paths and the names they import. */
export function createImportMap(imports: [Path, string[] | string][] = []): ImportMap {
    return Object.freeze(
        new Map(imports.map(([path, names]) => [path, new Set(typeof names === 'string' ? [names] : names)])),
    );
}

/** Returns a copy of the import map that also imports the given names from the given path. */
export function addToImportMap(map: ImportMap, path: Path, names: string[] | string): ImportMap {
    return mergeImportMaps([map, createImportMap([[path, names]])]);
}

/** Merges import maps into one, combining the names imported from the same path. */
export function mergeImportMaps(importMaps: ImportMap[]): ImportMap {
    const merged = new Map(importMaps[0]);
    for (const map of importMaps.slice(1)) {
        for (const [key, value] of map) {
            merged.set(key, new Set([...(merged.get(key) ?? []), ...value]));
        }
    }
    return Object.freeze(merged);
}

/** Maps the paths of an import map, e.g. `generatedTypes`, to the actual paths of their files. */
export type PathOverrides = Record<Path, Path>;

/**
 * Renders the imports of an import map as a list of Markdown links to the pages of the imported nodes.
 * Symbolic paths, e.g. `generatedTypes`, resolve to sibling folders, e.g. `../definedTypes`, unless overridden.
 *
 * @example
 * ```ts
 * getImportMapLinks(createImportMap([['generatedTypes', 'TokenState']]));
 * // ["- [TokenState](../definedTypes/tokenState.md)"]
 * ```
 */
export function getImportMapLinks(importMap: ImportMap, pathOverrides: PathOverrides = {}): string[] {
    return [...resolvePaths(importMap, pathOverrides).entries()].flatMap(([path, names]) =>
        [...names].map(name => `- [${name}](${joinPath(path, camelCase(name))}.md)`),
    );
}

function resolvePaths(importMap: ImportMap, pathOverrides: PathOverrides = {}): ImportMap {
    const DEFAULT_PATH_OVERRIDES: PathOverrides = {
        generatedAccounts: joinPath('..', 'accounts'),
        generatedInstructions: joinPath('..', 'instructions'),
        generatedPdas: joinPath('..', 'pdas'),
        generatedTypes: joinPath('..', 'definedTypes'),
    };

    pathOverrides = { ...DEFAULT_PATH_OVERRIDES, ...pathOverrides };
    const newEntries = [...importMap.entries()].map(([path, names]) => {
        return [pathOverrides[path] ?? path, names] as const;
    });

    return Object.freeze(new Map(newEntries));
}
