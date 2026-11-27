import { BaseFragment, createFragmentTemplate, mapFragmentContent, Path } from '@codama/fragments';
import { getTextNodeContent, TextNode } from '@codama/nodes';

import {
    addToImportMap,
    createImportMap,
    getImportMapLinks,
    ImportMap,
    mergeImportMaps,
    PathOverrides,
} from './importMap';

/**
 * An immutable piece of rendered content, along with the imports it requires. Fragments compose through
 * {@link fragment} templates and {@link mergeFragments}, which merge their imports along the way.
 */
export type Fragment = BaseFragment & Readonly<{ imports: ImportMap }>;

function createFragment(content: string): Fragment {
    return Object.freeze({ content, imports: createImportMap() });
}

function isFragment(value: unknown): value is Fragment {
    return typeof value === 'object' && value !== null && 'content' in value;
}

/**
 * Creates a fragment from a template literal. Interpolated fragments contribute their imports to the result.
 *
 * @example
 * ```ts
 * const type = fragment`Option<${visit(node.item, typeVisitor)}>`;
 * ```
 */
export function fragment(template: TemplateStringsArray, ...items: unknown[]): Fragment {
    return createFragmentTemplate(template, items, isFragment, mergeFragments);
}

/**
 * Merges fragments into one, combining their contents with the given function and their imports together.
 * `undefined` fragments are ignored.
 *
 * @example
 * ```ts
 * const list = mergeFragments(items, contents => contents.join('\n'));
 * ```
 */
export function mergeFragments(
    fragments: (Fragment | undefined)[],
    mergeContent: (contents: string[]) => string,
): Fragment {
    const filteredFragments = fragments.filter((f): f is Fragment => f !== undefined);
    return Object.freeze({
        content: mergeContent(filteredFragments.map(fragment => fragment.content)),
        imports: mergeImportMaps(filteredFragments.map(fragment => fragment.imports)),
    });
}

/**
 * Returns a copy of the fragment that also imports the given names from the given path.
 *
 * @example
 * ```ts
 * addFragmentImports(fragment`${typeName}`, 'generatedTypes', typeName);
 * ```
 */
export function addFragmentImports(fragment: Fragment, path: Path, names: string[] | string): Fragment {
    return Object.freeze({ ...fragment, imports: addToImportMap(fragment.imports, path, names) });
}

/** Renders the YAML frontmatter of a page, used by static site generators for its title and description. */
export function getFrontmatterFragment(title: string, description: string): Fragment {
    return fragment`---\ntitle: ${title}\ndescription: ${description}\n---`;
}

/** Renders the main heading of a page, followed by the docs of its node when there are any. */
export function getTitleAndDescriptionFragment(title: string, docs?: TextNode | string): Fragment {
    const description = docs ? getTextNodeContent(docs) : '';
    return mergeFragments([fragment`# ${title}`, description ? fragment`${description}` : undefined], cs =>
        cs.join('\n\n'),
    );
}

/** Wraps a fragment in a fenced code block, e.g. with the `ts` language for syntax highlighting. */
export function getCodeBlockFragment(code: Fragment, language: string = ''): Fragment {
    return mapFragmentContent(code, c => `\`\`\`${language}\n${c}\n\`\`\``);
}

/**
 * Renders a Markdown table whose columns are padded to align, so that the table also reads well as plain text.
 *
 * @param headers - The header of each column.
 * @param rows - The cells of each row, in the order of the headers.
 */
export function getTableFragment(headers: (Fragment | string)[], rows: (Fragment | string)[][]): Fragment {
    const toFragment = (cell: Fragment | string) => (typeof cell === 'string' ? createFragment(cell) : cell);
    const headerFragments = headers.map(toFragment);
    const rowFragments = rows.map(row => row.map(toFragment));
    const colWidths = headerFragments.map((header, colIndex) =>
        Math.max(header.content.length, ...rowFragments.map(row => row[colIndex]?.content?.length ?? 0)),
    );
    const padCells = (f: Fragment, colIndex: number) => mapFragmentContent(f, c => c.padEnd(colWidths[colIndex] ?? 0));
    const mergeCells = (fs: Fragment[]) => mergeFragments(fs, cs => cs.join(' | '));
    const lines = [
        mergeCells(headerFragments.map(padCells)),
        mergeCells(headerFragments.map((_, colIndex) => createFragment('-'.repeat(colWidths[colIndex])))),
        ...rowFragments.map(row => mergeCells(row.map(padCells))),
    ];
    return mergeFragments(
        lines.map(line => mapFragmentContent(line, c => `| ${c} |`)),
        cs => cs.join('\n'),
    );
}

/**
 * Renders lines as an HTML comment, which Markdown does not display, e.g. to add an
 * "auto-generated, do not edit" notice at the top of pages.
 */
export function getCommentFragment(lines: string[]): Fragment {
    return fragment`<!--\n${lines.join('\n')}\n-->`;
}

/**
 * Assembles the sections of a page, and lists the imports they collected as links in a final "See also" section.
 *
 * @param fragments - The sections of the page, separated by blank lines.
 * @param pathOverrides - Where the folders of imported nodes are, relative to the page. See {@link getImportMapLinks}.
 */
export function getPageFragment(fragments: Fragment[], pathOverrides: PathOverrides = {}): Fragment {
    const page = mergeFragments(fragments, cs => cs.join('\n\n'));
    const links = getImportMapLinks(page.imports, pathOverrides);
    if (links.length === 0) return page;
    return fragment`${page}\n\n## See also\n\n${links.join('\n')}`;
}
