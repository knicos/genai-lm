import { Conversation, TeachableLLM } from '@genai-fi/nanogpt';

interface ChatQueue {
    id: string;
    active: boolean;
    input: string | Conversation[];
    loRA?: string;
    onUpdate: (id: string, message: string, completed: boolean) => void;
    onError: (id: string, error: string) => void;
}

export default class ChatManager {
    private queue: ChatQueue[] = [];
    private busy = false;
    private conversations = new Map<string, Conversation[]>();

    constructor(private model: TeachableLLM) {}

    startConversation(
        id: string,
        input: string | Conversation[],
        onUpdate: (id: string, message: string, completed: boolean) => void,
        onError: (id: string, error: string) => void,
        loRA?: string
    ) {
        // Append or add user conversation
        const userMessage: Conversation[] = Array.isArray(input) ? input : [{ role: 'user', content: input }];

        if (this.conversations.has(id)) {
            const existingConvo = this.conversations.get(id) || [];
            existingConvo.push(...userMessage);
            this.conversations.set(id, existingConvo);
        } else {
            this.conversations.set(id, [...userMessage]);
        }

        // Queue the conversation for generation
        this.queue.push({ id, input, loRA, onUpdate, onError, active: true });
        this.processQueue();
        return id;
    }

    stopConversation(id: string) {
        const convo = this.queue.find((c) => c.id === id);
        if (convo) {
            convo.active = false;
        }
    }

    stopAll() {
        this.queue.forEach((c) => (c.active = false));
    }

    getConversation(id: string): Conversation[] {
        return this.conversations.get(id) || [];
    }

    private appendConversation(id: string, message: string) {
        const convo = this.conversations.get(id) || [];
        convo.push({ role: 'assistant', content: message });
        this.conversations.set(id, convo);
    }

    private async processQueue() {
        if (this.queue.length === 0) {
            return;
        }
        if (this.busy) return;

        this.busy = true;
        const q = this.queue[0];
        const { id, input, onUpdate, onError } = q;

        try {
            const generator = this.model.generator();
            let step = 0;

            generator.on('tokens', () => {
                step++;
                if (step % 5 !== 0) return; // Throttle updates to every 5 tokens
                const convo = generator.getConversation();
                const lastMessage = convo[convo.length - 1];

                if (q.active === false) {
                    generator.stop();
                    onUpdate(id, lastMessage.content, true);
                } else {
                    onUpdate(id, lastMessage.content, false);
                }
            });

            const response = await generator.generate(
                Array.isArray(input) ? input : [{ role: 'user', content: input }],
                {
                    maxLength: 1000,
                    topP: 0.9,
                    temperature: 0.8,
                    loraName: q.loRA,
                }
            );

            this.appendConversation(id, response[response.length - 1].content);
            onUpdate(id, response[response.length - 1].content, true);
            generator.dispose();
        } catch (error) {
            console.error('Error processing conversation:', error);
            onError(id, 'An error occurred while generating the response.');
        } finally {
            // Remove the processed conversation from the queue and process the next one
            this.queue.shift();
            this.busy = false;
            setTimeout(() => this.processQueue(), 0); // Process the next conversation in the queue
        }
    }
}
