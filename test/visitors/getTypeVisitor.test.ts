import {
    AccountNode,
    accountNode,
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    constantValueNodeFromString,
    dateTimeTypeNode,
    definedTypeLinkNode,
    DefinedTypeNode,
    definedTypeNode,
    durationTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedCountNode,
    fixedPointTypeNode,
    fixedSizeTransformNode,
    floatTypeNode,
    hiddenPrefixTransformNode,
    hiddenSuffixTransformNode,
    InstructionNode,
    instructionNode,
    integerTypeNode,
    mapTypeNode,
    optionTypeNode,
    postOffsetTransformNode,
    prefixedCountNode,
    preOffsetTransformNode,
    publicKeyTypeNode,
    remainderCountNode,
    remainderOptionTypeNode,
    sentinelCountNode,
    sentinelTransformNode,
    setTypeNode,
    sizePrefixTransformNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
    TypeNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { addFragmentImports, Fragment, fragment } from '../../src/utils';
import { getTypeVisitor } from '../../src/visitors';

function expectType(
    node: AccountNode | DefinedTypeNode | InstructionNode | TypeNode,
    expected: Fragment | string,
): void {
    expect(visit(node, getTypeVisitor())).toStrictEqual(
        typeof expected === 'string' ? fragment`${expected}` : expected,
    );
}

test('it renders accounts', () => {
    expectType(
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
                structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') }),
            ]),
            identifier: 'mint',
        }),
        'type Mint = { amount: number /* u64 */; decimals: number /* u8 */ }',
    );
});

test('it renders names from identifiers of any casing', () => {
    expectType(
        accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'total_supply', type: integerTypeNode('u64') })]),
            identifier: 'token_mint',
        }),
        'type TokenMint = { totalSupply: number /* u64 */ }',
    );
});

test('it renders array types', () => {
    expectType(arrayTypeNode(stringTypeNode('utf8'), remainderCountNode()), 'Array<string>');
});

test('it ignores the count of array, set and map types', () => {
    expectType(arrayTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), 'Array<string>');
    expectType(arrayTypeNode(stringTypeNode('utf8'), prefixedCountNode(integerTypeNode('u32'))), 'Array<string>');
    expectType(
        arrayTypeNode(integerTypeNode('u8'), sentinelCountNode(constantValueNodeFromString('base16', 'ff'))),
        'Array<number /* u8 */>',
    );
});

test('it renders boolean types', () => {
    expectType(booleanTypeNode(), 'boolean');
});

test('it renders bytes types', () => {
    expectType(bytesTypeNode(), 'bytes');
});

test('it ignores date time types', () => {
    expectType(dateTimeTypeNode(integerTypeNode('i64')), 'number /* i64 */');
});

test('it renders defined types', () => {
    expectType(definedTypeNode({ identifier: 'nameAlias', type: stringTypeNode('utf8') }), 'type NameAlias = string');
    expectType(
        definedTypeNode({
            identifier: 'person',
            type: structTypeNode([
                structFieldTypeNode({ identifier: 'name', type: definedTypeLinkNode('nameAlias') }),
                structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u32') }),
            ]),
        }),
        addFragmentImports(
            fragment`type Person = { name: NameAlias; age: number /* u32 */ }`,
            'generatedTypes',
            'NameAlias',
        ),
    );
    expectType(
        definedTypeNode({
            identifier: 'direction',
            type: enumTypeNode([
                enumVariantTypeNode('up'),
                enumVariantTypeNode('right'),
                enumVariantTypeNode('down'),
                enumVariantTypeNode('left'),
            ]),
        }),
        'enum Direction { Up, Right, Down, Left }',
    );
    expectType(
        definedTypeNode({
            identifier: 'command',
            type: enumTypeNode([
                enumVariantTypeNode('write', { data: tupleTypeNode([stringTypeNode('utf8')]) }),
                enumVariantTypeNode('yell', { data: tupleTypeNode([stringTypeNode('utf8')]) }),
            ]),
        }),
        'type Command = { __kind: "Write"; fields: [string] } | { __kind: "Yell"; fields: [string] }',
    );
});

test('it renders defined type links', () => {
    expectType(
        definedTypeLinkNode('semverVersion'),
        addFragmentImports(fragment`SemverVersion`, 'generatedTypes', 'SemverVersion'),
    );
});

