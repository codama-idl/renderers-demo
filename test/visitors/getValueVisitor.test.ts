import { CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, CodamaError } from '@codama/errors';
import {
    arrayValueNode,
    booleanValueNode,
    bytesValueNode,
    constantValueNode,
    constantValueNodeFromBytes,
    enumValueNode,
    floatValueNode,
    injectedValueNode,
    integerTypeNode,
    integerValueNode,
    mapEntryValueNode,
    mapValueNode,
    noneValueNode,
    ProgramIdValueNode,
    programIdValueNode,
    publicKeyValueNode,
    setValueNode,
    someValueNode,
    stringValueNode,
    structFieldValueNode,
    structValueNode,
    tupleValueNode,
    ValueNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { addFragmentImports, Fragment, fragment } from '../../src/utils';
import { getValueVisitor } from '../../src/visitors';

function expectValue(node: ProgramIdValueNode | ValueNode, expected: Fragment | string): void {
    expect(visit(node, getValueVisitor())).toStrictEqual(
        typeof expected === 'string' ? fragment`${expected}` : expected,
    );
}

test('it renders array values', () => {
    expectValue(arrayValueNode([]), '[]');
    expectValue(arrayValueNode([integerValueNode('1'), integerValueNode('2')]), '[1, 2]');
});

test('it renders boolean values', () => {
    expectValue(booleanValueNode(true), 'true');
    expectValue(booleanValueNode(false), 'false');
});

test('it renders byte values', () => {
    expectValue(bytesValueNode('utf8', ''), '0x');
    expectValue(bytesValueNode('utf8', 'hello'), '0x68656c6c6f');
    expectValue(bytesValueNode('base16', 'deadface'), '0xdeadface');
    expectValue(bytesValueNode('base58', 'HeLLo'), '0x0b39f6f0');
    expectValue(bytesValueNode('base64', 'hello'), '0x85e965');
});

test('it renders constant values', () => {
    expectValue(constantValueNode(integerTypeNode('u8'), integerValueNode('42')), '42');
    expectValue(constantValueNodeFromBytes('utf8', 'hello'), '0x68656c6c6f');
    expectValue(constantValueNodeFromBytes('base16', 'deadbeef'), '0xdeadbeef');
    expectValue(constantValueNodeFromBytes('base58', 'HeLLo'), '0x0b39f6f0');
    expectValue(constantValueNodeFromBytes('base64', 'hello'), '0x85e965');
});

test('it renders enum values', () => {
    expectValue(
        enumValueNode('direction', 'left'),
        addFragmentImports(fragment`Direction.Left`, 'generatedTypes', 'Direction'),
    );
    expectValue(
        enumValueNode('command', 'move', {
            value: structValueNode([
                structFieldValueNode('x', integerValueNode('1')),
                structFieldValueNode('y', integerValueNode('2')),
            ]),
        }),
        addFragmentImports(fragment`Command.Move({ x: 1, y: 2 })`, 'generatedTypes', 'Command'),
    );
    expectValue(
        enumValueNode('command', 'write', { value: tupleValueNode([stringValueNode('hello')]) }),
        addFragmentImports(fragment`Command.Write(["hello"])`, 'generatedTypes', 'Command'),
    );
    expectValue(
        enumValueNode('token_state', 'is_frozen'),
        addFragmentImports(fragment`TokenState.IsFrozen`, 'generatedTypes', 'TokenState'),
    );
});

test('it renders map values', () => {
    expectValue(
        mapValueNode([
            mapEntryValueNode(stringValueNode('Alice'), integerValueNode('30')),
            mapEntryValueNode(stringValueNode('Bob'), integerValueNode('42')),
            mapEntryValueNode(stringValueNode('Carla'), integerValueNode('39')),
        ]),
        'new Map([["Alice", 30], ["Bob", 42], ["Carla", 39]])',
    );
});

test('it renders none values', () => {
    expectValue(noneValueNode(), 'null');
});

test('it renders float values', () => {
    expectValue(floatValueNode('0'), '0');
    expectValue(floatValueNode('-2.5'), '-2.5');
});

test('it renders integer values', () => {
    expectValue(integerValueNode('0'), '0');
    expectValue(integerValueNode('42'), '42');
    expectValue(integerValueNode('-7'), '-7');
    expectValue(integerValueNode('18446744073709551615'), '18446744073709551615');
});

test('it renders program id values', () => {
    expectValue(programIdValueNode(), 'programId');
});

test('it renders public key values', () => {
    expectValue(
        publicKeyValueNode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        '"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"',
    );
});

test('it renders set values', () => {
    expectValue(setValueNode([]), 'new Set([])');
    expectValue(setValueNode([integerValueNode('1'), integerValueNode('2')]), 'new Set([1, 2])');
});

test('it ignores some values', () => {
    expectValue(someValueNode(integerValueNode('42')), '42');
    expectValue(someValueNode(stringValueNode('hello')), '"hello"');
});

test('it renders string values', () => {
    expectValue(stringValueNode(''), '""');
    expectValue(stringValueNode('hello'), '"hello"');
});

test('it renders struct values', () => {
    expectValue(structValueNode([]), '{}');
    expectValue(
        structValueNode([
            structFieldValueNode('name', stringValueNode('Alice')),
            structFieldValueNode('age', integerValueNode('30')),
        ]),
        '{ name: "Alice", age: 30 }',
    );
    expectValue(
        structValueNode([structFieldValueNode('first_name', stringValueNode('Alice'))]),
        '{ firstName: "Alice" }',
    );
});

test('it renders tuple values', () => {
    expectValue(tupleValueNode([]), '[]');
    expectValue(tupleValueNode([stringValueNode('Alice'), integerValueNode('30')]), '["Alice", 30]');
});

test('it throws with the path of values it cannot render', () => {
    const injectedValue = injectedValueNode({ key: 'amount' });
    const field = structFieldValueNode('amount', injectedValue);
    const struct = structValueNode([field]);
    expect(() => visit(struct, getValueVisitor())).toThrow(
        new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { path: [struct, field, injectedValue] }),
    );
});
