import {
    accountNode,
    definedTypeNode,
    enumTypeNode,
    errorNode,
    instructionNode,
    pdaNode,
    programNode,
    textNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getProgramPageFragment } from '../../src/fragments';
import { fragment } from '../../src/utils';

test('it renders program pages', () => {
    const node = programNode({
        accounts: [accountNode({ identifier: 'mint' }), accountNode({ identifier: 'token' })],
        definedTypes: [
            definedTypeNode({ identifier: 'accountState', type: enumTypeNode([]) }),
            definedTypeNode({ identifier: 'authorityType', type: enumTypeNode([]) }),
        ],
        docs: 'This is some description for the token program.\nIt can use multiple lines.',
        errors: [
            errorNode({ code: 0, identifier: 'notRentExempt', message: 'Lamport balance below rent-exempt threshold' }),
            errorNode({ code: 1, identifier: 'insufficientFunds', message: 'Insufficient funds' }),
            errorNode({ code: 2, identifier: 'invalidMint', message: 'Invalid Mint account' }),
            errorNode({ code: 3, identifier: 'mintMismatch', message: 'Account not associated with this Mint' }),
            errorNode({ code: 4, identifier: 'ownerMismatch', message: 'Owner does not match' }),
        ],
        identifier: 'token',
        instructions: [
            instructionNode({ identifier: 'initializeMint' }),
            instructionNode({ identifier: 'initializeAccount' }),
            instructionNode({ identifier: 'mintTo' }),
            instructionNode({ identifier: 'transfer' }),
            instructionNode({ identifier: 'revoke' }),
            instructionNode({ identifier: 'burn' }),
        ],
        pdas: [pdaNode({ identifier: 'associatedToken', seeds: [] })],
        publicKey: 'TokenKegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        version: '1.2.3',
    });

    const result = getProgramPageFragment(node);

    expect(result).toStrictEqual(fragment`---
title: Token Program
description: Overview of the Token Program
---

# Token Program

This is some description for the token program.
It can use multiple lines.

## Information

- Address: \`TokenKegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`
- Version: \`1.2.3\`

## Accounts

- [Mint](accounts/mint.md)
- [Token](accounts/token.md)

## Instructions

- [Initialize Mint](instructions/initializeMint.md)
- [Initialize Account](instructions/initializeAccount.md)
- [Mint To](instructions/mintTo.md)
- [Transfer](instructions/transfer.md)
- [Revoke](instructions/revoke.md)
- [Burn](instructions/burn.md)

## PDAs

- [Associated Token](pdas/associatedToken.md)

## Defined types

- [Account State](definedTypes/accountState.md)
- [Authority Type](definedTypes/authorityType.md)

## Errors

| Name               | Code | Message                                     |
| ------------------ | ---- | ------------------------------------------- |
| Not Rent Exempt    | \`0\`  | Lamport balance below rent-exempt threshold |
| Insufficient Funds | \`1\`  | Insufficient funds                          |
| Invalid Mint       | \`2\`  | Invalid Mint account                        |
| Mint Mismatch      | \`3\`  | Account not associated with this Mint       |
| Owner Mismatch     | \`4\`  | Owner does not match                        |`);
});

test('it renders pages for empty program', () => {
    const node = programNode({ identifier: 'token', publicKey: 'TokenKegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' });

    const result = getProgramPageFragment(node);

    expect(result).toStrictEqual(fragment`---
title: Token Program
description: Overview of the Token Program
---

# Token Program

## Information

- Address: \`TokenKegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`
- Version: \`0.0.0\`

## Accounts

_This program has no accounts._

## Instructions

_This program has no instructions._

## PDAs

_This program has no PDAs._

## Defined types

_This program has no defined types._

## Errors

_This program has no errors._`);
});

test('it renders names and messages of any casing and form', () => {
    const node = programNode({
        accounts: [accountNode({ identifier: 'token_account' })],
        errors: [
            errorNode({ code: 0, identifier: 'not_rent_exempt', message: textNode({ content: 'Not rent exempt' }) }),
        ],
        identifier: 'token_metadata',
        publicKey: 'TokenKegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    const result = getProgramPageFragment(node);

    expect(result.content).toContain('# Token Metadata Program');
    expect(result.content).toContain('- [Token Account](accounts/tokenAccount.md)');
    expect(result.content).toContain('| Not Rent Exempt | `0`  | Not rent exempt |');
});
