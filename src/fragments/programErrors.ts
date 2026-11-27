import { titleCase } from '@codama/fragments/casing';
import { ErrorNode, getTextNodeContent } from '@codama/nodes';

import { Fragment, getTableFragment } from '../utils';

export function getProgramErrorsFragment(errors: ErrorNode[]): Fragment | undefined {
    if (errors.length === 0) return;

    const errorHeaders = ['Name', 'Code', 'Message'];
    const errorRows = errors.map(error => [
        titleCase(error.identifier),
        `\`${error.code}\``,
        getTextNodeContent(error.message),
    ]);

    return getTableFragment(errorHeaders, errorRows);
}
