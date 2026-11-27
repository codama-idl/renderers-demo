import { titleCase } from '@codama/fragments/casing';
import { AccountNode, PdaNode } from '@codama/nodes';
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
import { getPdaFunctionUsageFragment } from './pdaFunctionUsage';

/**
 * Renders the page of an account, with the type of its data.
 *
 * @param size - The fixed size of the account in bytes, if any.
 * @param pda - The PDA the account is derived from, if any.
 */
export function getAccountPageFragment(
    node: AccountNode,
    typeVisitor: TypeVisitor,
    size?: number,
    pda?: PdaNode,
): Fragment {
    const title = titleCase(node.identifier);
    const type = visit(node, typeVisitor);

    return getPageFragment(
        [
            getFrontmatterFragment(title, `Overview of the ${title} account`),
            getTitleAndDescriptionFragment(title, node.docs),
            fragment`## Account data`,
            getCodeBlockFragment(type, 'ts'),
            ...(size ? [fragment`This account has a fixed size of ${size} bytes.`] : []),
            ...(pda ? [fragment`## PDA`, getCodeBlockFragment(getPdaFunctionUsageFragment(pda), 'ts')] : []),
        ],
        // Generated accounts are within the same directory.
        { generatedAccounts: '.' },
    );
}
