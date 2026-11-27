import { camelCase, pascalCase } from '@codama/fragments/casing';
import { isNode, PdaNode } from '@codama/nodes';

import { addFragmentImports, Fragment, fragment } from '../utils';

/**
 * Renders an example call of the function deriving a PDA, e.g.
 * `const [address, bump] = await findAssociatedTokenPda({ mint, owner });`.
 */
export function getPdaFunctionUsageFragment(node: PdaNode): Fragment {
    const functionName = `find${pascalCase(node.identifier)}Pda`;
    const variableSeedNames = (node.seeds ?? [])
        .filter(s => isNode(s, 'variablePdaSeedNode'))
        .map(s => camelCase(s.identifier));
    const seedObject =
        variableSeedNames.length > 2
            ? `{\n${variableSeedNames.join(',\n')},\n}`
            : `{ ${variableSeedNames.join(', ')} }`;
    return addFragmentImports(
        fragment`const [address, bump] = await ${functionName}(${seedObject});`,
        'generatedPdas',
        pascalCase(node.identifier),
    );
}
