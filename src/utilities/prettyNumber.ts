export default function prettyNumber(num: number, t: (key: string) => string): string {
    if (num >= 1e9) {
        return `${(num / 1e9).toFixed(1)}${t('app.billion')}`;
    } else if (num >= 1e6) {
        return `${(num / 1e6).toFixed(1)}${t('app.million')}`;
    } else if (num >= 1e3) {
        return `${(num / 1e3).toFixed(0)}${t('app.thousand')}`;
    } else {
        return num.toString();
    }
}
