export default function extractData(dataset: string[], startIndex: number, endIndex: number): string {
    // Pretend to be a single string and extract a slice
    let currentIndex = 0;
    const extracted: string[] = [];

    for (const data of dataset) {
        const dataLength = data.length;
        if (currentIndex + dataLength < startIndex) {
            // Not yet at the start index
            currentIndex += dataLength;
            continue;
        }
        if (currentIndex > endIndex) {
            // Already past the end index
            break;
        }

        // Calculate the slice within this data chunk
        const sliceStart = Math.max(0, startIndex - currentIndex);
        const sliceEnd = Math.min(dataLength, endIndex - currentIndex);
        extracted.push(data.slice(sliceStart, sliceEnd));

        currentIndex += dataLength;
    }

    return extracted.join('');
}
