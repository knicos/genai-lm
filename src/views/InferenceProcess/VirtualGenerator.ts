import { Conversation, IGenerateOptions, IGenerator, TeachableLLM } from '@genai-fi/nanogpt';
import EE from 'eventemitter3';

interface ExtendedConversation extends Conversation {
    _completed?: boolean;
}

export default class VirtualGenerator extends EE<'start' | 'stop' | 'tokens' | 'reset'> implements IGenerator {
    //public model: TeachableLLM;
    public generator: IGenerator;
    private embeddingsData: { name: string; tensor: number[][] }[][] = [];
    private probabilitiesData: number[][][] = [];
    private attentionData: number[][][][][] = [];
    private lastLoss: number | null = null;
    private lastMultinomialRand: number | null = null;
    private tokens: number[] = [];
    private conversation: Conversation[] = [];
    private stepFn?: () => Promise<void>;
    private resolveGenerate?: (conversation: Conversation[]) => void;

    constructor(generator: IGenerator | TeachableLLM) {
        super();
        if (generator instanceof TeachableLLM) {
            this.generator = generator.generator();
        } else {
            this.generator = generator;
            this.generator.removeAllListeners();
            this.embeddingsData = this.generator.getEmbeddingsData();
            this.probabilitiesData = this.generator.getProbabilitiesData();
            this.attentionData = this.generator.getAttentionData();
            this.lastLoss = this.generator.getLastLoss();
            this.tokens = this.generator.getTokens();
            this.conversation = this.generator.getConversation();
            this.lastMultinomialRand = this.generator.getLastMultinomialRand();
        }
    }

    async step(prompt: Conversation[], options?: IGenerateOptions): Promise<Conversation[]>;
    async step(options?: IGenerateOptions): Promise<Conversation[]>;
    public async step(
        promptOrOptions?: Conversation[] | IGenerateOptions,
        options?: IGenerateOptions
    ): Promise<Conversation[]> {
        if (Array.isArray(promptOrOptions)) {
            return this.generator.step(promptOrOptions, options);
        } else {
            return this.generator.step(promptOrOptions);
        }
    }

    async generate(prompt: Conversation[], options?: IGenerateOptions): Promise<Conversation[]>;
    async generate(options?: IGenerateOptions): Promise<Conversation[]>;
    public async generate(
        promptOrOptions?: Conversation[] | IGenerateOptions,
        options?: IGenerateOptions
    ): Promise<Conversation[]> {
        if (Array.isArray(promptOrOptions)) {
            this.stepFn = async () => {
                const conversation = (await this.generator.step(promptOrOptions, {
                    ...options,
                    includeProbabilities: true,
                    attentionScores: true,
                    embeddings: 'softmax',
                })) as ExtendedConversation[];
                if (conversation[conversation.length - 1]._completed) {
                    this.terminate();
                }
            };
        } else {
            this.stepFn = async () => {
                const conversation = (await this.generator.step({
                    ...promptOrOptions,
                    includeProbabilities: true,
                    attentionScores: true,
                    embeddings: 'softmax',
                })) as ExtendedConversation[];
                if (conversation[conversation.length - 1]._completed) {
                    this.terminate();
                }
            };
        }

        return new Promise((resolve) => {
            this.resolveGenerate = resolve;
            this.emit('start');
        });
    }

    // Called to commit the result to the original output
    public finishStep() {
        // Capture the data locally.
        this.embeddingsData = this.generator.getEmbeddingsData();
        this.probabilitiesData = this.generator.getProbabilitiesData();
        this.attentionData = this.generator.getAttentionData();
        this.lastLoss = this.generator.getLastLoss();
        this.tokens = this.generator.getTokens();
        this.conversation = this.generator.getConversation();
        this.lastMultinomialRand = this.generator.getLastMultinomialRand();
        this.emit('tokens');
    }

    private terminate() {
        if (this.resolveGenerate) {
            this.resolveGenerate(this.generator.getConversation());
            this.resolveGenerate = undefined;
        }
        this.emit('stop');
    }

    // Begin next token but delay commit.
    public async next() {
        if (this.stepFn) {
            await this.stepFn();
        }
    }

    stop(): void {
        this.generator.stop();
        this.terminate();
    }

    getConversation() {
        return this.conversation;
    }

    getEmbeddingsData(): { name: string; tensor: number[][] }[][] {
        return this.embeddingsData;
    }

    getProbabilitiesData(): number[][][] {
        return this.probabilitiesData;
    }

    getAttentionData(): number[][][][][] {
        return this.attentionData;
    }

    getLastLoss(): number | null {
        return this.lastLoss;
    }

    getLastMultinomialRand(): number | null {
        return this.lastMultinomialRand;
    }

    getTokens() {
        return this.tokens;
    }

    dispose() {
        this.stop();
        //this.generator.dispose();
        this.removeAllListeners();
        this.generator.removeAllListeners();
    }

    reset() {
        this.generator.reset();
        this.emit('reset');
    }
}
