import { titleCase } from '@codama/fragments/casing';
import { PdaNode } from '@codama/nodes';

import { Fragment, fragment, getFrontmatterFragment, getPageFragment, getTitleAndDescriptionFragment } from '../utils';
import { TypeVisitor } from '../visitors/getTypeVisitor';
import { ValueVisitor } from '../visitors/getValueVisitor';
import { getPdaSeedsFragment } from './pdaSeeds';

/** Renders the page of a PDA, with a table of its seeds. */
export function getPdaPageFragment(node: PdaNode, typeVisitor: TypeVisitor, valueVisitor: ValueVisitor): Fragment {
    const title = `${titleCase(node.identifier)} PDA`;
    const seeds = getPdaSeedsFragment(node.seeds ?? [], typeVisitor, valueVisitor);

    return getPageFragment(
        [
            getFrontmatterFragment(title, `Overview of the ${title}`),
            getTitleAndDescriptionFragment(title, node.docs),
            fragment`## Seeds`,
            seeds ? seeds : fragment`_This PDA has no seeds._`,
        ],
        // Generated PDAs are within the same directory.
        { generatedPdas: '.' },
    );
}
