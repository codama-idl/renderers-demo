import { CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, CodamaError } from '@codama/errors';
import { camelCase, pascalCase } from '@codama/fragments/casing';
import { REGISTERED_VALUE_NODE_KINDS } from '@codama/nodes';
import { extendVisitor, NodeStack, pipe, recordNodeStackVisitor, staticVisitor, visit } from '@codama/visitors-core';

import { addFragmentImports, Fragment, fragment, getStringValueAsHexadecimals, mergeFragments } from '../utils';

export type ValueVisitor = ReturnType<typeof getValueVisitor>;

export function getValueVisitor(input: { stack?: NodeStack } = {}) {
    const stack = input.stack ?? new NodeStack();

    return pipe(
        // Any node this visitor does not override below, e.g. an `injectedValueNode`, cannot be rendered.
        staticVisitor(
            (): Fragment => {
                throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { path: stack.getPath() });
            },
            { keys: [...REGISTERED_VALUE_NODE_KINDS, 'programIdValueNode'] },
        ),
        visitor =>
            extendVisitor(visitor, {
                visitArrayValue(node, { self }) {
                    return mergeFragments(
                        (node.items ?? []).map(item => visit(item, self)),
                        cs => `[${cs.join(', ')}]`,
                    );
                },

                visitBooleanValue(node) {
                    return fragment`${node.boolean ? 'true' : 'false'}`;
                },

                visitBytesValue(node) {
                    return fragment`${getStringValueAsHexadecimals(node.encoding, node.data)}`;
                },

                visitConstantValue(node, { self }) {
                    return visit(node.value, self);
                },

                visitEnumValue(node, { self }) {
                    const enumName = pascalCase(node.enum.identifier);
                    const enumType = addFragmentImports(fragment`${enumName}`, 'generatedTypes', enumName);
                    const variant = fragment`${enumType}.${pascalCase(node.variant)}`;
                    return node.value ? fragment`${variant}(${visit(node.value, self)})` : variant;
                },

                visitFloatValue(node) {
                    return fragment`${node.value}`;
                },

                visitIntegerValue(node) {
                    return fragment`${node.value}`;
                },

                visitMapEntryValue(node, { self }) {
                    const key = visit(node.key, self);
                    const value = visit(node.value, self);
                    return fragment`[${key}, ${value}]`;
                },

                visitMapValue(node, { self }) {
                    return mergeFragments(
                        (node.entries ?? []).map(entry => visit(entry, self)),
                        cs => `new Map([${cs.join(', ')}])`,
                    );
                },

                visitNoneValue() {
                    return fragment`null`;
                },

                visitProgramIdValue() {
                    return fragment`programId`;
                },

                visitPublicKeyValue(node) {
                    return fragment`"${node.publicKey}"`;
                },

                visitSetValue(node, { self }) {
                    return mergeFragments(
                        (node.items ?? []).map(item => visit(item, self)),
                        cs => `new Set([${cs.join(', ')}])`,
                    );
                },

                visitSomeValue(node, { self }) {
                    return visit(node.value, self);
                },

                visitStringValue(node) {
                    return fragment`"${node.string}"`;
                },

                visitStructFieldValue(node, { self }) {
                    return fragment`${camelCase(node.identifier)}: ${visit(node.value, self)}`;
                },

                visitStructValue(node, { self }) {
                    return mergeFragments(
                        (node.fields ?? []).map(field => visit(field, self)),
                        cs => (cs.length > 0 ? `{ ${cs.join(', ')} }` : '{}'),
                    );
                },

                visitTupleValue(node, { self }) {
                    return mergeFragments(
                        (node.items ?? []).map(item => visit(item, self)),
                        cs => `[${cs.join(', ')}]`,
                    );
                },
            }),
        visitor => recordNodeStackVisitor(visitor, stack),
    );
}
