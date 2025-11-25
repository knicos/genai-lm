export function squeezeArray(arr: unknown[]): unknown | unknown[] {
    if (arr.length === 1) {
        const item = arr[0];
        if (Array.isArray(item)) {
            return squeezeArray(item);
        } else {
            return item;
        }
    } else {
        return arr.map((item) => {
            if (Array.isArray(item)) {
                return squeezeArray(item);
            } else {
                return item;
            }
        });
    }
}
