import { GPTConfig } from '@genai-fi/nanogpt';

export interface TrainingStats {
    duration: number;
    samples: number;
    validationLoss: number;
}

export interface ModelCardItem {
    id: string;
    url?: string;
    name: string;
    parameters: number;
    trained: boolean;
    tokeniser?: 'char' | 'bpe';
    config?: Partial<GPTConfig>;
    trainingStats?: TrainingStats;
    example?: string;
}
