import { Conversation } from '@genai-fi/nanogpt';
import { LLM, LMStudioClient } from '@lmstudio/sdk';
import EE from 'eventemitter3';

export interface InstructTemplate {
    template: string;
    placeholders?: Record<string, string[]>;
}

interface IntructGeneratorOptions {
    count?: number;
    rate?: number;
    dataSet?: string[]; // Responses for 'reverse', Prompts for 'evolve'
    seedConversations?: Conversation[][]; // For 'seed' mode
    mode: 'reverse' | 'direct' | 'seed' | 'evolve';
    templates?: InstructTemplate[];
    temperature?: number;
}

export default class InstructGenerator extends EE<'conversation'> {
    private client: LMStudioClient;
    private model: LLM | null = null;
    private active = false;

    constructor() {
        super();
        this.client = new LMStudioClient();
    }

    async initialize() {
        const models = await this.client.repository.searchModels({ limit: 1 });
        if (models.length === 0) {
            const model = await this.client.llm.model('google/gemma-3-1b');
            this.model = model;
            return;
        }
        const model = await this.client.llm.model(models[0].name);
        this.model = model;
    }

    async start(options?: IntructGeneratorOptions): Promise<Conversation[][]> {
        if (!this.model) {
            throw new Error('Model not initialized. Call initialize() first.');
        }

        const instructions: Conversation[][] = [];
        const count = options?.count || 1;
        const rate = options?.rate || 1;
        const mode = options?.mode || 'reverse';

        this.active = true;

        for (let i = 0; i < count && this.active; i++) {
            let userContent = '';
            let assistantContent = '';

            // Helper to fill placeholders
            const fillTemplate = (tmpl: InstructTemplate, input?: string) => {
                let txt = tmpl.template;
                if (input) txt = txt.replace('{{input}}', input);
                if (tmpl.placeholders) {
                    for (const [key, values] of Object.entries(tmpl.placeholders)) {
                        const val = values[Math.floor(Math.random() * values.length)];
                        txt = txt.split(`{{${key}}}`).join(val);
                    }
                }
                return txt;
            };

            const getRandomData = () => {
                const arr = options?.dataSet || [];
                return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : '';
            };

            const getRandomTemplate = () => {
                const arr = options?.templates || [];
                return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
            };

            try {
                if (mode === 'reverse') {
                    // Logic: Take answer, generate question
                    const targetResponse = getRandomData();
                    const defaultTmpl = {
                        template: `Generate only a tiny simple instruction prompt based on the following response:\n{{input}}\nInstruction:`,
                    };
                    const tmpl = getRandomTemplate() || defaultTmpl;

                    const prompt = fillTemplate(tmpl, targetResponse);
                    const response = await this.model.respond(prompt);

                    userContent = response.content;
                    assistantContent = targetResponse;
                } else if (mode === 'direct') {
                    // Logic: Generate question from template, ask model for answer
                    const tmpl = getRandomTemplate();
                    if (!tmpl) throw new Error('Direct mode requires templates');

                    userContent = fillTemplate(tmpl);
                    const response = await this.model.respond(userContent, {
                        temperature: options?.temperature ?? 0.8,
                    });
                    assistantContent = response.content;
                } else if (mode === 'seed') {
                    // Logic: Use existing conversations to inspire a new user prompt
                    const seeds = options?.seedConversations || [];
                    if (seeds.length === 0) throw new Error('Seed mode requires seedConversations');

                    // Pick 3 random examples to act as few-shot
                    const examples = seeds
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 3)
                        .map((c) => c.find((m) => m.role === 'user')?.content)
                        .filter(Boolean)
                        .join('\n');

                    const prompt = `Here are some example tasks:\n${examples}\n\nGenerate one new, unique task in a similar style (only output the task):`;
                    const taskResponse = await this.model.respond(prompt);

                    userContent = taskResponse.content.trim();
                    const answerResponse = await this.model.respond(userContent);
                    assistantContent = answerResponse.content;
                } else if (mode === 'evolve') {
                    // Logic: Evolve a simple prompt into a complex one
                    const originalPrompt = getRandomData();
                    if (!originalPrompt) throw new Error('Evolve mode requires dataSet prompts');

                    const prompt = `Rewrite the following instruction to be more complex, detailed, and difficult:\n${originalPrompt}\n\nNew Instruction:`;
                    const evolvedResponse = await this.model.respond(prompt);

                    userContent = evolvedResponse.content.trim();
                    const answerResponse = await this.model.respond(userContent);
                    assistantContent = answerResponse.content;
                }

                const newConvo: Conversation[] = [
                    { role: 'user', content: userContent },
                    { role: 'assistant', content: assistantContent },
                ];
                instructions.push(newConvo);
                this.emit('conversation', newConvo);
            } catch (err) {
                console.error(`Generation error usage mode ${mode}:`, err);
            }

            if (i < count - 1 && this.active) {
                await new Promise((resolve) => setTimeout(resolve, 1000 / rate));
            }
        }

        return instructions;
    }

    stop() {
        this.active = false;
    }
}
