import { camelCase } from '@codama/fragments/casing';
import { getTextNodeContent, InstructionAccountNode } from '@codama/nodes';

import { Fragment, getTableFragment } from '../utils';

/**
 * Renders a table of the accounts of an instruction, telling whether they sign, are writable or are required.
 * Returns `undefined` when the instruction has no accounts.
 */
export function getInstructionAccountsFragment(accounts: InstructionAccountNode[]): Fragment | undefined {
    if (accounts.length === 0) return;

    const hasDescriptions = accounts.some(account => account.docs && getTextNodeContent(account.docs));
    const accountHeaders = ['Name', 'Signer', 'Writable', 'Required', ...(hasDescriptions ? ['Description'] : [])];
    const accountRows = accounts.map(account => [
        `\`${camelCase(account.identifier)}\``,
        formatBoolean(account.isSigner ?? false),
        formatBoolean(account.isWritable ?? false),
        formatBoolean(!(account.isOptional ?? false)),
        ...(hasDescriptions ? [account.docs ? getTextNodeContent(account.docs) : ''] : []),
    ]);

    return getTableFragment(accountHeaders, accountRows);
}

function formatBoolean(value: boolean | 'either') {
    return value === 'either' ? value : value ? '✅' : '❌';
}
