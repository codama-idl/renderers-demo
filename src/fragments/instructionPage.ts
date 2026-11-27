import { titleCase } from '@codama/fragments/casing';
import { InstructionNode, isNode } from '@codama/nodes';
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
import { getInstructionAccountsFragment } from './instructionAccounts';

/** Renders the page of an instruction, with a table of its accounts and the type of its data. */
export function getInstructionPageFragment(node: InstructionNode, typeVisitor: TypeVisitor): Fragment {
    const title = titleCase(node.identifier);
    const type = visit(node, typeVisitor);
    const accountsFragment = getInstructionAccountsFragment(node.accounts ?? []);
    const hasArguments = node.data && !(isNode(node.data, 'structTypeNode') && (node.data.fields ?? []).length === 0);

    return getPageFragment(
        [
            getFrontmatterFragment(title, `Overview of the ${title} instruction`),
            getTitleAndDescriptionFragment(title, node.docs),
            fragment`## Instruction accounts`,
            accountsFragment ? accountsFragment : fragment`_This instruction has no accounts._`,
            fragment`## Instruction arguments`,
            hasArguments ? getCodeBlockFragment(type, 'ts') : fragment`_This instruction has no arguments._`,
        ],
        // Generated instructions are within the same directory.
        { generatedInstructions: '.' },
    );
}
