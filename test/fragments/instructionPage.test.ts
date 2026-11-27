import {
    definedTypeLinkNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
    textNode,
} from '@codama/nodes';
import { pipe } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getInstructionPageFragment } from '../../src/fragments';
import { addFragmentImports, fragment } from '../../src/utils';
import { getTypeVisitor } from '../../src/visitors';

test('it renders instruction pages', () => {
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                docs: 'Pays for the storage fees.',
                identifier: 'payer',
                isSigner: true,
                isWritable: true,
            }),
            instructionAccountNode({
                docs: 'The account being created.',
                identifier: 'newAccount',
                isSigner: false,
                isWritable: true,
            }),
            instructionAccountNode({
                docs: 'A dummy account.',
                identifier: 'optionalAccount',
                isOptional: true,
                isSigner: 'either',
                isWritable: true,
            }),
        ],
        data: structTypeNode([structFieldTypeNode({ identifier: 'lamports', type: integerTypeNode('u64') })]),
        docs: 'This is some description for the Create Account instruction.\nIt can use multiple lines.',
        identifier: 'createAccount',
    });

    const result = getInstructionPageFragment(node, getTypeVisitor());

    expect(result).toStrictEqual(fragment`---
title: Create Account
description: Overview of the Create Account instruction
---

# Create Account

This is some description for the Create Account instruction.
It can use multiple lines.

## Instruction accounts

| Name              | Signer | Writable | Required | Description                |
| ----------------- | ------ | -------- | -------- | -------------------------- |
| \`payer\`           | ✅      | ✅        | ✅        | Pays for the storage fees. |
| \`newAccount\`      | ❌      | ✅        | ✅        | The account being created. |
| \`optionalAccount\` | either | ✅        | ❌        | A dummy account.           |

## Instruction arguments

\`\`\`ts
type CreateAccountInstruction = { lamports: number /* u64 */ }
\`\`\``);
});

test('it renders a page with no accounts nor arguments', () => {
    const node = instructionNode({ identifier: 'createAccount' });

    const result = getInstructionPageFragment(node, getTypeVisitor());

    expect(result).toStrictEqual(fragment`---
title: Create Account
description: Overview of the Create Account instruction
---

# Create Account

## Instruction accounts

_This instruction has no accounts._

## Instruction arguments

_This instruction has no arguments._`);
});

test('it renders see also sections', () => {
    const node = instructionNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'lamports', type: definedTypeLinkNode('someType') })]),
        identifier: 'createAccount',
    });

    const result = getInstructionPageFragment(node, getTypeVisitor());

    expect(result).toStrictEqual(
        pipe(
            fragment`---
title: Create Account
description: Overview of the Create Account instruction
---

# Create Account

## Instruction accounts

_This instruction has no accounts._

## Instruction arguments

\`\`\`ts
type CreateAccountInstruction = { lamports: SomeType }
\`\`\`

## See also

- [SomeType](../types/someType.md)`,
            f => addFragmentImports(f, 'generatedTypes', 'SomeType'),
        ),
    );
});

test('it renders instruction data that links to a defined type', () => {
    const node = instructionNode({ data: definedTypeLinkNode('createAccountArgs'), identifier: 'createAccount' });

    const result = getInstructionPageFragment(node, getTypeVisitor());

    expect(result).toStrictEqual(
        pipe(
            fragment`---
title: Create Account
description: Overview of the Create Account instruction
---

# Create Account

## Instruction accounts

_This instruction has no accounts._

## Instruction arguments

\`\`\`ts
type CreateAccountInstruction = CreateAccountArgs
\`\`\`

## See also

- [CreateAccountArgs](../types/createAccountArgs.md)`,
            f => addFragmentImports(f, 'generatedTypes', 'CreateAccountArgs'),
        ),
    );
});

test('it renders instruction data without fields as no arguments', () => {
    const node = instructionNode({ data: structTypeNode([]), identifier: 'ping' });

    const result = getInstructionPageFragment(node, getTypeVisitor());

    expect(result.content).toContain('_This instruction has no arguments._');
});

test('it renders names and docs of any casing and form', () => {
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                docs: textNode({ content: 'The account being created.' }),
                identifier: 'new_account',
                isSigner: true,
                isWritable: true,
            }),
        ],
        docs: textNode({ content: 'Creates an account.' }),
        identifier: 'create_account',
    });

    const result = getInstructionPageFragment(node, getTypeVisitor());

    expect(result).toStrictEqual(fragment`---
title: Create Account
description: Overview of the Create Account instruction
---

# Create Account

Creates an account.

## Instruction accounts

| Name         | Signer | Writable | Required | Description                |
| ------------ | ------ | -------- | -------- | -------------------------- |
| \`newAccount\` | ✅      | ✅        | ✅        | The account being created. |

## Instruction arguments

_This instruction has no arguments._`);
});
