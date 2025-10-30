export function qualityToColor(quality: number): string {
    // Interpolate between light gray and brand color based on quality
    const brand = { r: 76, g: 175, b: 80 };
    const gray = { r: 200, g: 200, b: 200 }; // Light gray

    const r = Math.round(gray.r + (brand.r - gray.r) * quality);
    const g = Math.round(gray.g + (brand.g - gray.g) * quality);
    const b = Math.round(gray.b + (brand.b - gray.b) * quality);

    return `rgba(${r}, ${g}, ${b}, 0.6)`;
}
