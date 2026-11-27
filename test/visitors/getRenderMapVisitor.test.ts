import { CODAMA_ERROR__VERSION_MISMATCH, CodamaError } from '@codama/errors';
import {
    accountNode,
    CODAMA_VERSION,
    definedTypeNode,
    instructionNode,
    pdaNode,
    programNode,
    rootNode,
    stringTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getRenderMapVisitor } from '../../src';

test('it renders a page for the program and each of its accounts, defined types, instructions and PDAs', () => {
    // Given a root node of the current Codama version whose identifiers use various casings.
    const node = rootNode(
        programNode({
            accounts: [accountNode({ identifier: 'token_account' })],
            definedTypes: [definedTypeNode({ identifier: 'TokenState', type: stringTypeNode('utf8') })],
            identifier: 'token',
            instructions: [instructionNode({ identifier: 'transfer_tokens' })],
            pdas: [pdaNode({ identifier: 'associatedToken', seeds: [] })],
            publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        }),
    );

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect one page per node, named after the camelCase form of its identifier.
    expect([...renderMap.keys()].sort()).toStrictEqual([
        'README.md',
        'accounts/tokenAccount.md',
        'definedTypes/tokenState.md',
        'instructions/transferTokens.md',
        'pdas/associatedToken.md',
    ]);
});

test('it rejects root nodes of another major version', () => {
    // Given a root node of the Codama v1 standard.
    const node = {
        ...rootNode(programNode({ identifier: 'token', publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' })),
        version: '1.3.0' as const,
    };

    // Then rendering it fails with a version mismatch.
    expect(() => visit(node as never, getRenderMapVisitor())).toThrow(
        new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion: CODAMA_VERSION, rootVersion: '1.3.0' }),
    );
});
