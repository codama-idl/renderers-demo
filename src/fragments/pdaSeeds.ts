import { mapFragmentContent } from '@codama/fragments';
import { camelCase } from '@codama/fragments/casing';
import { getTextNodeContent, isNode, PdaSeedNode } from '@codama/nodes';
import { pipe, visit } from '@codama/visitors-core';

import { Fragment, getTableFragment } from '../utils';
import { TypeVisitor } from '../visitors/getTypeVisitor';
import { ValueVisitor } from '../visitors/getValueVisitor';

/**
 * Renders a table of the seeds of a PDA. Variable seeds show their name and description,
 * whereas constant seeds show their value. Returns `undefined` when the PDA has no seeds.
 */
export function getPdaSeedsFragment(
    seeds: PdaSeedNode[],
    typeVisitor: TypeVisitor,
    valueVisitor: ValueVisitor,
): Fragment | undefined {
    if (seeds.length === 0) return;

    const seedHeaders = ['Seed', 'Type', 'Value'];
    const seedRows = seeds.map(seed => {
        const type = pipe(
            visit(seed.type, typeVisitor),
            f => mapFragmentContent(f, c => c.replace(/\n\s*/g, ' ')),
            f => mapFragmentContent(f, c => `\`${c}\``),
        );

        if (isNode(seed, 'variablePdaSeedNode')) {
            return [`\`${camelCase(seed.identifier)}\``, type, seed.docs ? getTextNodeContent(seed.docs) : ''];
        }

        const value = pipe(visit(seed.value, valueVisitor), f => mapFragmentContent(f, c => `\`${c}\``));
        return ['_constant_', type, value];
    });

    return getTableFragment(seedHeaders, seedRows);
}
