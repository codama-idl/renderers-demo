import { CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, CodamaError } from '@codama/errors';
import { camelCase, pascalCase } from '@codama/fragments/casing';
import {
    definedTypeNode,
    isNode,
    isScalarEnum,
    REGISTERED_TYPE_NODE_KINDS,
    structTypeNode,
    TypeNode,
} from '@codama/nodes';
import {
    extendVisitor,
    NodeStack,
    pipe,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
    Visitor,
} from '@codama/visitors-core';

import { addFragmentImports, Fragment, fragment, mergeFragments } from '../utils';

/** A visitor that renders type nodes as TypeScript-like type definitions, e.g. `{ owner: Address; amount: Option<bytes> }`. */
export type TypeVisitor = ReturnType<typeof getTypeVisitor>;

/**
 * The maximum length of a type rendered on a single line, before its indentation and any field name.
 * Longer types are rendered on multiple lines.
 */
const MAX_LINE_LENGTH = 100;

/**
 * Creates a visitor that renders type nodes, as well as accounts, defined types and instructions,
 * as TypeScript-like type definitions to display in code blocks.
 *
 * Composite types, such as structs, tuples and enums, render on a single line when they fit,
 * and on multiple lines otherwise, indenting their children by `typeIndent`.
 *
 * Here, we ignore the `transforms` of type nodes (e.g. size prefixes, fixed sizes, offsets or sentinels)
 * as well as the `count` of arrays, sets and maps. They affect how the data is encoded, not its shape.
 *
 * @param input.stack - The node stack to share with other visitors, so that errors report the full path of nodes.
 * @param input.typeIndent - The indentation of nested lines. Defaults to four spaces.
 *
 * @example
 * ```ts
 * const type = visit(definedTypeNode({ identifier: 'owner', type: publicKeyTypeNode() }), getTypeVisitor());
 * type.content; // "type Owner = Address"
 * ```
 */