test('it ignores duration types', () => {
    expectType(durationTypeNode(integerTypeNode('i64')), 'number /* i64 */');
});

test('it renders enum types', () => {
    expectType(
        enumTypeNode([
            enumVariantTypeNode('up'),
            enumVariantTypeNode('right'),
            enumVariantTypeNode('down'),
            enumVariantTypeNode('left'),
        ]),
        '{ Up, Right, Down, Left }',
    );
    expectType(
        enumTypeNode([
            enumVariantTypeNode('firstVariantInTheEnumWithALongName'),
            enumVariantTypeNode('secondVariantInTheEnumWithALongName'),
            enumVariantTypeNode('thirdVariantInTheEnumWithALongName'),
        ]),
        `{
    FirstVariantInTheEnumWithALongName,
    SecondVariantInTheEnumWithALongName,
    ThirdVariantInTheEnumWithALongName,
}`,
    );
    expectType(
        enumTypeNode([
            enumVariantTypeNode('write', { data: tupleTypeNode([stringTypeNode('utf8')]) }),
            enumVariantTypeNode('yell', { data: tupleTypeNode([stringTypeNode('utf8')]) }),
        ]),
        `{ __kind: "Write"; fields: [string] } | { __kind: "Yell"; fields: [string] }`,
    );
    expectType(
        enumTypeNode([
            enumVariantTypeNode('write', { data: tupleTypeNode([stringTypeNode('utf8')]) }),
            enumVariantTypeNode('move', {
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u64') }),
                    structFieldTypeNode({ identifier: 'y', type: integerTypeNode('u64') }),
                ]),
            }),
            enumVariantTypeNode('quit'),
        ]),
        `| { __kind: "Write"; fields: [string] }
    | { __kind: "Move"; x: number /* u64 */; y: number /* u64 */ }
    | { __kind: "Quit" }`,
    );
});

test('it renders enum variants whose data is neither a struct nor a tuple under a fields field', () => {
    expectType(
        enumTypeNode([
            enumVariantTypeNode('amount', { data: integerTypeNode('u64') }),
            enumVariantTypeNode('person', { data: definedTypeLinkNode('person') }),
        ]),
        addFragmentImports(
            fragment`{ __kind: "Amount"; fields: number /* u64 */ } | { __kind: "Person"; fields: Person }`,
            'generatedTypes',
            'Person',
        ),
    );
});

test('it renders enum variants on multiple lines when they are too long', () => {
    expectType(
        enumTypeNode([
            enumVariantTypeNode('move', {
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'firstFieldWithALongName', type: integerTypeNode('u64') }),
                    structFieldTypeNode({ identifier: 'secondFieldWithALongName', type: integerTypeNode('u64') }),
                    structFieldTypeNode({ identifier: 'thirdFieldWithALongName', type: integerTypeNode('u64') }),
                ]),
            }),
            enumVariantTypeNode('quit'),
        ]),
        `| {
        __kind: "Move";
        firstFieldWithALongName: number /* u64 */;
        secondFieldWithALongName: number /* u64 */;
        thirdFieldWithALongName: number /* u64 */;
    }
    | { __kind: "Quit" }`,
    );
});

test('it ignores fixed-point information', () => {
    expectType(fixedPointTypeNode(integerTypeNode('u64'), { scale: 9, unit: 'SOL' }), 'number /* u64 */');
});

test('it renders float types', () => {
    expectType(floatTypeNode('f64'), 'number /* f64 */');
});

test('it renders instructions', () => {
    expectType(
        instructionNode({
            data: structTypeNode([
                structFieldTypeNode({ identifier: 'discriminator', type: integerTypeNode('u8') }),
                structFieldTypeNode({ identifier: 'authority', type: publicKeyTypeNode() }),
                structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u32') }),
                structFieldTypeNode({ identifier: 'name', type: stringTypeNode('utf8') }),
            ]),
            identifier: 'initializePerson',
        }),
        'type InitializePersonInstruction = { discriminator: number /* u8 */; authority: Address; age: number /* u32 */; name: string }',
    );
});

test('it renders instructions whose data links to a defined type', () => {
    expectType(
        instructionNode({ data: definedTypeLinkNode('initializePersonArgs'), identifier: 'initializePerson' }),
        addFragmentImports(
            fragment`type InitializePersonInstruction = InitializePersonArgs`,
            'generatedTypes',
            'InitializePersonArgs',
        ),
    );
});

