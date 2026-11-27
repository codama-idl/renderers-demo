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

export type TypeVisitor = ReturnType<typeof getTypeVisitor>;

// Here, we ignore the `transforms` of type nodes (e.g. size prefixes, fixed sizes, offsets or sentinels)
// as well as the `count` of arrays, sets and maps. They affect how the data is encoded, not its shape.
export function getTypeVisitor(input: { stack?: NodeStack; typeIndent?: string } = {}) {
    const typeIndent = input.typeIndent ?? '    ';
    const stack = input.stack ?? new NodeStack();

    // Keeps track of the indentation level.
    let indentLevel = 0;
    const indent = () => typeIndent.repeat(indentLevel);
    const shouldInline = (fragment: Fragment) => {
        if (fragment.content.includes('\n')) return false;
        return indent().length + fragment.content.length <= 100;
    };

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
                        if (shouldInline(inlinedEnum)) return inlinedEnum;

                        indentLevel++;
                        const variants = mergeFragments(variantNames, cs => cs.map(c => `${indent()}${c},\n`).join(''));
                        indentLevel--;
                        return fragment`{\n${variants}${indent()}}`;
                    }

                    // Data enums are unions of their variants, e.g. `{ __kind: "Red" } | { __kind: "Rgb"; … }`.
                    const inlinedEnum = pipe(
                        (node.variants ?? []).map(v => visit(v, self)),
                        fs => mergeFragments(fs, cs => cs.join(' | ')),
                    );
                    if (shouldInline(inlinedEnum)) return inlinedEnum;

                    indentLevel++;
                    const variants = pipe(
                        (node.variants ?? []).map(v => visit(v, self)),
                        fs => mergeFragments(fs, cs => cs.map(c => `| ${c}`).join(`\n${indent()}`)),
                    );
                    indentLevel--;
                    return variants;
                },

                visitEnumVariantType(node, { self }) {
                    const kindField = fragment`__kind: "${pascalCase(node.identifier)}"`;
                    const getFields = () => [kindField, ...getEnumVariantDataFields(node.data, self)];

                    const inlinedVariant = mergeFragments(getFields(), cs => `{ ${cs.join('; ')} }`);
                    if (shouldInline(inlinedVariant)) return inlinedVariant;

                    indentLevel++;
                    const fields = mergeFragments(getFields(), cs => cs.map(c => `${indent()}${c};\n`).join(''));
                    indentLevel--;
                    return fragment`{\n${fields}${indent()}}`;
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
                    if ((node.fields ?? []).length === 0) return fragment`{}`;

                    const inlinedStruct = pipe(
                        (node.fields ?? []).map(field => visit(field, self)),
                        fs => mergeFragments(fs, cs => `{ ${cs.join('; ')} }`),
                    );
                    if (shouldInline(inlinedStruct)) return inlinedStruct;

                    indentLevel++;
                    const fields = pipe(
                        (node.fields ?? []).map(field => visit(field, self)),
                        fs => mergeFragments(fs, cs => cs.map(c => `${indent()}${c};\n`).join('')),
                    );
                    indentLevel--;
                    return fragment`{\n${fields}${indent()}}`;
                },

                visitTupleType(node, { self }) {
                    const inlinedTuple = pipe(
                        (node.items ?? []).map(item => visit(item, self)),
                        fs => mergeFragments(fs, cs => `[${cs.join(', ')}]`),
                    );
                    if (shouldInline(inlinedTuple)) return inlinedTuple;

                    indentLevel++;
                    const items = pipe(
                        (node.items ?? []).map(item => visit(item, self)),
                        fs => mergeFragments(fs, cs => cs.map(c => `${indent()}${c},\n`).join('')),
                    );
                    indentLevel--;
                    return fragment`[\n${items}${indent()}]`;
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
