import { CODAMA_ERROR__VERSION_MISMATCH, CodamaError } from '@codama/errors';
import { createRenderMap, mergeRenderMaps } from '@codama/fragments';
import { camelCase } from '@codama/fragments/casing';
import { CODAMA_VERSION, getCodamaVersionMajor, isNode } from '@codama/nodes';
import {
    extendVisitor,
    getByteSizeVisitor,
    interceptFirstVisitVisitor,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
} from '@codama/visitors-core';

import {
    getAccountPageFragment,
    getDefinedTypePageFragment,
    getInstructionPageFragment,
    getPdaPageFragment,
    getProgramPageFragment,
} from '../fragments';
import { Fragment, RenderMapOptions } from '../utils';
import { getTypeVisitor } from './getTypeVisitor';
import { getValueVisitor } from './getValueVisitor';

export function getRenderMapVisitor(options: RenderMapOptions = {}) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    const extension = options.extension ?? 'md';
    const indexFilename = options.indexFilename ?? 'README';
    const typeVisitor = getTypeVisitor({ stack, typeIndent: options.typeIndent });
    const valueVisitor = getValueVisitor({ stack });
    const byteSizeVisitor = getByteSizeVisitor(linkables, { stack });

    return pipe(
        staticVisitor(() => createRenderMap<Fragment>(), {
            keys: ['rootNode', 'programNode', 'pdaNode', 'accountNode', 'definedTypeNode', 'instructionNode'],
        }),
        v =>
            extendVisitor(v, {
                visitAccount(node) {
                    const pda = node.pda ? linkables.get([...stack.getPath(), node.pda]) : undefined;
                    const size = visit(node, byteSizeVisitor);
                    return createRenderMap(
                        `accounts/${camelCase(node.identifier)}.${extension}`,
                        getAccountPageFragment(node, typeVisitor, size ?? undefined, pda),
                    );
                },

                visitDefinedType(node) {
                    return createRenderMap(
                        `definedTypes/${camelCase(node.identifier)}.${extension}`,
                        getDefinedTypePageFragment(node, typeVisitor),
                    );
                },

                visitInstruction(node) {
                    return createRenderMap(
                        `instructions/${camelCase(node.identifier)}.${extension}`,
                        getInstructionPageFragment(node, typeVisitor),
                    );
                },

                visitPda(node) {
                    return createRenderMap(
                        `pdas/${camelCase(node.identifier)}.${extension}`,
                        getPdaPageFragment(node, typeVisitor, valueVisitor),
                    );
                },

                visitProgram(node, { self }) {
                    return mergeRenderMaps([
                        createRenderMap(`${indexFilename}.${extension}`, getProgramPageFragment(node)),
                        ...(node.accounts ?? []).map(n => visit(n, self)),
                        ...(node.definedTypes ?? []).map(n => visit(n, self)),
                        ...(node.instructions ?? []).map(n => visit(n, self)),
                        ...(node.pdas ?? []).map(n => visit(n, self)),
                    ]);
                },

                visitRoot(node, { self }) {
                    // Here, we ignore `node.additionalPrograms` for simplicity.
                    return visit(node.program, self);
                },
            }),
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
        // Trees of another major version of the Codama standard have other node kinds and attributes,
        // so they are rejected before rendering anything.
        v =>
            interceptFirstVisitVisitor(v, (node, next) => {
                if (
                    isNode(node, 'rootNode') &&
                    getCodamaVersionMajor(node.version) !== getCodamaVersionMajor(CODAMA_VERSION)
                ) {
                    throw new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, {
                        codamaVersion: CODAMA_VERSION,
                        rootVersion: node.version,
                    });
                }
                return next(node);
            }),
    );
}
