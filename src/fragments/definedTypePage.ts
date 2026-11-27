import { titleCase } from '@codama/fragments/casing';
import { DefinedTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';

import {
    Fragment,
    fragment,
    getCodeBlockFragment,
    getFrontmatterFragment,
    getPageFragment,
    getTitleAndDescriptionFragment,
} from '../utils';
import { TypeVisitor } from '../visitors/getTypeVisitor';

/** Renders the page of a defined type, with its type definition. */
export function getDefinedTypePageFragment(node: DefinedTypeNode, typeVisitor: TypeVisitor): Fragment {
    const title = titleCase(node.identifier);
    const type = visit(node, typeVisitor);

    return getPageFragment(
        [
            getFrontmatterFragment(title, `Overview of the ${title} type`),
            getTitleAndDescriptionFragment(title, node.docs),
            fragment`## Type definition`,
            getCodeBlockFragment(type, 'ts'),
        ],
        // Generated types are within the same directory.
        { generatedTypes: '.' },
    );
}
