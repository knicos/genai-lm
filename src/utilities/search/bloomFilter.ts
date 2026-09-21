export function mix32(x: number): number {
    x = x >>> 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return x >>> 0;
}

function hashNGram(ngram: Uint16Array | number[]): [number, number] {
    let h1 = 0x9e3779b9 >>> 0; // 32-bit golden ratio
    let h2 = 0xc2b2ae35 >>> 0; // Murmur3 constant

    for (const token of ngram) {
        const t = (token >>> 0) + 1;
        h1 = mix32((h1 ^ t) >>> 0);
        h2 = mix32((h2 + ((t << 1) >>> 0)) >>> 0);
    }

    if ((h2 & 1) === 0) {
        h2 ^= 1;
    }

    return [h1 >>> 0, h2 >>> 0];
}

function setBit(bits: Uint8Array, index: number): void {
    const byteIndex = index >> 3;
    const bitMask = 1 << (index & 7);
    bits[byteIndex] |= bitMask;
}

function hasBit(bits: Uint8Array, index: number): boolean {
    const byteIndex = index >> 3;
    const bitMask = 1 << (index & 7);
    return (bits[byteIndex] & bitMask) !== 0;
}

export function createNGramBloom(tokens: Uint16Array, n: number, m: number, k: number): Uint8Array {
    const bloom = new Uint8Array(Math.ceil(m / 8));
    const windowCount = Math.max(0, tokens.length - n + 1);

    if (windowCount === 0) {
        return bloom;
    }

    const bitCount = m;

    for (let start = 0; start < windowCount; start++) {
        // Inline the 32-bit hashNGram for performance
        let h1 = 0x9e3779b9 >>> 0;
        let h2 = 0xc2b2ae35 >>> 0;
        const end = start + n;

        for (let i = start; i < end; ++i) {
            const token = tokens[i];
            const t = (token >>> 0) + 1;
            h1 = mix32((h1 ^ t) >>> 0);
            h2 = mix32((h2 + ((t << 1) >>> 0)) >>> 0);
        }

        if ((h2 & 1) === 0) {
            h2 ^= 1;
        }

        for (let i = 0; i < k; i++) {
            const idx = ((h1 + Math.imul(i, h2)) >>> 0) % bitCount;
            setBit(bloom, idx);
        }
    }

    return bloom;
}

export function buildBloomIndices(ngram: Uint16Array | number[], m: number, k: number): number[] {
    const [h1, h2] = hashNGram(ngram);
    const bitCount = m;

    const indices: number[] = [];
    for (let i = 0; i < k; i++) {
        const idx = ((h1 + Math.imul(i, h2)) >>> 0) % bitCount;
        indices.push(idx);
    }
    return indices;
}

export function hasBloomMembership(bloom: Uint8Array, indices: number[]): boolean {
    for (const idx of indices) {
        if (!hasBit(bloom, idx)) {
            return false;
        }
    }
    return true;
}

export function hasNGramMembership(bloom: Uint8Array, ngram: Uint16Array | number[], m: number, k: number): boolean {
    const indices = buildBloomIndices(ngram, m, k);
    return hasBloomMembership(bloom, indices);
}
