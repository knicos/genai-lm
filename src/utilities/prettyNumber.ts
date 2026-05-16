export default function prettyNumber(
    num: number,
    t: (key: string) => string,
    postfix?: string,
    fixed?: number
): string {
    if (num >= 1e9) {
        return `${(num / 1e9).toFixed(fixed ?? 1)}${t('app.billion')}${postfix || ''}`;
    } else if (num >= 1e6) {
        return `${(num / 1e6).toFixed(fixed ?? 1)}${t('app.million')}${postfix || ''}`;
    } else if (num >= 1e3) {
        return `${(num / 1e3).toFixed(fixed ?? 0)}${t('app.thousand')}${postfix || ''}`;
    } else {
        return num.toFixed(fixed ?? 0) + (postfix || '');
    }
}
