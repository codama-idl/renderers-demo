import { BytesEncoding } from '@codama/nodes';
import {
    getBase16Decoder,
    getBase16Encoder,
    getBase58Encoder,
    getBase64Encoder,
    getUtf8Encoder,
    ReadonlyUint8Array,
} from '@solana/codecs';

/** Encodes a string in the given encoding, e.g. `base58`, into bytes. */
export function encodeStringValue(encoding: BytesEncoding, data: string): ReadonlyUint8Array {
    switch (encoding) {
        case 'utf8':
            return getUtf8Encoder().encode(data);
        case 'base16':
            return getBase16Encoder().encode(data);
        case 'base58':
            return getBase58Encoder().encode(data);
        case 'base64':
        default:
            return getBase64Encoder().encode(data);
    }
}

/**
 * Renders a string in the given encoding as hexadecimal bytes, e.g. `0x68656c6c6f` for `hello` in `utf8`.
 */
export function getStringValueAsHexadecimals(encoding: BytesEncoding, data: string): string {
    if (encoding === 'base16') return '0x' + data;
    return '0x' + getBase16Decoder().decode(encodeStringValue(encoding, data));
}
