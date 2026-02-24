import { Conversation, TeachableLLM } from '@genai-fi/nanogpt';

interface ChatQueue {
    id: string;
    active: boolean;
    input: string | Conversation[];
    onUpdate: (id: string, message: string, completed: boolean) => void;
    onError: (id: string, error: string) => void;
}

export default class ChatManager {
    private queue: ChatQueue[] = [];
    private busy = false;

    constructor(private model: TeachableLLM) {}

    startConversation(
        id: string,
        input: string | Conversation[],
        onUpdate: (id: string, message: string, completed: boolean) => void,
        onError: (id: string, error: string) => void
    ) {
        // Queue the conversation for generation
        this.queue.push({ id, input, onUpdate, onError, active: true });
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
                }
            );

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
