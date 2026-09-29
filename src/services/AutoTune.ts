import { Conversation, TeachableLLM } from '@genai-fi/nanogpt';
import { ApiSettings } from '../state/api';
import EE from 'eventemitter3';

type AutoTuneSettings = ApiSettings;

interface AutoTuneOptions {
    user?: string;
    instruction: string;
    size: number; // Number of conversations.
}

interface TeacherMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface TeacherChoice {
    message?: {
        content?: string;
    };
}

interface TeacherCompletionResponse {
    choices?: TeacherChoice[];
}

interface AutoTuneEvents {
    conversation: (conversation: Conversation[]) => void;
}

export default class AutoTune extends EE<AutoTuneEvents> {
    private model: TeachableLLM;
    private settings: AutoTuneSettings;

    constructor(model: TeachableLLM, settings: AutoTuneSettings) {
        super();
        this.model = model;
        this.settings = settings;
    }

    public async tune(options: AutoTuneOptions): Promise<Conversation[][]> {
        if (!options.instruction.trim()) {
            throw new Error('AutoTune requires a non-empty instruction.');
        }
        if (!Number.isFinite(options.size) || options.size < 1) {
            throw new Error('AutoTune size must be at least 1.');
        }

        const conversations: Conversation[][] = [];

        for (let i = 0; i < options.size; i++) {
            const seed = await this.generateStudentText();
            const userPrompt = await this.generateTeacherPrompt(
                seed,
                options.user ?? 'Create a short prompt that might generate something similar to the seed above.'
            );
            const studentAnswer = await this.generateStudentText(userPrompt);
            const correctedAnswer = await this.correctWithTeacher(options.instruction, userPrompt, studentAnswer);

            conversations.push([
                { role: 'user', content: userPrompt },
                { role: 'assistant', content: correctedAnswer },
            ]);

            this.emit('conversation', conversations[conversations.length - 1]);
        }

        return conversations;
    }

    private async generateTeacherPrompt(seed: string, user: string): Promise<string> {
        const content = await this.callTeacher([
            {
                role: 'system',
                content:
                    'You create single-turn user prompts for instruction tuning datasets. Return only the user prompt text.',
            },
            {
                role: 'user',
                content: [
                    `Seed response: ${seed.trim()}`,
                    `Prompt instruction: ${user.trim()}`,
                    'Create one realistic user prompt that matches the prompt instruction. Use the seed response for inspiration only, do not directly refer to the seed response. Keep it concise and specific with only the user prompt.',
                    'Prompt: ',
                ].join('\n\n'),
            },
        ]);

        return content.trim();
    }

    private async correctWithTeacher(instruction: string, userPrompt: string, studentAnswer: string): Promise<string> {
        const content = await this.callTeacher([
            {
                role: 'system',
                content:
                    'You are an expert teacher creating high-quality assistant answers for supervised fine tuning. Return only the improved final assistant response.',
            },
            {
                role: 'user',
                content: [
                    `Tuning objective: ${instruction.trim()}`,
                    `Original user prompt:\n${userPrompt.trim()}`,
                    `Current assistant answer:\n${studentAnswer.trim()}`,
                    'Improve the assistant answer so it fully aligns with the objective and correct any language errors.',
                    'Output only the corrected assistant response.',
                ].join('\n\n'),
            },
        ]);

        return content.trim();
    }

    private async generateStudentText(prompt?: string): Promise<string> {
        const hasPrompt = typeof prompt === 'string' && prompt.trim().length > 0;
        let finalText = '';
        const response = await this.model.responses.create(
            {
                input: hasPrompt ? [{ role: 'user', content: prompt }] : undefined,
                maxLength: 512,
                topP: 0.9,
                temperature: 0.8,
                noCache: false,
                nonConversational: !hasPrompt,
                background: false,
            },
            (output) => {
                const convo = output.output || [];
                const last = convo[convo.length - 1];
                finalText = last?.content ?? finalText;
            }
        );

        if (!finalText.trim()) {
            const convo = response.output || [];
            const last = convo[convo.length - 1];
            finalText = last?.content || '';
        }

        if (!finalText.trim()) {
            throw new Error('Student model returned an empty response during AutoTune generation.');
        }

        return finalText;
    }

    private async callTeacher(messages: TeacherMessage[]): Promise<string> {
        const endpoint = this.settings.endpoint?.trim();
        if (!endpoint) {
            throw new Error('AutoTune teacher endpoint is missing. Configure API endpoint in settings.');
        }

        const base = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
        const url = base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.settings.apiKey) {
            headers.Authorization = `Bearer ${this.settings.apiKey}`;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: this.settings.modelName || 'google/gemma-3-1b',
                messages,
                temperature: 0.7,
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Teacher model request failed (${res.status}): ${text || 'Unknown error'}`);
        }

        const data = (await res.json()) as TeacherCompletionResponse;
        const content = data.choices?.[0]?.message?.content?.trim() || '';
        if (!content) {
            throw new Error('Teacher model returned an empty completion.');
        }

        return content;
    }
}
