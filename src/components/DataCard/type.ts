export interface DataCardItem {
    id: string;
    title: string;
    sample: string;
    size: number;
    url: string;
    originURL: string;
    mime: string;
    lang: string;
    complexity: 'simple' | 'normal' | 'complex';
    instruct: boolean;
    author: string;
}
