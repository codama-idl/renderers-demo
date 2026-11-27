import { deleteDirectory, writeRenderMap } from '@codama/fragments';
import { rootNodeVisitor, visit } from '@codama/visitors-core';

import { RenderOptions } from '../utils';
import { getRenderMapVisitor } from './getRenderMapVisitor';

/**
 * Creates a visitor that renders the Markdown documentation of a Codama IDL and writes it to the given folder.
 * This is the default export of the package, which the Codama CLI uses as a script.
 *
 * @param path - The folder to write the documentation to.
 * @param options - The rendering options. See {@link RenderOptions}.
 *
 * @example
 * ```ts
 * codama.accept(renderVisitor('docs', { extension: 'mdx' }));
 * ```
 *
 * @see {@link getRenderMapVisitor} to get the rendered pages without writing them.
 */
export function renderVisitor(path: string, options: RenderOptions = {}) {
    return rootNodeVisitor(root => {
        // Delete existing generated folder.
        if (options.deleteFolderBeforeRendering ?? true) {
            deleteDirectory(path);
        }

        // Render the new files.
        const renderMap = visit(root, getRenderMapVisitor(options));
        writeRenderMap(renderMap, path);
    });
}