export function getTypeVisitor(input: { stack?: NodeStack; typeIndent?: string } = {}) {
    const typeIndent = input.typeIndent ?? '    ';
    const stack = input.stack ?? new NodeStack();

    // Helpers to lay out composite types on one line or, when they are too long, on multiple lines.
    const fitsOnOneLine = (fragment: Fragment) =>
        !fragment.content.includes('\n') && fragment.content.length <= MAX_LINE_LENGTH;
    const indentLines = (content: string) => `${typeIndent}${content.replace(/\n/g, `\n${typeIndent}`)}`;
    const renderOnMultipleLines = (children: Fragment[], open: string, separator: string, close: string) =>
        mergeFragments(children, cs => `${open}\n${cs.map(c => indentLines(`${c}${separator}`)).join('\n')}\n${close}`);

    return pipe(
        // Every type node is rendered below, so this only throws for node kinds added by later versions of Codama.
        staticVisitor(
            (): Fragment => {
                throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { path: stack.getPath() });
            },
            {
                keys: [
                    ...REGISTERED_TYPE_NODE_KINDS,
                    'definedTypeLinkNode',
                    'definedTypeNode',
                    'accountNode',
                    'instructionNode',
                ],
            },
        ),
        visitor =>
            extendVisitor(visitor, {
                visitAccount(node, { self }) {
                    return visit(definedTypeNode({ identifier: node.identifier, type: node.data }), self);
                },

                visitArrayType(node, { self }) {
                    return fragment`Array<${visit(node.item, self)}>`;
                },

                visitBooleanType() {
                    return fragment`boolean`;
                },

                visitBytesType() {
                    return fragment`bytes`;
                },

                visitDateTimeType(node, { self }) {
                    // Here, we ignore DateTime information for simplicity.
                    return visit(node.number, self);
                },

                visitDefinedType(node, { self }) {
                    const type = visit(node.type, self);
                    return isNode(node.type, 'enumTypeNode') && isScalarEnum(node.type)
                        ? fragment`enum ${pascalCase(node.identifier)} ${type}`
                        : fragment`type ${pascalCase(node.identifier)} = ${type}`;
                },

                visitDefinedTypeLink(node) {
                    const typeName = pascalCase(node.identifier);
                    return addFragmentImports(fragment`${typeName}`, 'generatedTypes', typeName);
                },

                visitDurationType(node, { self }) {
                    // Here, we ignore duration information for simplicity.
                    return visit(node.number, self);
                },

                visitEnumType(node, { self }) {
                    // Scalar enums only list the names of their variants, e.g. `{ Red, Green, Blue }`.
                    if (isScalarEnum(node)) {
                        const variantNames = (node.variants ?? []).map(v => fragment`${pascalCase(v.identifier)}`);
                        const inlinedEnum = mergeFragments(variantNames, cs => `{ ${cs.join(', ')} }`);
                        if (fitsOnOneLine(inlinedEnum)) return inlinedEnum;
                        return renderOnMultipleLines(variantNames, '{', ',', '}');
                    }

                    // Data enums are unions of their variants, e.g. `{ __kind: "Red" } | { __kind: "Rgb"; … }`.
                    const variants = (node.variants ?? []).map(v => visit(v, self));
                    const inlinedEnum = mergeFragments(variants, cs => cs.join(' | '));
                    if (fitsOnOneLine(inlinedEnum)) return inlinedEnum;

                    // On multiple lines, each variant starts with a `|` and lines after the first are indented.
                    return mergeFragments(variants, cs =>
                        cs
                            .map(c => `| ${c}`)
                            .join('\n')
                            .replace(/\n/g, `\n${typeIndent}`),
                    );
                },

                visitEnumVariantType(node, { self }) {
                    const kindField = fragment`__kind: "${pascalCase(node.identifier)}"`;
                    const fields = [kindField, ...getEnumVariantDataFields(node.data, self)];
                    const inlinedVariant = mergeFragments(fields, cs => `{ ${cs.join('; ')} }`);
                    if (fitsOnOneLine(inlinedVariant)) return inlinedVariant;
                    return renderOnMultipleLines(fields, '{', ';', '}');
                },

                visitFixedPointType(node, { self }) {
                    // Here, we ignore the scale and unit of fixed-point numbers for simplicity.
                    return visit(node.number, self);
                },

                visitFloatType(node) {
                    return fragment`number /* ${node.format} */`;
                },

                visitInstruction(node, { self }) {
                    const definedTypeData = definedTypeNode({
                        identifier: `${camelCase(node.identifier)}Instruction`,
                        type: node.data ?? structTypeNode([]),
                    });
                    return visit(definedTypeData, self);
                },

                visitIntegerType(node) {
                    return fragment`number /* ${node.format} */`;
                },

                visitMapType(node, { self }) {
                    const key = visit(node.key, self);
                    const value = visit(node.value, self);
                    return fragment`Map<${key}, ${value}>`;
                },

                visitOptionType(node, { self }) {
                    return fragment`Option<${visit(node.item, self)}>`;
                },

                visitPublicKeyType() {
                    return fragment`Address`;
                },

                visitRemainderOptionType(node, { self }) {
                    return fragment`Option<${visit(node.item, self)}>`;
                },

                visitSetType(node, { self }) {
                    return fragment`Set<${visit(node.item, self)}>`;
                },

                visitStringType() {
                    return fragment`string`;
                },

                visitStructFieldType(node, { self }) {
                    return fragment`${camelCase(node.identifier)}: ${visit(node.type, self)}`;
                },

                visitStructType(node, { self }) {
                    const fields = (node.fields ?? []).map(field => visit(field, self));
                    if (fields.length === 0) return fragment`{}`;
                    const inlinedStruct = mergeFragments(fields, cs => `{ ${cs.join('; ')} }`);
                    if (fitsOnOneLine(inlinedStruct)) return inlinedStruct;
                    return renderOnMultipleLines(fields, '{', ';', '}');
                },

                visitTupleType(node, { self }) {
                    const items = (node.items ?? []).map(item => visit(item, self));
                    const inlinedTuple = mergeFragments(items, cs => `[${cs.join(', ')}]`);
                    if (fitsOnOneLine(inlinedTuple)) return inlinedTuple;
                    return renderOnMultipleLines(items, '[', ',', ']');
                },

                visitZeroableOptionType(node, { self }) {
                    return fragment`Option<${visit(node.item, self)}>`;
                },
            }),
        visitor => recordNodeStackVisitor(visitor, stack),
    );
}

/**
 * Renders the data of an enum variant as fields to list after its `__kind` field.
 * Struct data lists its own fields, whereas any other data is rendered under a single `fields` field.
 */
function getEnumVariantDataFields(
    data: TypeNode | undefined,
    self: Visitor<Fragment, TypeNode['kind'] | 'structFieldTypeNode'>,
): Fragment[] {
    if (!data) return [];
    if (isNode(data, 'structTypeNode')) return (data.fields ?? []).map(field => visit(field, self));
    return [fragment`fields: ${visit(data, self)}`];
}
