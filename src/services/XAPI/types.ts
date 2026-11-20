export type AuditTool = 'none' | 'alternatives' | 'data-match' | 'replacer';
export type Value = string | number | boolean | null | Value[] | { [key: string]: Value };
export type Details = Record<string, Value>;

//which part of which output is being investigated
export interface SelectionContext {
    selectionId: string;
    outputId: string;
    selectedText: string;
    startToken: number;
    endToken: number;
}

//a single alternative option
export interface AlternativeOption {
    text: string;
    position: number; //alternative displayed position starts at 1
    score: number; //percentage/100
}

// data match counts
export interface MatchStatistics {
    approximateExactMatches: number;
    partialMatches: number;
}

//one training data result presented
export interface MatchResult {
    resultId: string;
    excerpt: string;
    position: number;
}

//which option did the learner choose
export interface AlternativeSelection {
    originalText: string; //original highlighted text
    alternativeText: string; //clicked alternative
    alternativeIndex: number; // alternative displayed position starts at 1
    selectionId?: string; // links back to the selection
    outputId?: string; // links to the output text id
    optionsListId?: string; // list of alternatives it chose from
}