test('it renders instructions without data', () => {
    expectType(instructionNode({ identifier: 'ping' }), 'type PingInstruction = {}');
});

test('it renders integer types', () => {
    expectType(integerTypeNode('u32'), 'number /* u32 */');
    expectType(integerTypeNode('shortU16'), 'number /* shortU16 */');
});

test('it renders map types', () => {
    expectType(
        mapTypeNode(stringTypeNode('utf8'), integerTypeNode('u32'), fixedCountNode(3)),
        'Map<string, number /* u32 */>',
    );
});

test('it renders option types', () => {
    expectType(optionTypeNode(stringTypeNode('utf8')), 'Option<string>');
});

test('it renders public key types', () => {
    expectType(publicKeyTypeNode(), 'Address');
});

test('it renders remainder option types', () => {
    expectType(remainderOptionTypeNode(stringTypeNode('utf8')), 'Option<string>');
});

test('it renders set types', () => {
    expectType(setTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), 'Set<string>');
});

test('it renders string types', () => {
    expectType(stringTypeNode('utf8'), 'string');
});

test('it renders struct types', () => {
    expectType(structTypeNode([]), '{}');
    expectType(
        structTypeNode([
            structFieldTypeNode({ identifier: 'name', type: stringTypeNode('utf8') }),
            structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u32') }),
        ]),
        '{ name: string; age: number /* u32 */ }',
    );
    expectType(
        structTypeNode([
            structFieldTypeNode({ identifier: 'firstFieldInTheTupleWithALongName', type: stringTypeNode('utf8') }),
            structFieldTypeNode({ identifier: 'secondFieldInTheTupleWithALongName', type: stringTypeNode('utf8') }),
            structFieldTypeNode({ identifier: 'thirdFieldInTheTupleWithALongName', type: stringTypeNode('utf8') }),
            structFieldTypeNode({
                identifier: 'nestedStruct',
                type: structTypeNode([
                    structFieldTypeNode({ identifier: 'name', type: stringTypeNode('utf8') }),
                    structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u32') }),
                ]),
            }),
        ]),
        `{
    firstFieldInTheTupleWithALongName: string;
    secondFieldInTheTupleWithALongName: string;
    thirdFieldInTheTupleWithALongName: string;
    nestedStruct: { name: string; age: number /* u32 */ };
}`,
    );
});

test('it ignores transforms', () => {
    const string = (transforms: Parameters<typeof stringTypeNode>[1]) => stringTypeNode('utf8', transforms);
    expectType(string({ transforms: [fixedSizeTransformNode(42)] }), 'string');
    expectType(string({ transforms: [hiddenPrefixTransformNode([])] }), 'string');
    expectType(string({ transforms: [hiddenSuffixTransformNode([])] }), 'string');
    expectType(string({ transforms: [postOffsetTransformNode(4)] }), 'string');
    expectType(string({ transforms: [preOffsetTransformNode(4)] }), 'string');
    expectType(string({ transforms: [sentinelTransformNode(constantValueNodeFromString('base16', 'ff'))] }), 'string');
    expectType(string({ transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }), 'string');
    expectType(
        string({ transforms: [sizePrefixTransformNode(integerTypeNode('u32')), fixedSizeTransformNode(64)] }),
        'string',
    );
});

test('it renders tuple types', () => {
    expectType(tupleTypeNode([stringTypeNode('utf8'), integerTypeNode('u32')]), '[string, number /* u32 */]');
    expectType(
        tupleTypeNode([
            definedTypeLinkNode('firstItemInTheTupleWithALongName'),
            definedTypeLinkNode('secondItemInTheTupleWithALongName'),
            definedTypeLinkNode('thirdItemInTheTupleWithALongName'),
            tupleTypeNode([stringTypeNode('utf8'), integerTypeNode('u32')]),
        ]),
        addFragmentImports(
            fragment`[
    FirstItemInTheTupleWithALongName,
    SecondItemInTheTupleWithALongName,
    ThirdItemInTheTupleWithALongName,
    [string, number /* u32 */],
]`,
            'generatedTypes',
            [
                'FirstItemInTheTupleWithALongName',
                'SecondItemInTheTupleWithALongName',
                'ThirdItemInTheTupleWithALongName',
            ],
        ),
    );
});

test('it renders zeroable option types', () => {
    expectType(zeroableOptionTypeNode(stringTypeNode('utf8')), 'Option<string>');
});
